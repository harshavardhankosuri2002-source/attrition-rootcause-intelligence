import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  PauseCircle,
  XCircle,
  ShieldCheck,
  Scale,
  Calendar,
  DollarSign,
  TrendingDown
} from 'lucide-react';
import { api } from '../services/api';
import { InterventionRecord } from '../types';

interface InterventionsRegisterPageProps {
  initialNewIntervention?: Partial<InterventionRecord> | null;
  onClearInitialNew?: () => void;
}

export const InterventionsRegisterPage: React.FC<InterventionsRegisterPageProps> = ({
  initialNewIntervention,
  onClearInitialNew,
}) => {
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<InterventionRecord>>({
    title: '',
    target_cohort: '',
    intervention_type: 'Workload & Schedule',
    status: 'Planned',
    owner: '',
    start_date: new Date().toISOString().split('T')[0],
    planned_duration_months: 6,
    budget: 25000,
    target_reach_count: 50,
    enrolled_count: 0,
    comparison_baseline_rate_pct: 20.0,
    causal_design_notes: 'Staggered team rollout with pre/post difference-in-differences analysis.',
    notes: ''
  });

  const fetchInterventions = () => {
    setLoading(true);
    api.getInterventions()
      .then(res => setInterventions(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  useEffect(() => {
    if (initialNewIntervention) {
      setFormData(prev => ({
        ...prev,
        ...initialNewIntervention
      }));
      setShowAddForm(true);
    }
  }, [initialNewIntervention]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createIntervention(formData);
      fetchInterventions();
      setShowAddForm(false);
      if (onClearInitialNew) onClearInitialNew();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="badge badge-blue">Active Implementation</span>;
      case 'Completed':
        return <span className="badge badge-emerald">Completed & Monitored</span>;
      case 'Planned':
        return <span className="badge badge-amber">Planned / Enrolling</span>;
      case 'Paused':
        return <span className="badge badge-slate">Paused</span>;
      default:
        return <span className="badge badge-slate">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Accountability Framework */}
      <div className="card-panel p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <ClipboardList className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Intervention Register & Quasi-Experimental Outcome Tracking
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                Tracks structured retention initiatives, budgets, enrolled cohorts, and observed departure rates against control cohorts.
                In compliance with scientific rigor, an intervention cannot claim causality without a documented experimental or quasi-experimental rollout design (e.g. difference-in-differences or regression discontinuity).
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Close Form' : 'Register Intervention'}</span>
          </button>
        </div>
      </div>

      {/* New Intervention Form */}
      {showAddForm && (
        <div className="card-panel p-5 border-blue-500/40">
          <h3 className="text-sm font-bold text-white tracking-tight mb-3">Create New Intervention Program</h3>
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Initiative Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Engineering On-Call Rotation Overhaul"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Cohort Description</label>
                <input
                  type="text"
                  required
                  value={formData.target_cohort}
                  onChange={e => setFormData({ ...formData, target_cohort: e.target.value })}
                  placeholder="e.g. Engineering (High Overtime, n=120)"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Intervention Type</label>
                <select
                  value={formData.intervention_type}
                  onChange={e => setFormData({ ...formData, intervention_type: e.target.value })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Workload & Schedule">Workload & Schedule</option>
                  <option value="Compensation & Parity">Compensation & Parity</option>
                  <option value="Manager Leadership">Manager Leadership</option>
                  <option value="Career Mobility">Career Mobility</option>
                  <option value="Workplace Flexibility">Workplace Flexibility</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Owner(s)</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={e => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="e.g. Sarah Jenkins (VP Eng)"
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Approved Budget ($)</label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Causal Evaluation Design (Evaluation Protocol)</label>
              <textarea
                rows={2}
                value={formData.causal_design_notes}
                onChange={e => setFormData({ ...formData, causal_design_notes: e.target.value })}
                placeholder="Describe how causal effect will be measured (e.g. randomized rollout, difference-in-differences vs control group)"
                className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interventions Listing */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading intervention records...</div>
        ) : interventions.map((item) => (
          <div key={item.id} className="card-panel p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-semibold text-blue-400">{item.id}</span>
                  <h3 className="text-base font-bold text-white tracking-tight">{item.title}</h3>
                  {getStatusBadge(item.status)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Target: <span className="text-slate-200">{item.target_cohort}</span> • Owner: <span className="text-slate-200">{item.owner}</span>
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[11px]">Budget & Actual:</span>
                <span className="text-white font-mono font-semibold">
                  ${item.actual_cost?.toLocaleString() ?? item.budget.toLocaleString()} / ${item.budget.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Participation & Outcome Comparison Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Enrolled Participants</span>
                <span className="text-sm font-bold text-white">{item.enrolled_count} / {item.target_reach_count}</span>
                <span className="text-[10px] text-slate-500 block">
                  {Math.round((item.enrolled_count / Math.max(1, item.target_reach_count)) * 100)}% reach
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Observed Attrition Rate</span>
                <span className="text-sm font-bold text-emerald-400">
                  {item.observed_attrition_rate_pct !== null ? `${item.observed_attrition_rate_pct}%` : 'Monitoring...'}
                </span>
                <span className="text-[10px] text-slate-500 block">Treated Group</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Control Baseline Rate</span>
                <span className="text-sm font-bold text-slate-300">
                  {item.comparison_baseline_rate_pct !== null ? `${item.comparison_baseline_rate_pct}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-500 block">Untreated Cohort</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Observed Difference</span>
                <span className="text-sm font-bold text-cyan-400">
                  {item.measured_difference_pct !== null ? `${item.measured_difference_pct}% points` : 'Pending Window'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {item.is_verified ? 'Verified Empirical Outcome' : 'Under Evaluation'}
                </span>
              </div>
            </div>

            {/* Causal Methodology Notes */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs space-y-1">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center">
                <Scale className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                Causal Evaluation Protocol & Safeguards
              </span>
              <p className="text-slate-400 text-[11px]">
                {item.causal_design_notes}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
