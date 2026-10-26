import React from 'react';
import {
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
  History,
  Settings,
  Upload,
  UserCheck,
  Database
} from 'lucide-react';
import { DatasetMeta } from '../types';

interface HeaderProps {
  datasetMeta: DatasetMeta | null;
  userRole: string;
  setUserRole: (role: string) => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onOpenAudit: () => void;
  onOpenCostConfig: () => void;
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  datasetMeta,
  userRole,
  setUserRole,
  onRegenerate,
  isRegenerating,
  onOpenAudit,
  onOpenCostConfig,
  onOpenUpload,
}) => {
  return (
    <header className="bg-slate-900/95 border-b border-slate-800/90 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">Retention<span className="text-blue-400">IQ</span></span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Decision Support
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  Local Demo Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Employee Attrition Root-Cause Intelligence</p>
            </div>
          </div>

          {/* Active Dataset & Controls */}
          <div className="flex items-center space-x-3">
            {/* Active Dataset Info */}
            {datasetMeta && (
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-850 border border-slate-800 text-xs">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300 font-medium truncate max-w-[200px]">{datasetMeta.name}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">{datasetMeta.record_count.toLocaleString()} records</span>
                {datasetMeta.is_synthetic && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Synthetic (seed=42)
                  </span>
                )}
              </div>
            )}

            {/* Regenerate Synthetic Data */}
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              title="Regenerate synthetic demo dataset with fresh random seed"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden md:inline">Regenerate Data</span>
            </button>

            {/* Upload Data */}
            <button
              onClick={onOpenUpload}
              title="Upload CSV or Excel dataset"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Upload</span>
            </button>

            {/* Export Cohorts CSV */}
            <a
              href="/api/export/cohorts.csv?dimension=department"
              download
              title="Export authorized aggregate cohort data (with formula injection escaping)"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Export CSV</span>
            </a>

            {/* Cost Configuration */}
            <button
              onClick={onOpenCostConfig}
              title="Configure financial turnover cost parameters"
              className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Audit Log */}
            <button
              onClick={onOpenAudit}
              title="View governance and compliance audit log"
              className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Role Switcher */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="bg-slate-850 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Executive / HR Leader">Executive / HR Leader</option>
                <option value="People Analyst">People Analyst</option>
                <option value="System Admin">System Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
