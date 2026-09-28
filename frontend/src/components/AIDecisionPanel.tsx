import React from 'react';
import type { Robot, DecisionLog, Victim } from '../types';
import { clsx } from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  IDLE: 'text-slate-400',
  ASSESSING: 'text-sky-400',
  SELECTING_TARGET: 'text-yellow-400',
  PLANNING: 'text-blue-400',
  MOVING: 'text-cyan-400',
  RESCUING: 'text-green-400',
  REPLANNING: 'text-orange-400',
  RETURNING_TO_BASE: 'text-purple-400',
  CHARGING: 'text-violet-400',
  COMPLETED: 'text-emerald-400',
  ABORTED: 'text-red-400',
  STUCK: 'text-red-600',
};

const ACTION_ICONS: Record<string, string> = {
  MOVE_TO_TARGET: '→',
  RESCUE_VICTIM: '🚑',
  AVOID_HAZARD: '⚠️',
  REPLAN: '🔄',
  RETURN_TO_BASE: '🏠',
  CHARGE: '⚡',
  WAIT: '⏸',
  ABORT: '🛑',
  COMPLETE_MISSION: '��',
};

interface AIDecisionPanelProps {
  robot: Robot | null;
  lastDecision: DecisionLog | null;
  victims: Record<string, Victim>;
}

export const AIDecisionPanel: React.FC<AIDecisionPanelProps> = ({ robot, lastDecision, victims }) => {
  const batteryColor = robot 
    ? robot.battery > 50 ? 'text-green-400' : robot.battery > 25 ? 'text-yellow-400' : 'text-red-400'
    : 'text-slate-400';
  
  const batteryBarColor = robot
    ? robot.battery > 50 ? 'bg-green-500' : robot.battery > 25 ? 'bg-yellow-500' : 'bg-red-500'
    : 'bg-slate-600';
  
  const target = lastDecision?.selected_target ? victims[lastDecision.selected_target] : null;
  
  return (
    <div className="ai-decision-panel-grid">
      {/* Robot Status - Fixed Height Section */}
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Robot Status</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Status</span>
            <div className={clsx('font-bold font-mono text-sm', STATUS_COLORS[robot?.status || 'IDLE'])}>
              {robot?.status || 'IDLE'}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Battery</span>
            <div className={clsx('font-mono font-bold text-sm', batteryColor)}>{robot?.battery.toFixed(0) || '0'}%</div>
          </div>
          <div>
            <span className="text-slate-500">Position</span>
            <div className="text-slate-300 font-mono text-xs">({robot?.position.x},{robot?.position.y})</div>
          </div>
          <div>
            <span className="text-slate-500">Distance</span>
            <div className="text-slate-300 font-mono text-xs">{robot?.total_distance.toFixed(1) || 0}</div>
          </div>
          <div>
            <span className="text-slate-500">Rescued</span>
            <div className="text-green-400 font-mono font-bold text-xs">{robot?.victims_rescued || 0}</div>
          </div>
          <div>
            <span className="text-slate-500">Replans</span>
            <div className={robot?.status === 'REPLANNING' ? 'text-orange-400' : 'text-slate-300'} className="font-mono text-xs">
              {robot?.status === 'REPLANNING' ? 'IN PROGRESS' : robot?.replans_count || 0}
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Action - Fixed Height Section */}
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Current Action</div>
        {lastDecision ? (
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg flex-shrink-0">{ACTION_ICONS[lastDecision.selected_action] || '?'}</span>
              <span className="text-xs font-bold text-sky-300 font-mono break-words">{lastDecision.selected_action}</span>
            </div>
            {lastDecision.selected_target && (
              <div className="mb-1 text-xs">
                <span className="text-slate-400">Target: </span>
                <span className="text-yellow-400 font-mono font-bold">{lastDecision.selected_target}</span>
                {target && (
                  <span className="ml-2 text-xs px-1 py-0.5 rounded font-mono inline-block" style={{
                    backgroundColor: target.severity === 'CRITICAL' ? '#7f1d1d' : 
                                    target.severity === 'HIGH' ? '#7c2d12' :
                                    target.severity === 'MEDIUM' ? '#713f12' : '#14532d',
                    color: target.severity === 'CRITICAL' ? '#fca5a5' :
                           target.severity === 'HIGH' ? '#fdba74' :
                           target.severity === 'MEDIUM' ? '#fde68a' : '#86efac'
                  }}>
                    {target.severity}
                  </span>
                )}
              </div>
            )}
            <div className="text-xs text-slate-300 leading-tight break-words max-h-12 overflow-hidden">{lastDecision.explanation}</div>
          </div>
        ) : (
          <div className="text-slate-500 text-xs">Awaiting first decision...</div>
        )}
      </div>

      {/* Reason Codes - Fixed Height Section */}
      {lastDecision?.reason_codes && lastDecision.reason_codes.length > 0 && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Reason</div>
          <div className="flex flex-wrap gap-1">
            {lastDecision.reason_codes.slice(0, 3).map((code, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded font-mono border border-blue-800 flex-shrink-0">
                {code.substring(0, 12)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Priority Score - Fixed Height Section */}
      {lastDecision && lastDecision.priority_score > 0 && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1">Priority</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-700 rounded-full h-2 min-w-0">
              <div 
                className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                style={{ width: `${Math.min(100, lastDecision.priority_score)}%` }}
              />
            </div>
            <span className="text-cyan-400 font-mono font-bold text-xs flex-shrink-0">
              {lastDecision.priority_score.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {/* Replan Alert - Fixed Height Section */}
      {lastDecision?.replan_required && (
        <div className="bg-orange-900/40 border border-orange-600 rounded-lg p-2 flex items-start gap-2 flex-shrink-0">
          <span className="text-orange-400 text-sm flex-shrink-0">🔄</span>
          <div className="min-w-0">
            <div className="text-orange-400 font-bold text-xs font-mono">REPLAN</div>
            <div className="text-orange-300 text-xs">Path recalculating...</div>
          </div>
        </div>
      )}

      {/* Candidate Evaluations - Scrollable Section */}
      {lastDecision?.candidate_evaluations && lastDecision.candidate_evaluations.length > 0 && (
        <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700 min-h-0 overflow-y-auto">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-1 sticky top-0 bg-slate-800/60 z-10">Candidates</div>
          <div className="space-y-1">
            {[...lastDecision.candidate_evaluations].sort((a, b) => b.score - a.score).slice(0, 4).map((candidate, index) => {
              const maxScore = Math.max(...lastDecision.candidate_evaluations!.map(item => item.score), 1);
              const victim = victims[candidate.victim_id];
              return (
                <div key={candidate.victim_id} className={clsx('p-1 rounded text-xs border', candidate.selected 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-slate-700 bg-slate-900/40')}>
                  <div className="flex items-center justify-between gap-1">
                    <strong className="font-mono">{candidate.victim_id}</strong>
                    <span className="text-slate-400 font-mono text-xs">{candidate.score.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded h-1 mt-0.5">
                    <div style={{ width: `${Math.max(2, (candidate.score / maxScore) * 100)}%` }} className="h-1 bg-cyan-500 rounded" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
