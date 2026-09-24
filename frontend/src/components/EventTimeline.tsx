import React, { useEffect, useRef } from 'react';
import type { SimEvent } from '../types';

const EVENT_STYLES: Record<string, { color: string; icon: string }> = {
  simulation_started: { color: 'text-green-400', icon: '▶' },
  robot_moved: { color: 'text-sky-400', icon: '→' },
  victim_detected: { color: 'text-yellow-400', icon: '👁' },
  victim_updated: { color: 'text-yellow-300', icon: '💛' },
  victim_rescued: { color: 'text-green-400', icon: '✅' },
  rescue_completed: { color: 'text-emerald-400', icon: '🚑' },
  fire_spread: { color: 'text-red-400', icon: '🔥' },
  hazard_changed: { color: 'text-orange-400', icon: '⚠' },
  decision_created: { color: 'text-blue-400', icon: '🧠' },
  replan_triggered: { color: 'text-orange-400', icon: '🔄' },
  path_invalidated: { color: 'text-red-400', icon: '🚫' },
  triage_completed: { color: 'text-yellow-400', icon: '📋' },
  mission_reassessment: { color: 'text-cyan-400', icon: '🔎' },
  path_planned: { color: 'text-blue-400', icon: '📍' },
  battery_updated: { color: 'text-purple-400', icon: '🔋' },
  mission_completed: { color: 'text-emerald-400', icon: '🏆' },
  robot_returned_base: { color: 'text-violet-400', icon: '🏠' },
  charging_started: { color: 'text-violet-400', icon: '⚡' },
  charging_completed: { color: 'text-violet-300', icon: '✨' },
  robot_state_changed: { color: 'text-slate-300', icon: '⚙' },
  tick_updated: { color: 'text-slate-600', icon: '⏱' },
};

function formatEventMessage(event: SimEvent): string {
  const { event_type, data } = event;
  
  switch (event_type) {
    case 'fire_spread': return `Fire spread to ${data?.new_cells?.length || 0} new cell(s)`;
    case 'victim_rescued': return `Victim ${data?.victim_id} rescued! Health: ${data?.health_at_rescue?.toFixed(0) || '?'}%`;
    case 'rescue_completed': return `Rescue complete. Total rescued: ${data?.total_rescued || 0}`;
    case 'replan_triggered': return `REPLANNING: ${data?.reason || 'conditions changed'}`;
    case 'path_invalidated': return `PATH INVALIDATED: ${Array.isArray(data?.unsafe_cells) ? data.unsafe_cells.length : data?.unsafe_cells || 1} cell(s) blocked`;
    case 'path_planned': return `A* path planned: ${data?.path_length || 0} cells`;
    case 'triage_completed': return 'Triage completed';
    case 'mission_reassessment': return 'Mission reassessment started';
    case 'decision_created': return `AI: ${data?.action || '?'} → ${data?.target || 'no target'}`;
    case 'robot_moved': return data?.arrived_at_target ? 'Robot arrived at target' : `Robot at (${data?.position?.x},${data?.position?.y})`;
    case 'battery_updated': return `Battery: ${data?.battery?.toFixed(1) || '?'}%`;
    case 'mission_completed': return `Mission complete! Score: ${data?.mission_score?.toFixed(1) || '?'}`;
    case 'simulation_started': return 'MISSION STARTED';
    case 'victim_detected': return `VICTIM DETECTED: ${data?.victim_id || '?'}`;
    case 'mission_reassessment': return 'MISSION REASSESSMENT';
    default: return event_type.replace(/_/g, ' ');
  }
}

interface EventTimelineProps {
  events: SimEvent[];
  maxVisible?: number;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events, maxVisible = 50 }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Filter out noisy tick_updated and battery events for cleaner display
  const displayEvents = events
    .filter(e => !['tick_updated', 'battery_updated'].includes(e.event_type))
    .slice(-maxVisible);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayEvents.length]);
  
  return (
    <div className="h-full overflow-y-auto font-mono text-xs space-y-0.5 px-2 py-1">
      {displayEvents.length === 0 ? (
        <div className="text-slate-600 text-center py-4">Awaiting events...</div>
      ) : (
        displayEvents.map((event, i) => {
          const style = EVENT_STYLES[event.event_type] || { color: 'text-slate-400', icon: '•' };
          const time = new Date(event.timestamp).toLocaleTimeString('en-US', { 
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
          });
          
          return (
            <div key={i} className="flex items-start gap-2 py-0.5 hover:bg-slate-800/40 px-1 rounded">
              <span className="text-slate-600 shrink-0">{time}</span>
              <span className={`shrink-0 ${style.color}`}>{style.icon}</span>
              <span className="text-slate-500 shrink-0">T{event.tick}</span>
              <span className={style.color}>{formatEventMessage(event)}</span>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};
