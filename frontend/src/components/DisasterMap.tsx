import React, { useRef, useEffect } from 'react';
import type { GridCell, Robot, Victim } from '../types';

interface DisasterMapProps {
  grid: GridCell[][];
  robot: Robot | null;
  victims: Record<string, Victim>;
  width?: number;
  height?: number;
}

const CELL_COLORS: Record<string, string> = {
  empty: '#0f172a',
  wall: '#374151',
  obstacle: '#4b5563',
  fire: '#ef4444',
  smoke: '#78716c',
  dangerous_zone: '#b45309',
  safe_zone: '#166534',
  base: '#1e40af',
  blocked: '#dc2626',
  charging_station: '#7c3aed',
  victim: '#0f172a', // victim color applied separately
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const DisasterMap: React.FC<DisasterMapProps> = ({ grid, robot, victims, width = 900, height = 600 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  
  const cellW = width / cols;
  const cellH = height / rows;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw cells
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y]?.[x];
        if (!cell) continue;
        
        const cx = x * cellW;
        const cy = y * cellH;
        
        // Base color
        let color = CELL_COLORS[cell.type] || '#0f172a';
        
        // Fire cells flicker
        if (cell.type === 'fire') {
          const flicker = Math.random() * 0.3;
          color = `rgba(${239 + flicker * 16}, ${68 - flicker * 30}, ${68}, 1)`;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(cx, cy, cellW - 1, cellH - 1);
        
        // Smoke overlay
        if (cell.smoke_density > 0) {
          ctx.fillStyle = `rgba(120, 120, 120, ${cell.smoke_density * 0.5})`;
          ctx.fillRect(cx, cy, cellW - 1, cellH - 1);
        }
        
        // Hazard overlay
        if (cell.hazard_level > 0 && cell.type !== 'fire') {
          ctx.fillStyle = `rgba(180, 83, 9, ${cell.hazard_level * 0.4})`;
          ctx.fillRect(cx, cy, cellW - 1, cellH - 1);
        }
        
        // Grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cx, cy, cellW - 1, cellH - 1);
        
        // Base label
        if (cell.type === 'base') {
          ctx.fillStyle = '#93c5fd';
          ctx.font = `bold ${Math.floor(cellH * 0.55)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('B', cx + cellW / 2, cy + cellH / 2);
        }
        
        // Charging station
        if (cell.type === 'charging_station') {
          ctx.fillStyle = '#c4b5fd';
          ctx.font = `bold ${Math.floor(cellH * 0.55)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', cx + cellW / 2, cy + cellH / 2);
        }
      }
    }
    
    // Draw planned path
    if (robot?.current_path?.length) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      const path = robot.current_path;
      for (let i = robot.path_index || 0; i < path.length; i++) {
        const p = path[i];
        const px = p.x * cellW + cellW / 2;
        const py = p.y * cellH + cellH / 2;
        if (i === robot.path_index || i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw victims
    Object.values(victims).forEach(victim => {
      if (victim.rescued) return;
      const vx = victim.position.x * cellW;
      const vy = victim.position.y * cellH;
      const vc = SEVERITY_COLORS[victim.severity] || '#fff';
      
      // Victim dot with severity color
      ctx.fillStyle = vc;
      ctx.beginPath();
      ctx.arc(vx + cellW / 2, vy + cellH / 2, Math.min(cellW, cellH) * 0.35, 0, Math.PI * 2);
      ctx.fill();
      
      // Glow for critical
      if (victim.severity === 'CRITICAL') {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Victim ID label
      ctx.fillStyle = '#000';
      ctx.font = `bold ${Math.floor(cellH * 0.4)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(victim.id, vx + cellW / 2, vy + cellH / 2);
    });
    
    // Draw robot
    if (robot) {
      const rx = robot.position.x * cellW;
      const ry = robot.position.y * cellH;
      
      // Robot glow
      const gradient = ctx.createRadialGradient(
        rx + cellW / 2, ry + cellH / 2, 2,
        rx + cellW / 2, ry + cellH / 2, cellW
      );
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(rx - cellW / 2, ry - cellH / 2, cellW * 2, cellH * 2);
      
      // Robot body
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(rx + 2, ry + 2, cellW - 5, cellH - 5, 3);
      ctx.fill();
      
      // Robot label
      ctx.fillStyle = '#0c4a6e';
      ctx.font = `bold ${Math.floor(cellH * 0.5)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🤖', rx + cellW / 2, ry + cellH / 2);
    }
    
  }, [grid, robot, victims, width, height, rows, cols, cellW, cellH]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
