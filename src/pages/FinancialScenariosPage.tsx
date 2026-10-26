import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Calculator,
  ShieldAlert,
  ArrowRight,
  Info,
  Copy,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import {
  FilterCriteria,
  FinancialConfig,
  HistoricalTurnoverCost,
  ScenarioResult
} from '../types';

interface FinancialScenariosPageProps {
  filters: FilterCriteria;
  onOpenCostConfig: () => void;
}

export const FinancialScenariosPage: React.FC<FinancialScenariosPageProps> = ({ filters, onOpenCostConfig }) => {
  const [costData, setCostData] = useState<HistoricalTurnoverCost | null>(null);
  const [config, setConfig] = useState<FinancialConfig | null>(null);
  const [loadingCost, setLoadingCost] = useState(true);

  // Scenario Simulator Controls
  const [scenarioName, setScenarioName] = useState('Targeted Overtime & Parity Initiative');
  const [department, setDepartment] = useState('all');
  const [tenureBand, setTenureBand] = useState('all');
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [costPerEmp, setCostPerEmp] = useState(1200);
  const [assumedReduction, setAssumedReduction] = useState(25);
  const [reachPct, setReachPct] = useState(85);
  const [adoptionPct, setAdoptionPct] = useState(75);

  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<ScenarioResult[]>([]);

  const fetchFinancials = () => {
    setLoadingCost(true);
    Promise.all([
      api.getHistoricalCost(filters),
      api.getFinancialConfig()
    ])
      .then(([cost, cfg]) => {
        setCostData(cost);
        setConfig(cfg);
      })
      .catch(console.error)
      .finally(() => setLoadingCost(false));
  };

  useEffect(() => {
    fetchFinancials();
  }, [filters]);

  // Run simulation whenever parameters change
  const runSimulation = () => {
    setSimulating(true);
    api.simulateScenario({
      name: scenarioName,
      department,
      tenure_band: tenureBand,
      work_arrangement: 'all',
      overtime_filter: 'all',
      time_horizon_months: horizonMonths,
      intervention_cost_per_employee: costPerEmp,
      assumed_risk_reduction_pct: assumedReduction,
      assumed_reach_pct: reachPct,
      assumed_adoption_pct: adoptionPct,
    })
      .then(res => setScenarioResult(res))
      .catch(console.error)
      .finally(() => setSimulating(false));
  };

  useEffect(() => {
    runSimulation();
  }, [scenarioName, department, tenureBand, horizonMonths, costPerEmp, assumedReduction, reachPct, adoptionPct]);

  const handleSaveScenario = () => {
    if (scenarioResult) {
      setSavedScenarios(prev => [scenarioResult, ...prev]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Epistemic Accounting Transparency Banner */}
      <div className="card-panel p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800">
        <div className="flex items-start space-x-3">
          <DollarSign className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              Turnover Financial Impact & What-If Scenario Simulator
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every financial calculation exposes its explicit formula, parameters, and uncertainty bounds.
              We distinguish clearly between <strong>calculated historical losses</strong> (based on confirmed departures), <strong>hypothetical scenario potential</strong> (user assumptions of relative risk reduction), and <strong>verified realized savings</strong> (proven post-intervention).
            </p>
          </div>
        </div>
      </div>

      {/* Historical Turnover Cost Breakdown Panel */}
      {costData && config && (
        <div className="card-panel p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-white tracking-tight">Historical Cumulative Turnover Cost</span>
                <span className="badge badge-rose">{costData.historical_attrition_count} Departures</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Calculated from verified exits in the active filter scope</p>
            </div>
            <button
              onClick={onOpenCostConfig}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Configure Cost Parameters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Total Estimated Loss</span>
              <span className="text-2xl font-bold text-white">
                {costData.currency_symbol}{costData.total_estimated_turnover_loss.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                Avg {costData.currency_symbol}{costData.avg_cost_per_departure.toLocaleString()} / exit
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Recruiting & Replacement</span>
              <span className="text-lg font-bold text-slate-200">
                {costData.currency_symbol}{costData.breakdown.recruiting_replacement.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {Math.round(config.replacement_cost_pct * 100)}% of annual base salary
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Vacancy & Productivity</span>
              <span className="text-lg font-bold text-slate-200">
                {costData.currency_symbol}{costData.breakdown.vacancy_productivity_loss.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {config.avg_vacancy_days} days @ {costData.currency_symbol}{config.daily_vacancy_cost}/day
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Onboarding & Ramp-Up</span>
              <span className="text-lg font-bold text-slate-200">
                {costData.currency_symbol}{costData.breakdown.onboarding_training.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {costData.currency_symbol}{config.onboarding_training_cost.toLocaleString()} per departure
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive What-If Scenario Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="card-panel p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">Scenario Simulator Parameters</h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Initiative Name */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Initiative Name</label>
              <input
                type="text"
                value={scenarioName}
                onChange={e => setScenarioName(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Target Cohort Department */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Customer Success">Customer Success</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            {/* Time Horizon */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Time Horizon</label>
              <select
                value={horizonMonths}
                onChange={e => setHorizonMonths(parseInt(e.target.value))}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={6}>6 Months Horizon</option>
                <option value={12}>12 Months Horizon (Annual)</option>
                <option value={24}>24 Months Horizon</option>
              </select>
            </div>

            {/* Assumed Risk Reduction % */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-medium">Assumed Hazard Reduction (%)</label>
                <span className="text-emerald-400 font-bold">{assumedReduction}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={assumedReduction}
                onChange={e => setAssumedReduction(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-amber-400 block mt-0.5">
                * User-entered assumption, not an empirical guarantee
              </span>
            </div>

            {/* Reach % and Adoption % */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 block mb-1">Target Reach ({reachPct}%)</label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={reachPct}
                  onChange={e => setReachPct(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Adoption ({adoptionPct}%)</label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={adoptionPct}
                  onChange={e => setAdoptionPct(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Unit Intervention Cost */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">Intervention Cost / Participant ($)</label>
              <input
                type="number"
                min="50"
                step="50"
                value={costPerEmp}
                onChange={e => setCostPerEmp(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Results & Side-by-Side Comparison Column (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          {scenarioResult && (
            <div className="card-panel p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{scenarioResult.name}</h3>
                  <span className="text-xs text-slate-400">
                    Target cohort: {scenarioResult.eligible_population} eligible staff • {scenarioResult.participating_employees} participating
                  </span>
                </div>
                <button
                  onClick={handleSaveScenario}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Save Scenario</span>
                </button>
              </div>

              {/* Scenario KPI Results */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Avoided Departures</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {scenarioResult.estimated_avoided_attritions_central} exits
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Range: [{scenarioResult.estimated_avoided_attritions_low} - {scenarioResult.estimated_avoided_attritions_high}]
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Est. Gross Savings</span>
                  <span className="text-xl font-bold text-white">
                    ${Math.round(scenarioResult.estimated_gross_savings_central).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Range: [${Math.round(scenarioResult.estimated_gross_savings_low).toLocaleString()} - ${Math.round(scenarioResult.estimated_gross_savings_high).toLocaleString()}]
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Program Cost</span>
                  <span className="text-xl font-bold text-rose-400">
                    ${Math.round(scenarioResult.total_intervention_cost).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {scenarioResult.participating_employees} × ${costPerEmp}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Estimated Net ROI</span>
                  <span className="text-xl font-bold text-cyan-400">
                    {scenarioResult.estimated_roi_pct}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Net: +${Math.round(scenarioResult.estimated_net_benefit_central).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Formula Audit Table */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Complete Transparent Formula Derivation
                </h4>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5 font-medium">Calculation Step</th>
                        <th className="p-2.5 font-medium">Mathematical Formula</th>
                        <th className="p-2.5 font-medium">Computed Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {scenarioResult.formula_breakdown.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-850/50">
                          <td className="p-2.5 font-medium text-white">{row.step}</td>
                          <td className="p-2.5 text-slate-400 font-mono text-[11px]">{row.formula}</td>
                          <td className="p-2.5 font-semibold text-emerald-400">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notice */}
              <div className="mt-3 p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200">
                <span className="font-semibold">Caveat Notice:</span> {scenarioResult.is_assumption_notice}
              </div>
            </div>
          )}

          {/* Saved Scenarios Comparison */}
          {savedScenarios.length > 0 && (
            <div className="card-panel p-5">
              <h3 className="text-sm font-semibold text-white tracking-tight mb-3">Saved Scenario Comparisons</h3>
              <div className="space-y-2">
                {savedScenarios.map((sc) => (
                  <div key={sc.scenario_id} className="p-3 rounded-lg bg-slate-850 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-white">{sc.name}</span>
                      <span className="text-slate-400 text-[11px] block">
                        Eligible: {sc.eligible_population} • Assumed RRR: {sc.assumed_relative_reduction_pct}% • Avoided: {sc.estimated_avoided_attritions_central} exits
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">+${Math.round(sc.estimated_net_benefit_central).toLocaleString()}</span>
                      <span className="text-slate-400 text-[10px]">{sc.estimated_roi_pct}% ROI</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
