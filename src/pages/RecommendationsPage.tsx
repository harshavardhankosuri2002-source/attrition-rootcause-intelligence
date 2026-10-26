import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  BookOpen,
  DollarSign,
  UserCheck,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { RecommendationItem, InterventionRecord } from '../types';

interface RecommendationsPageProps {
  onAssignToRegister: (rec: RecommendationItem) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({ onAssignToRegister }) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getRecommendations(),
      fetch('/api/interventions/catalog').then(r => r.json()).catch(() => [])
    ])
      .then(([recs, cat]) => {
        setRecommendations(recs);
        setCatalog(cat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = (recId: string) => {
    setDismissedIds(prev => new Set(prev).add(recId));
  };

  const visibleRecs = recommendations.filter(r => !dismissedIds.has(r.rec_id));

  return (
    <div className="space-y-6">
      {/* Policy Safeguard Header */}
      <div className="card-panel p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              Evidence-Grounded Retention Recommendations Library
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              All generated recommendations are <strong>hypotheses for human review</strong> based on empirical data pressure points in the active dataset. In accordance with ethical HR guidelines, all suggested interventions prioritize voluntary, supportive, and non-punitive interventions (such as workload rebalancing, career pathway discussions, and compensation benchmark reviews) rather than automated or coercive measures.
            </p>
          </div>
        </div>
      </div>

      {/* Active Data-Grounded Recommendations Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Active Recommendations Generated from Dataset</h3>
            <p className="text-xs text-slate-400">Triggered only when statistically evident cohort pressure thresholds are met</p>
          </div>
          <span className="text-xs text-slate-400">{visibleRecs.length} actionable recommendation(s)</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400">Scanning dataset pressure points...</div>
        ) : visibleRecs.length === 0 ? (
          <div className="card-panel p-8 text-center text-xs text-slate-400">
            No active pressure points exceed review thresholds in the current cohort scope.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleRecs.map((rec) => (
              <div key={rec.rec_id} className="card-panel p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-white pr-2">{rec.title}</span>
                    <span className="badge badge-blue flex-shrink-0">{rec.evidence_strength}</span>
                  </div>

                  {/* Target Cohort Badge */}
                  <div className="inline-block px-2 py-0.5 rounded bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700/80 mb-3">
                    Target: {rec.target_population}
                  </div>

                  {/* Rationale & Observations */}
                  <div className="space-y-2 text-xs text-slate-300 mb-3">
                    <p className="text-slate-200"><strong>Rationale:</strong> {rec.rationale}</p>

                    <div className="p-2.5 rounded bg-slate-850 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Supporting Observations</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                        {rec.supporting_observations.map((obs, i) => (
                          <li key={i}>{obs}</li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      <strong>Required Assumption:</strong> {rec.required_assumptions}
                    </p>
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className="pt-3 border-t border-slate-800 mt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-3">
                    <div>Effort: <strong className="text-slate-200">{rec.expected_effort}</strong></div>
                    <div>Est. Cost: <strong className="text-slate-200">{rec.estimated_cost_range}</strong></div>
                    <div>Owner: <strong className="text-slate-200 truncate block">{rec.suggested_owner}</strong></div>
                    <div>Review Date: <strong className="text-slate-200">{rec.suggested_review_date}</strong></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleDismiss(rec.rec_id)}
                      className="text-xs text-slate-500 hover:text-slate-300 transition"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => onAssignToRegister(rec)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign to Intervention Register</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canonical Intervention Catalog Browser */}
      <div className="card-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Approved Intervention Catalog & Playbook</h3>
            <p className="text-xs text-slate-400">Pre-approved supportive policies with documented operational effort and benchmarks</p>
          </div>
          <BookOpen className="w-4 h-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {catalog.map((catItem) => (
            <div key={catItem.type_id} className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-white text-xs">{catItem.title}</span>
                  <span className="badge badge-slate text-[9px]">{catItem.level}</span>
                </div>
                <p className="text-slate-400 text-[11px] mb-2">{catItem.description}</p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[10px] text-blue-300 mb-2">
                  {catItem.evidence_base}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
                <span>Effort: {catItem.default_effort.split(' ')[0]}</span>
                <span>Est. ${catItem.estimated_cost_per_employee}/staff</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
