import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Info,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { FilterCriteria, CohortAnalysisResult, EmployeeSummary, EmployeeDetail } from '../types';

interface WorkforceAnalyticsPageProps {
  filters: FilterCriteria;
  userRole: string;
  onSelectEmployee: (employee: EmployeeDetail) => void;
}

export const WorkforceAnalyticsPage: React.FC<WorkforceAnalyticsPageProps> = ({
  filters,
  userRole,
  onSelectEmployee
}) => {
  const [dimension, setDimension] = useState<string>('department');
  const [cohortData, setCohortData] = useState<CohortAnalysisResult | null>(null);
  const [cohortLoading, setCohortLoading] = useState(true);

  // Employee Directory state
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [empLoading, setEmpLoading] = useState(false);

  // Fetch Cohort Analytics
  useEffect(() => {
    setCohortLoading(true);
    api.getCohortAnalytics(dimension, filters)
      .then(res => setCohortData(res))
      .catch(console.error)
      .finally(() => setCohortLoading(false));
  }, [dimension, filters]);

  // Fetch Employee Directory
  const fetchEmployees = (page = 1) => {
    setEmpLoading(true);
    api.getEmployees(filters, {
      page,
      limit: 10,
      search: searchQuery,
      status: statusFilter,
      risk_band: riskFilter,
      user_role: userRole
    })
      .then(res => {
        setEmployees(res.employees);
        setTotalEmployees(res.total_records);
        setTotalPages(res.total_pages);
        setCurrentPage(res.page);
      })
      .catch(console.error)
      .finally(() => setEmpLoading(false));
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [filters, searchQuery, statusFilter, riskFilter, userRole]);

  const handleRowClick = async (empId: string) => {
    try {
      const detail = await api.getEmployeeDetail(empId);
      onSelectEmployee(detail);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dimension Selector & Export Controls */}
      <div className="card-panel p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Cohort Attrition Comparative Analysis</h2>
            <p className="text-xs text-slate-400">Evaluate historical departure rates across structural dimensions with 95% confidence bounds</p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 font-medium">Group By:</span>
            <select
              value={dimension}
              onChange={e => setDimension(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="department">Department</option>
              <option value="job_role">Job Role</option>
              <option value="location">Location</option>
              <option value="work_arrangement">Work Arrangement</option>
              <option value="tenure_band">Tenure Band</option>
              <option value="overtime_frequency">Overtime Schedule</option>
            </select>

            <a
              href={`/api/export/cohorts.csv?dimension=${dimension}`}
              download
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Cohort CSV</span>
            </a>
          </div>
        </div>

        {/* Cohort Bar Chart */}
        <div className="mt-6">
          {cohortLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">Loading cohort metrics...</div>
          ) : cohortData && cohortData.cohorts.length > 0 ? (
            <div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cohortData.cohorts} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="cohort_name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val}% (${item.payload.attrition_count}/${item.payload.headcount} exits) [95% CI: ${item.payload.ci_95_lower}% - ${item.payload.ci_95_upper}%]`,
                        'Historical Attrition Rate'
                      ]}
                    />
                    <Bar dataKey="attrition_rate_pct" radius={[4, 4, 0, 0]}>
                      {cohortData.cohorts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.attrition_rate_pct > cohortData.overall_rate_pct ? '#f43f5e' : '#3b82f6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Overall Filtered Attrition Rate: <strong>{cohortData.overall_rate_pct}%</strong> (n={cohortData.total_count})</span>
                <span>Bars highlighted in red exceed the workforce average rate.</span>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">No cohort data matches the selected filters.</div>
          )}
        </div>
      </div>

      {/* Cohort Detailed Statistical Table */}
      {cohortData && (
        <div className="card-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cohort Statistical Breakdown</h3>
            <span className="text-xs text-slate-500">Denominators and Wilson 95% Confidence Intervals</span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 font-medium">Cohort</th>
                  <th className="p-3 font-medium">Headcount (n)</th>
                  <th className="p-3 font-medium">Active Staff</th>
                  <th className="p-3 font-medium">Historical Exits</th>
                  <th className="p-3 font-medium">Attrition Rate</th>
                  <th className="p-3 font-medium">95% Confidence Interval</th>
                  <th className="p-3 font-medium">Avg Compa-Ratio</th>
                  <th className="p-3 font-medium">Share of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {cohortData.cohorts.map((c) => (
                  <tr key={c.cohort_name} className="hover:bg-slate-850/50 transition">
                    <td className="p-3 font-medium text-white flex items-center space-x-1.5">
                      <span>{c.cohort_name}</span>
                      {c.is_small_sample && (
                        <span title="Small sample (n < 30): Estimates have wide confidence bounds">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono">{c.headcount}</td>
                    <td className="p-3 text-emerald-400 font-mono">{c.active_headcount}</td>
                    <td className="p-3 text-rose-400 font-mono">{c.attrition_count}</td>
                    <td className="p-3 font-mono font-semibold text-white">{c.attrition_rate_pct}%</td>
                    <td className="p-3 font-mono text-slate-400">[{c.ci_95_lower}% - {c.ci_95_upper}%]</td>
                    <td className="p-3 font-mono text-slate-300">{c.avg_compa_ratio ?? '—'}</td>
                    <td className="p-3 font-mono text-slate-400">{c.share_of_total_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drill-down Employee Records Directory */}
      <div className="card-panel p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Workforce Records & Detail Inspection</h3>
            <p className="text-xs text-slate-400">
              Drill down into individual records with privacy-conscious pseudonymization
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ID or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-850 border border-slate-700 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-850 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Terminated">Terminated Only</option>
            </select>

            {/* Risk Band Filter */}
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="bg-slate-850 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Risk Bands</option>
              <option value="High">High Risk</option>
              <option value="Elevated">Elevated Risk</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-medium">Identifier</th>
                <th className="p-3 font-medium">Role & Department</th>
                <th className="p-3 font-medium">Location</th>
                <th className="p-3 font-medium">Work Mode</th>
                <th className="p-3 font-medium">Tenure</th>
                <th className="p-3 font-medium">Compa-Ratio</th>
                <th className="p-3 font-medium">Overtime</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Estimated Risk</th>
                <th className="p-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {empLoading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">Loading records...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">No records found matching filters.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.employee_id}
                    onClick={() => handleRowClick(emp.employee_id)}
                    className="hover:bg-slate-850/80 cursor-pointer transition"
                  >
                    <td className="p-3 font-mono font-medium text-blue-300">
                      {userRole === 'System Admin' ? emp.employee_id : emp.masked_id}
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-white block">{emp.job_role}</span>
                      <span className="text-[10px] text-slate-400">{emp.department}</span>
                    </td>
                    <td className="p-3 text-slate-300">{emp.location}</td>
                    <td className="p-3 text-slate-300">{emp.work_arrangement}</td>
                    <td className="p-3 font-mono">{emp.tenure_months}m</td>
                    <td className="p-3 font-mono">
                      <span className={emp.compa_ratio < 0.88 ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                        {emp.compa_ratio}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={emp.overtime_frequency === 'Frequent / High' ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                        {emp.overtime_frequency}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`badge ${emp.status === 'Active' ? 'badge-emerald' : 'badge-slate'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {emp.risk_band ? (
                        <span className={`badge ${
                          emp.risk_band === 'High' ? 'badge-rose' :
                          emp.risk_band === 'Elevated' ? 'badge-amber' :
                          emp.risk_band === 'Moderate' ? 'badge-blue' : 'badge-emerald'
                        }`}>
                          {emp.risk_band} ({Math.round((emp.risk_score || 0) * 100)}%)
                        </span>
                      ) : (
                        <span className="badge badge-slate">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-blue-400 hover:text-blue-300 text-[11px] font-medium inline-flex items-center">
                        Inspect <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {employees.length} of {totalEmployees} records (Page {currentPage} of {totalPages})</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchEmployees(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchEmployees(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
