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
  COMPLETE_MISSION: '✅',
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
    <div className="flex flex-col gap-3 h-full min-h-0">
      {/* Robot Status */}
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 flex-shrink-0">
        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Robot Status</div>
        <div className="flex items-center justify-between mb-2">
          <span className={clsx('font-bold text-sm font-mono', STATUS_COLORS[robot?.status || 'IDLE'])}>
            {robot?.status || 'IDLE'}
          </span>
          <span className="text-xs text-slate-500 font-mono">ID: {robot?.id || '-'}</span>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Battery</span>
            <span className={clsx('font-mono font-bold', batteryColor)}>{robot?.battery.toFixed(1) || '0.0'}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className={clsx('h-2 rounded-full transition-all duration-500', batteryBarColor)}
              style={{ width: `${robot?.battery || 0}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Position: </span>
            <span className="text-slate-300 font-mono">({robot?.position.x},{robot?.position.y})</span>
          </div>
          <div>
            <span className="text-slate-500">Distance: </span>
            <span className="text-slate-300 font-mono">{robot?.total_distance.toFixed(1) || 0}</span>
          </div>
          <div>
            <span className="text-slate-500">Rescued: </span>
            <span className="text-green-400 font-mono font-bold">{robot?.victims_rescued || 0}</span>
          </div>
          <div>
            <span className="text-slate-500">Replans: </span>
            <span className={robot?.status === 'REPLANNING' ? 'text-orange-400' : 'text-slate-300'} className="font-mono">
              {robot?.status === 'REPLANNING' ? 'IN PROGRESS' : `${robot?.replans_count || 0} total`}
            </span>
          </div>
        </div>
      </div>
      
      {/* Current Action */}
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 flex-shrink-0">
        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Current Action</div>
        {lastDecision ? (
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl flex-shrink-0">{ACTION_ICONS[lastDecision.selected_action] || '?'}</span>
              <span className="text-sm font-bold text-sky-300 font-mono truncate">{lastDecision.selected_action}</span>
            </div>
            {lastDecision.selected_target && (
              <div className="mb-2 min-w-0">
                <span className="text-xs text-slate-400">Target: </span>
                <span className="text-yellow-400 font-mono font-bold">{lastDecision.selected_target}</span>
                {target && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded font-mono inline-block" style={{
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
            <div className="text-xs text-slate-300 leading-relaxed break-words whitespace-normal">{lastDecision.explanation}</div>
          </div>
        ) : (
          <div className="text-slate-500 text-sm">Awaiting first decision...</div>
        )}
      </div>
      
      {/* Reason Codes */}
      {lastDecision?.reason_codes && lastDecision.reason_codes.length > 0 && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 flex-shrink-0">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Reason Codes</div>
          <div className="flex flex-wrap gap-1">
            {lastDecision.reason_codes.map((code, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded font-mono border border-blue-800 flex-shrink-0">
                {code.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Priority Score */}
      {lastDecision && lastDecision.priority_score > 0 && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 flex-shrink-0">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">Priority Score</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-700 rounded-full h-3 min-w-0">
              <div 
                className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(100, lastDecision.priority_score)}%` }}
              />
            </div>
            <span className="text-cyan-400 font-mono font-bold text-sm w-12 text-right flex-shrink-0">
              {lastDecision.priority_score.toFixed(1)}
            </span>
          </div>
        </div>
      )}
      
      {/* Replan Alert */}
      {lastDecision?.replan_required && (
        <div className="bg-orange-900/40 border border-orange-600 rounded-lg p-3 flex items-start gap-2 flex-shrink-0">
          <span className="text-orange-400 text-lg flex-shrink-0">🔄</span>
          <div className="min-w-0">
            <div className="text-orange-400 font-bold text-xs font-mono">REPLAN TRIGGERED</div>
            <div className="text-orange-300 text-xs">Conditions changed. Recalculating optimal path...</div>
          </div>
        </div>
      )}

      {/* Target Candidates - Scrollable Section */}
      {lastDecision?.candidate_evaluations && lastDecision.candidate_evaluations.length > 0 && (
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700 min-h-0 flex flex-col flex-1">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2 flex-shrink-0">Target Candidates</div>
          <div className="space-y-1.5 min-h-0 overflow-y-auto flex-1 pr-2">
            {[...lastDecision.candidate_evaluations].sort((a, b) => b.score - a.score).map((candidate, index) => {
              const maxScore = Math.max(...lastDecision.candidate_evaluations!.map(item => item.score), 1);
              const victim = victims[candidate.victim_id];
              return (
                <div key={candidate.victim_id} className={clsx('candidate-row-compact', candidate.selected && 'candidate-selected')}>
                  <div className="candidate-topline-compact">
                    <span className="candidate-rank text-xs font-mono font-bold text-slate-500">0{index + 1}</span>
                    <strong className="text-xs font-mono">{candidate.victim_id}</strong>
                    {victim && <span className={clsx('text-xs px-1.5 py-0 rounded font-mono', 
                      victim.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-300' :
                      victim.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-300' :
                      victim.severity === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-green-900/50 text-green-300'
                    )}>{victim.severity}</span>}
                  </div>
                  <div className="candidate-score-track-compact mt-1">
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div style={{ width: `${Math.max(4, (candidate.score / maxScore) * 100)}%` }} className="h-1.5 bg-cyan-500 rounded-full" />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{candidate.score.toFixed(1)}</span>
                  </div>
                  {candidate.reason_codes.length > 0 && (
                    <div className="candidate-factors-compact mt-1">
                      {candidate.reason_codes.slice(0, 3).map(reason => (
                        <span key={reason} className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded font-mono inline-block mr-1 mb-1">
                          {reason.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {candidate.selected && <div className="candidate-verdict text-xs text-cyan-300 mt-1 font-mono">✓ Selected</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
