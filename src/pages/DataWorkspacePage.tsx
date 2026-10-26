import React, { useEffect, useState } from 'react';
import { Database, FileText, CheckCircle, AlertTriangle, Shield, RefreshCw, Upload, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { DatasetMeta } from '../types';

interface DataWorkspacePageProps {
  onOpenUpload: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export const DataWorkspacePage: React.FC<DataWorkspacePageProps> = ({
  onOpenUpload,
  onRegenerate,
  isRegenerating,
}) => {
  const [meta, setMeta] = useState<DatasetMeta | null>(null);
  const [allDatasets, setAllDatasets] = useState<DatasetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [privacyRedaction, setPrivacyRedaction] = useState(true);

  const fetchMeta = () => {
    setLoading(true);
    api.getDatasetMeta()
      .then(res => {
        setMeta(res.meta);
        setAllDatasets(res.all_datasets);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  if (loading || !meta) {
    return (
      <div className="flex items-center justify-center min-h-[350px] text-xs text-slate-400">
        Loading active dataset schema and profiling data...
      </div>
    );
  }

  // Canonical Schema definitions
  const schemaDefinitions = [
    { field: 'employee_id', type: 'String (Identifier)', required: true, privacy: 'Pseudonymized / Masked', desc: 'Unique identifier for employee record' },
    { field: 'hire_date', type: 'ISO Date', required: true, privacy: 'Internal Operational', desc: 'Hire commencement date used for tenure calculation' },
    { field: 'termination_date', type: 'ISO Date (Optional)', required: false, privacy: 'Internal Operational', desc: 'Departure timestamp if status is Terminated' },
    { field: 'status', type: 'Category ("Active" / "Terminated")', required: true, privacy: 'Public HR', desc: 'Current employment state' },
    { field: 'attrition', type: 'Binary Flag (1 / 0)', required: true, privacy: 'Target Variable', desc: 'Historical departure indicator (1=departed, 0=retained)' },
    { field: 'department', type: 'Category', required: true, privacy: 'Public Org', desc: 'Organizational business unit' },
    { field: 'job_role', type: 'Category', required: true, privacy: 'Public Org', desc: 'Specific occupational role title' },
    { field: 'location', type: 'Category', required: false, privacy: 'Public Org', desc: 'Work site or geographic cluster' },
    { field: 'work_arrangement', type: 'Category ("Hybrid"/"Remote"/"In-Office")', required: false, privacy: 'Operational', desc: 'Physical presence arrangement' },
    { field: 'tenure_months', type: 'Float Numeric', required: false, privacy: 'Operational', desc: 'Total months elapsed between hire and exit/snapshot' },
    { field: 'base_salary', type: 'Currency Numeric', required: false, privacy: 'Confidential Compensation', desc: 'Annual base compensation' },
    { field: 'compa_ratio', type: 'Float Numeric', required: false, privacy: 'Confidential Benchmark', desc: 'Ratio of employee salary to market benchmark midpoint' },
    { field: 'overtime_frequency', type: 'Category', required: false, privacy: 'Operational Pulse', desc: 'Self-reported or timesheet overtime frequency' },
    { field: 'engagement_score', type: 'Float (1.0 - 5.0)', required: false, privacy: 'Confidential Survey Pulse', desc: 'Most recent semi-annual pulse survey sentiment' },
    { field: 'manager_satisfaction', type: 'Float (1.0 - 5.0)', required: false, privacy: 'Confidential Survey', desc: 'Rating of direct supervisor feedback and clarity' },
    { field: 'last_promotion_months_ago', type: 'Float Numeric', required: false, privacy: 'Career Velocity', desc: 'Months elapsed since last formal title change' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="card-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">{meta.name}</h2>
              <span className="badge badge-emerald">Active Dataset</span>
              {meta.is_synthetic && <span className="badge badge-amber">Synthetic (Reproducible)</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ingested at {new Date(meta.created_at).toLocaleString()} • {meta.record_count.toLocaleString()} rows • {meta.columns.length} columns profiled
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPrivacyRedaction(!privacyRedaction)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition"
            >
              {privacyRedaction ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              <span>{privacyRedaction ? 'Privacy Masking: ON' : 'Privacy Masking: OFF'}</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import New Dataset</span>
            </button>
          </div>
        </div>

        {/* Outcome Balance & Coverage Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 block">Total Records</span>
            <span className="text-xl font-bold text-white">{meta.record_count.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Active Employees</span>
            <span className="text-xl font-bold text-emerald-400">{meta.active_count.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Historical Departures</span>
            <span className="text-xl font-bold text-rose-400">{meta.attrition_count.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Outcome Balance (Attrition Rate)</span>
            <span className="text-xl font-bold text-amber-400">{meta.historical_rate_pct}%</span>
          </div>
        </div>
      </div>

      {/* Canonical Schema & Missingness Profiling Table */}
      <div className="card-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Canonical Schema & Data Quality Profile</h3>
            <p className="text-xs text-slate-400">Strict type enforcement, privacy sensitivity tiers, and observed missing rates</p>
          </div>
          <span className="text-xs text-slate-400">
            {meta.columns.length} columns active
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-medium">Field Name</th>
                <th className="p-3 font-medium">Data Type</th>
                <th className="p-3 font-medium">Requirement</th>
                <th className="p-3 font-medium">Privacy Classification</th>
                <th className="p-3 font-medium">Missing Rate</th>
                <th className="p-3 font-medium">Field Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {schemaDefinitions.map((field) => {
                const missingPct = meta.missing_rates[field.field] || 0.0;
                return (
                  <tr key={field.field} className="hover:bg-slate-850/50 transition">
                    <td className="p-3 font-mono font-medium text-blue-300">{field.field}</td>
                    <td className="p-3 text-slate-400">{field.type}</td>
                    <td className="p-3">
                      {field.required ? (
                        <span className="badge badge-blue">Required</span>
                      ) : (
                        <span className="badge badge-slate">Optional</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] text-slate-300">{field.privacy}</span>
                    </td>
                    <td className="p-3">
                      {missingPct > 0 ? (
                        <span className="text-amber-400 font-mono font-medium">{missingPct}%</span>
                      ) : (
                        <span className="text-emerald-400 font-mono font-medium">0.0%</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs">{field.desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset History / Multi-dataset Registry */}
      <div className="card-panel p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white tracking-tight">Available Dataset Registry & Versioning</h3>
          <span className="text-xs text-slate-400">{allDatasets.length} snapshot(s) registered</span>
        </div>
        <div className="space-y-2">
          {allDatasets.map((ds) => (
            <div key={ds.id} className="p-3 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <div>
                  <span className="font-semibold text-white">{ds.name}</span>
                  <span className="text-slate-400 text-[11px] block">
                    Created {new Date(ds.created_at).toLocaleString()} • {ds.record_count.toLocaleString()} rows • {ds.historical_rate_pct}% attrition rate
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {ds.is_active ? (
                  <span className="badge badge-emerald">Active</span>
                ) : (
                  <button className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                    Switch to this
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
