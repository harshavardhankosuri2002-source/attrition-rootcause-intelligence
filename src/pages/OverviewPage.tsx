import React, { useEffect, useState } from 'react';
import {
  Users,
  UserMinus,
  TrendingDown,
  ShieldAlert,
  AlertCircle,
  Database,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { OverviewSummary, FilterCriteria } from '../types';

interface OverviewPageProps {
  filters: FilterCriteria;
  onNavigateTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ filters, onNavigateTab }) => {
  const [data, setData] = useState<OverviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getOverview(filters)
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Computing verified descriptive statistics...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const riskBarData = [
    { name: 'Low Risk', count: data.risk_distribution.Low, color: '#10b981', band: '< 0.20' },
    { name: 'Moderate', count: data.risk_distribution.Moderate, color: '#3b82f6', band: '0.20 - 0.40' },
    { name: 'Elevated', count: data.risk_distribution.Elevated, color: '#f59e0b', band: '0.40 - 0.65' },
    { name: 'High Risk', count: data.risk_distribution.High, color: '#f43f5e', band: '>= 0.65' },
  ];

  return (
    <div className="space-y-6">
      {/* Methodological Transparency & Causal Safeguard Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 block text-sm">Decision-Support Integrity & Epistemic Standards</span>
            <p className="text-slate-400 leading-relaxed">
              This application strictly distinguishes between <strong>observed historical facts</strong> (calculated from verified employee records), <strong>predictive model estimates</strong> (statistical holdout associations with quantifiable uncertainty), <strong>root-cause hypotheses</strong> (requiring experimental control), and <strong>financial projections</strong> (model estimates until verified post-intervention).
            </p>
          </div>
        </div>
      </div>

      {/* Top Descriptive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workforce Scope */}
        <div className="card-panel p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Workforce Tracked</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{data.total_headcount.toLocaleString()}</span>
            <span className="text-xs text-slate-400">records</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Core Data Completeness:</span>
            <span className="text-emerald-400 font-medium">{data.data_coverage_pct}%</span>
          </div>
        </div>

        {/* Current Active Headcount */}
        <div className="card-panel p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Current Active Headcount</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{data.current_active_headcount.toLocaleString()}</span>
            <span className="text-xs text-slate-400">active staff</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Scored with Model:</span>
            <span className="text-cyan-400 font-medium">{data.scored_headcount} staff</span>
          </div>
        </div>

        {/* Historical Attrition Exits */}
        <div className="card-panel p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Historical Attritions</span>
            <UserMinus className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{data.historical_attrition_count.toLocaleString()}</span>
            <span className="text-xs text-slate-400">exits recorded</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Period Window:</span>
            <span className="text-slate-300 font-medium truncate max-w-[140px]">{data.analysis_period}</span>
          </div>
        </div>

        {/* Cumulative Historical Rate */}
        <div className="card-panel p-5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Historical Attrition Rate</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{data.historical_attrition_rate_pct}%</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span>Numerator / Denom:</span>
            <span className="text-slate-300 font-mono font-medium">{data.historical_attrition_count} / {data.historical_attrition_denominator}</span>
          </div>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historical Attrition Trend Chart (2 columns) */}
        <div className="lg:col-span-2 card-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Observed Quarterly Attrition Rate Trend</h3>
              <p className="text-xs text-slate-400">Quarterly departure rate calculated from verified termination dates</p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
            >
              Deep-Dive Cohorts <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.recent_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Quarterly Attrition Rate']}
                />
                <Area type="monotone" dataKey="attrition_rate_pct" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#rateGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 text-right">
            Denominator: Estimated active headcount during quarter. Unknown exit dates excluded from period rate.
          </div>
        </div>

        {/* Predictive Risk Distribution (1 column) */}
        <div className="card-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white tracking-tight">Model Risk Distribution</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Logistic L2
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Estimated departure probability on active workforce ({data.scored_headcount} scored staff)
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskBarData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} width={75} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`${val} employees`, 'Active Population']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {riskBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-slate-850 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
            <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              Risk scores represent statistical probability estimates from held-out evaluation. They are <strong>never</strong> deterministic claims about an individual.
            </span>
          </div>
        </div>
      </div>

      {/* Top Observed Statistical Patterns */}
      <div className="card-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Top Observed Attrition Patterns (Empirical Hypotheses)</h3>
            <p className="text-xs text-slate-400">Disproportionate cohort variations identified for structured investigation</p>
          </div>
          <button
            onClick={() => onNavigateTab('root-cause')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
          >
            Investigate Root Causes <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.top_patterns.map((pat, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-300">{pat.dimension}</span>
                  <span className="text-xs font-bold text-rose-400">+{pat.difference_pct}% gap</span>
                </div>
                <p className="text-xs text-slate-200 mb-2">{pat.observation}</p>
                <span className="text-[10px] text-slate-400 font-mono block mb-2">{pat.sample_size}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[10px] text-slate-400 italic">
                {pat.caveat}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
