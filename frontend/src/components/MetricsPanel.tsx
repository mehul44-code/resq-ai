import React from 'react';
import type { Metrics } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface MetricsPanelProps {
  metrics: Metrics;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {

  
  const scoreData = Object.entries(metrics.score_breakdown || {}).map(([key, val]) => ({
    name: key.replace('_score', '').replace('_', ' '),
    value: parseFloat(val.toFixed(1))
  }));
  
  const SCORE_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa', '#f87171', '#34d399'];
  
  return (
    <div className="space-y-4">
      {/* Mission Score Hero */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 text-center">
        <div className="text-slate-400 text-sm font-mono uppercase tracking-wider mb-2">Mission Score</div>
        <div className="text-6xl font-bold font-mono" style={{
          color: metrics.mission_score >= 80 ? '#22c55e' : metrics.mission_score >= 60 ? '#f59e0b' : '#ef4444'
        }}>
          {metrics.mission_score.toFixed(1)}
        </div>
        <div className="text-slate-500 text-xs mt-1">out of 100 (simulation metric)</div>
      </div>
      
      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Victims Rescued', value: `${metrics.rescued_victims}/${metrics.total_victims}`, color: 'text-green-400' },
          { label: 'Completion Rate', value: `${metrics.mission_completion_rate.toFixed(1)}%`, color: 'text-cyan-400' },
          { label: 'Mission Time', value: `${metrics.total_mission_time} ticks`, color: 'text-blue-400' },
          { label: 'Distance', value: `${metrics.total_distance_traveled} cells`, color: 'text-purple-400' },
          { label: 'Battery Used', value: `${metrics.battery_consumed.toFixed(1)}%`, color: 'text-yellow-400' },
          { label: 'Replans', value: metrics.replans_count.toString(), color: 'text-orange-400' },
          { label: 'Hazards Met', value: metrics.hazards_encountered.toString(), color: 'text-red-400' },
          { label: 'Battery Left', value: `${metrics.battery_remaining.toFixed(1)}%`, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      
      {/* Score Breakdown */}
      {scoreData.length > 0 && (
        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-3">Score Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#e2e8f0' }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {scoreData.map((_, index) => (
                  <Cell key={index} fill={SCORE_COLORS[index % SCORE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
