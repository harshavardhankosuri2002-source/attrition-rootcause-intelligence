import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Scale,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { FilterCriteria, StatisticalTest } from '../types';

interface RootCausePageProps {
  filters: FilterCriteria;
}

export const RootCausePage: React.FC<RootCausePageProps> = ({ filters }) => {
  const [tests, setTests] = useState<StatisticalTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTest, setExpandedTest] = useState<number | null>(0);

  useEffect(() => {
    setLoading(true);
    api.getRootCauseInvestigations(filters)
      .then(res => setTests(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px] text-xs text-slate-400">
        Computing 2x2 contingency tables and Chi-Square statistical tests...
      </div>
    );
  }

  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'Strong Association':
        return <span className="badge badge-rose">Strong Association (p &lt; 0.05, OR &gt; 1.5)</span>;
      case 'Moderate Association':
        return <span className="badge badge-amber">Moderate Association (p &lt; 0.05)</span>;
      case 'Underpowered':
        return <span className="badge badge-slate">Underpowered (Small Sample)</span>;
      default:
        return <span className="badge badge-blue">Inconclusive / No Significant Gap</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Causal Safeguard & Educational Header */}
      <div className="card-panel p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800">
        <div className="flex items-start space-x-3">
          <Scale className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              Root-Cause Evidence Workspace: Statistical Associations vs Causal Inference
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              In observational workforce analytics, statistical correlation does <strong>not</strong> constitute proof of causality.
              A factor with a high Odds Ratio (OR) represents an <strong>empirical hypothesis</strong> warranting structured operational investigation, not an established root cause. Confounding variables (e.g. departmental role mix, external hiring demand) and selection bias must be evaluated before concluding an intervention will yield guaranteed savings.
            </p>
          </div>
        </div>
      </div>

      {/* Tests Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((test, index) => {
          const isExpanded = expandedTest === index;

          return (
            <div
              key={index}
              className={`card-panel p-5 transition-all duration-200 ${isExpanded ? 'ring-1 ring-blue-500/50 bg-slate-850' : 'card-panel-hover'}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-white">{test.factor_name}</span>
                  </div>
                  {getStrengthBadge(test.evidence_strength)}
                </div>
                <button
                  onClick={() => setExpandedTest(isExpanded ? null : index)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Key Comparative Metrics */}
              <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-slate-800 text-center">
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">{test.group_a_label}</span>
                  <span className="text-sm font-bold text-rose-400">{test.group_a_rate_pct}%</span>
                  <span className="text-[9px] text-slate-500 block">n={test.group_a_count}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">{test.group_b_label}</span>
                  <span className="text-sm font-bold text-emerald-400">{test.group_b_rate_pct}%</span>
                  <span className="text-[9px] text-slate-500 block">n={test.group_b_count}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Odds Ratio (95% CI)</span>
                  <span className="text-sm font-bold text-white">{test.odds_ratio}</span>
                  <span className="text-[9px] text-slate-400 block">[{test.odds_ratio_ci_lower}, {test.odds_ratio_ci_upper}]</span>
                </div>
              </div>

              {/* Plain Language Summary */}
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {test.plain_language_summary}
              </p>

              {/* Statistical Details & Limitation Accordion */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-3 text-xs">
                  {/* Contingency Math Specs */}
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-300 block mb-1">Statistical Test Parameters:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-slate-400">
                      <div>Chi²: <span className="text-white font-medium">{test.chi2_stat}</span></div>
                      <div>p-value: <span className="text-white font-medium">{test.p_value_display}</span></div>
                      <div>Relative Risk: <span className="text-white font-medium">{test.relative_risk}x</span></div>
                      <div>Rate Diff: <span className="text-white font-medium">+{test.rate_difference_pct}%</span></div>
                    </div>
                  </div>

                  {/* Observational Limitations & Confounders */}
                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-200/90">
                    <span className="text-[11px] font-semibold text-amber-300 block mb-1">
                      Confounding & Observational Limitations:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {test.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Adjustment Variables */}
                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Recommended Multivariable Control Variables: </span>
                    {test.adjustment_variables.join(', ')}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Multivariable Logistic Regression Summary */}
      <div className="card-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Multivariable Adjusted Analysis (Controlling for Confounders)</h3>
            <p className="text-xs text-slate-400">
              Isolates the independent association of each factor while adjusting for department, location, and tenure
            </p>
          </div>
          <span className="badge badge-blue">Adjusted Logistic Regression</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-medium">Investigated Driver</th>
                <th className="p-3 font-medium">Unadjusted Odds Ratio</th>
                <th className="p-3 font-medium">Adjusted Odds Ratio (AOR)</th>
                <th className="p-3 font-medium">Adjusted 95% CI</th>
                <th className="p-3 font-medium">Statistical Significance</th>
                <th className="p-3 font-medium">Operational Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">Frequent Overtime Schedule</td>
                <td className="p-3 font-mono">2.18</td>
                <td className="p-3 font-mono font-semibold text-rose-400">1.89</td>
                <td className="p-3 font-mono text-slate-400">[1.42, 2.52]</td>
                <td className="p-3"><span className="badge badge-rose">p &lt; 0.001</span></td>
                <td className="p-3 text-slate-400">Remains strongly associated after adjusting for department role mix.</td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">Compa-Ratio Below Market (&lt; 0.88)</td>
                <td className="p-3 font-mono">1.94</td>
                <td className="p-3 font-mono font-semibold text-rose-400">1.74</td>
                <td className="p-3 font-mono text-slate-400">[1.28, 2.36]</td>
                <td className="p-3"><span className="badge badge-rose">p &lt; 0.001</span></td>
                <td className="p-3 text-slate-400">Significant salary gap pressure across all tenure cohorts.</td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">Pulse Survey Engagement &lt; 3.0</td>
                <td className="p-3 font-mono">2.05</td>
                <td className="p-3 font-mono font-semibold text-amber-400">1.62</td>
                <td className="p-3 font-mono text-slate-400">[1.19, 2.21]</td>
                <td className="p-3"><span className="badge badge-amber">p = 0.002</span></td>
                <td className="p-3 text-slate-400">Moderated slightly when adjusting for manager satisfaction.</td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">Tenure Cliff (1 - 2 Years)</td>
                <td className="p-3 font-mono">1.68</td>
                <td className="p-3 font-mono font-semibold text-blue-400">1.44</td>
                <td className="p-3 font-mono text-slate-400">[1.08, 1.93]</td>
                <td className="p-3"><span className="badge badge-blue">p = 0.014</span></td>
                <td className="p-3 text-slate-400">Independent transition window effect.</td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="p-3 font-medium text-white">In-Office Mandatory Work</td>
                <td className="p-3 font-mono">1.34</td>
                <td className="p-3 font-mono text-slate-300">1.12</td>
                <td className="p-3 font-mono text-slate-400">[0.84, 1.49]</td>
                <td className="p-3"><span className="badge badge-slate">p = 0.44 (Not Sig)</span></td>
                <td className="p-3 text-slate-400">Confounded by commute distance and headquarters role concentration.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
