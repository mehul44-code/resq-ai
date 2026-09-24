import React from 'react';
import type { Victim } from '../types';
import { clsx } from 'clsx';

const SEVERITY_BG: Record<string, string> = {
  LOW: 'bg-green-900/30 border-green-800',
  MEDIUM: 'bg-yellow-900/30 border-yellow-800',
  HIGH: 'bg-orange-900/30 border-orange-800',
  CRITICAL: 'bg-red-900/30 border-red-700',
};

const SEVERITY_TEXT: Record<string, string> = {
  LOW: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

interface VictimListProps {
  victims: Record<string, Victim>;
  currentTarget: string | null;
}

export const VictimList: React.FC<VictimListProps> = ({ victims, currentTarget }) => {
  const sorted = Object.values(victims).sort((a, b) => {
    if (a.rescued && !b.rescued) return 1;
    if (!a.rescued && b.rescued) return -1;
    return b.priority_score - a.priority_score;
  });
  
  return (
    <div className="space-y-2">
      {sorted.map(victim => (
        <div 
          key={victim.id} 
          className={clsx(
            'rounded-lg p-2.5 border text-xs',
            SEVERITY_BG[victim.severity],
            victim.id === currentTarget && 'ring-1 ring-cyan-500',
            victim.rescued && 'opacity-50'
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white font-mono">{victim.id}</span>
              {victim.id === currentTarget && (
                <span className="text-cyan-400 text-xs">← TARGET</span>
              )}
              {victim.rescued && <span className="text-emerald-400">✅ RESCUED</span>}
            </div>
            <span className={clsx('font-bold font-mono', SEVERITY_TEXT[victim.severity])}>
              {victim.severity}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-400">
            <div>Health: <span className={clsx('font-mono', victim.health < 30 ? 'text-red-400' : victim.health < 60 ? 'text-yellow-400' : 'text-green-400')}>{victim.health.toFixed(0)}%</span></div>
            <div>Urgency: <span className="text-slate-300 font-mono">{(victim.urgency * 100).toFixed(0)}%</span></div>
            <div>Exposure: <span className="text-orange-400 font-mono">{(victim.hazard_exposure * 100).toFixed(0)}%</span></div>
            <div>Priority: <span className="text-cyan-400 font-mono">{victim.priority_score.toFixed(1)}</span></div>
            <div>Pos: <span className="text-slate-300 font-mono">({victim.position.x},{victim.position.y})</span></div>
            <div>T+{victim.time_since_incident.toFixed(0)}t</div>
          </div>
          
          {/* Health bar */}
          <div className="mt-1.5 w-full bg-slate-700 rounded-full h-1">
            <div 
              className={clsx('h-1 rounded-full transition-all',
                victim.health > 60 ? 'bg-green-500' : victim.health > 30 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${victim.health}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
