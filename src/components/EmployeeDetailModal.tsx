import React from 'react';
import { X, ShieldAlert, Award, AlertTriangle, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { EmployeeDetail } from '../types';

interface EmployeeDetailModalProps {
  employee: EmployeeDetail | null;
  onClose: () => void;
  userRole: string;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, onClose, userRole }) => {
  if (!employee) return null;

  const getRiskBadge = (band: string | null) => {
    switch (band) {
      case 'High':
        return <span className="badge badge-rose">High Estimated Risk (&gt;= 0.65)</span>;
      case 'Elevated':
        return <span className="badge badge-amber">Elevated Estimated Risk (0.40 - 0.65)</span>;
      case 'Moderate':
        return <span className="badge badge-blue">Moderate Estimated Risk (0.20 - 0.40)</span>;
      case 'Low':
        return <span className="badge badge-emerald">Low Estimated Risk (&lt; 0.20)</span>;
      default:
        return <span className="badge badge-slate">Unscored / Insufficient Data</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {userRole === 'System Admin' ? employee.employee_id : employee.masked_id}
              </h2>
              <span className={`badge ${employee.status === 'Active' ? 'badge-emerald' : 'badge-slate'}`}>
                {employee.status}
              </span>
              {getRiskBadge(employee.risk_band)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {employee.job_role} • {employee.department} • {employee.location} ({employee.work_arrangement})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safeguard & Decision-Support Notice */}
        <div className="my-4 p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start space-x-2 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Privacy & Decision-Support Safeguard:</span> This profile presents observed operational facts and statistical model associations. It does <strong>not</strong> produce automated employment verdicts or determine compensation, promotion, or adverse personnel actions.
          </div>
        </div>

        <div className="space-y-5 text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
          {/* Key Observed Facts Grid */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Observed Operational Facts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Tenure</span>
                <span className="text-sm font-semibold text-white">{employee.tenure_months} months</span>
                <span className="text-[10px] text-slate-400 block">Band: {employee.tenure_band}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Compensation Parity</span>
                <span className="text-sm font-semibold text-white">{employee.compa_ratio}</span>
                <span className="text-[10px] text-slate-400 block">
                  {employee.compa_ratio < 0.88 ? 'Below Market Parity' : 'At/Above Market'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Overtime Schedule</span>
                <span className="text-sm font-semibold text-white">{employee.overtime_frequency}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Engagement Pulse</span>
                <span className="text-sm font-semibold text-white">
                  {employee.engagement_score ? `${employee.engagement_score} / 5.0` : 'Not submitted'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Manager Satisfaction</span>
                <span className="text-sm font-semibold text-white">
                  {employee.manager_satisfaction ? `${employee.manager_satisfaction} / 5.0` : 'Not submitted'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Promotion Velocity</span>
                <span className="text-sm font-semibold text-white">{employee.last_promotion_months_ago}m ago</span>
              </div>
            </div>
          </div>

          {/* Model Estimate & Associated Factors */}
          {employee.risk_score !== null && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Model Estimated Association ({Math.round(employee.risk_score * 100)}% Risk Score)
                </h3>
                <span className="text-[10px] text-slate-400">Statistical Estimate (Uncertain)</span>
              </div>

              <div className="space-y-2">
                {employee.top_risk_factors.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40">
                    <span className="text-[11px] font-semibold text-rose-300 flex items-center mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                      Associated Risk Factors (Statistical Co-occurrences)
                    </span>
                    <ul className="space-y-1.5 mt-1.5">
                      {employee.top_risk_factors.map((f, i) => (
                        <li key={i} className="text-xs text-rose-200/90 flex justify-between">
                          <span><strong>{f.factor}:</strong> {f.observation}</span>
                          <span className="font-mono text-rose-300">{f.weight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {employee.top_protective_factors.length > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                    <span className="text-[11px] font-semibold text-emerald-300 flex items-center mb-1">
                      <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      Protective Factors
                    </span>
                    <ul className="space-y-1.5 mt-1.5">
                      {employee.top_protective_factors.map((f, i) => (
                        <li key={i} className="text-xs text-emerald-200/90 flex justify-between">
                          <span><strong>{f.factor}:</strong> {f.observation}</span>
                          <span className="font-mono text-emerald-300">{f.weight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supportive Action Recommendations */}
          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/50">
            <span className="text-xs font-semibold text-blue-300 block mb-1">Supportive Next Steps</span>
            <p className="text-xs text-blue-200/80">
              Consider scheduling a voluntary, supportive career check-in, reviewing workload pacing, or confirming current compensation competitiveness against role salary bands.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Data completeness: {employee.data_completeness_pct}%</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
