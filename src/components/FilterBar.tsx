import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { FilterCriteria } from '../types';

interface FilterBarProps {
  filters: FilterCriteria;
  setFilters: React.Dispatch<React.SetStateAction<FilterCriteria>>;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters }) => {
  const isFiltered =
    filters.department !== 'all' ||
    filters.location !== 'all' ||
    filters.work_arrangement !== 'all' ||
    filters.tenure_band !== 'all';

  const resetFilters = () => {
    setFilters({
      department: 'all',
      location: 'all',
      work_arrangement: 'all',
      tenure_band: 'all',
    });
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Analysis Scope:</span>
          </div>

          {/* Department */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Dept:</span>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Customer Success">Customer Success</option>
              <option value="Marketing">Marketing</option>
              <option value="Product">Product</option>
              <option value="Operations">Operations</option>
              <option value="People & HR">People & HR</option>
            </select>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Location:</span>
            <select
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Locations</option>
              <option value="San Francisco (HQ)">San Francisco (HQ)</option>
              <option value="New York">New York</option>
              <option value="Austin">Austin</option>
              <option value="London">London</option>
              <option value="Remote - US">Remote - US</option>
              <option value="Remote - EMEA">Remote - EMEA</option>
            </select>
          </div>

          {/* Work Arrangement */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Work Mode:</span>
            <select
              value={filters.work_arrangement}
              onChange={(e) => setFilters(prev => ({ ...prev, work_arrangement: e.target.value }))}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Arrangements</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Fully Remote">Fully Remote</option>
              <option value="In-Office">In-Office</option>
            </select>
          </div>

          {/* Tenure Band */}
          <div className="flex items-center space-x-1">
            <span className="text-slate-400">Tenure:</span>
            <select
              value={filters.tenure_band}
              onChange={(e) => setFilters(prev => ({ ...prev, tenure_band: e.target.value }))}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Tenure Bands</option>
              <option value="< 1 year">&lt; 1 year</option>
              <option value="1 - 2 years">1 - 2 years</option>
              <option value="2 - 4 years">2 - 4 years</option>
              <option value="4+ years">4+ years</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Button & Status */}
        <div className="flex items-center space-x-2">
          {isFiltered && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Filtered Scope Active
            </span>
          )}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
