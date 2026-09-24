import type { WebSocketEvent } from '../types';

const WS_BASE = (import.meta.env.VITE_API_BASE_URL || window.location.origin)
  .replace(/^http/, 'ws');

type EventHandler = (event: WebSocketEvent) => void;

class SimulationWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private pingInterval: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private currentSimulationId: string | null = null;

  connect(simId: string): void {
    this.disconnect();
    this.currentSimulationId = simId;
    this.reconnectAttempts = 0;
    this._dispatchConnection('CONNECTING');
    this.open(simId);
  }

  private open(simId: string): void {
    this.ws = new WebSocket(`${WS_BASE}/ws/simulations/${simId}`);
    
    this.ws.onopen = () => {
      console.log('[WS] Connected to simulation', simId);
      this.reconnectAttempts = 0;
      this._dispatchConnection('CONNECTED');
      this.pingInterval = window.setInterval(() => {
        this.send({ action: 'ping' });
      }, 10000);
    };
    
    this.ws.onmessage = (e) => {
      try {
        const event: WebSocketEvent = JSON.parse(e.data);
        this._dispatch(event.type, event);
        this._dispatch('*', event);
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };
    
    this.ws.onclose = () => {
      console.log('[WS] Disconnected');
      if (this.pingInterval) clearInterval(this.pingInterval);
      if (this.currentSimulationId && this.reconnectAttempts < 5) {
        this._dispatchConnection('RECONNECTING');
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
        this.reconnectAttempts += 1;
        this.reconnectTimer = window.setTimeout(
          () => this.currentSimulationId && this.open(this.currentSimulationId),
          delay,
        );
      } else {
        this._dispatchConnection('DISCONNECTED');
      }
    };

    this.ws.onerror = (e) => {
      console.error('[WS] Error:', e);
      this._dispatchConnection('ERROR');
    };
  }

  private _dispatchConnection(status: string): void {
    this._dispatch('connection', {
      type: 'connection',
      data: { status },
    });
  }

  disconnect(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.currentSimulationId = null;
    this.reconnectAttempts = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) this.handlers.set(eventType, []);
    this.handlers.get(eventType)!.push(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: EventHandler): void {
    const list = this.handlers.get(eventType);
    if (list) this.handlers.set(eventType, list.filter(h => h !== handler));
  }

  private _dispatch(eventType: string, event: WebSocketEvent): void {
    this.handlers.get(eventType)?.forEach(h => h(event));
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new SimulationWebSocket();
