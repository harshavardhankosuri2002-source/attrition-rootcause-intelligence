import React, { useState, useEffect } from 'react';
import { X, DollarSign, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { FinancialConfig } from '../types';

interface CostConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const CostConfigModal: React.FC<CostConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [config, setConfig] = useState<FinancialConfig>({
    currency: 'USD',
    currency_symbol: '$',
    replacement_cost_pct: 0.75,
    avg_vacancy_days: 42,
    daily_vacancy_cost: 320.0,
    onboarding_training_cost: 7500.0,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getFinancialConfig().then(data => setConfig(data)).catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateFinancialConfig(config);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSaved();
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Turnover Cost Parameters</h2>
              <p className="text-xs text-slate-400">Configure financial formulas for replacement and vacancy calculations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Currency Code</label>
              <input
                type="text"
                value={config.currency}
                onChange={e => setConfig({ ...config, currency: e.target.value })}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Currency Symbol</label>
              <input
                type="text"
                value={config.currency_symbol}
                onChange={e => setConfig({ ...config, currency_symbol: e.target.value })}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Replacement Cost % */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-medium">Recruiting & Replacement Cost (% of Salary)</label>
              <span className="text-blue-400 font-semibold">{Math.round(config.replacement_cost_pct * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="2.0"
              step="0.05"
              value={config.replacement_cost_pct}
              onChange={e => setConfig({ ...config, replacement_cost_pct: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Standard SHRM benchmarks suggest 50% to 150% of annual salary depending on technical seniority.</p>
          </div>

          {/* Vacancy Days & Daily Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Average Vacancy Duration (Days)</label>
              <input
                type="number"
                min="5"
                max="180"
                value={config.avg_vacancy_days}
                onChange={e => setConfig({ ...config, avg_vacancy_days: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Daily Vacancy Cost ({config.currency_symbol})</label>
              <input
                type="number"
                min="0"
                step="10"
                value={config.daily_vacancy_cost}
                onChange={e => setConfig({ ...config, daily_vacancy_cost: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Onboarding & Training Cost */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Onboarding & Initial Ramp-Up Cost ({config.currency_symbol})</label>
            <input
              type="number"
              min="0"
              step="100"
              value={config.onboarding_training_cost}
              onChange={e => setConfig({ ...config, onboarding_training_cost: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300 block mb-0.5">Transparent Formula Disclosure</span>
            Departure Cost = (Base Salary × {Math.round(config.replacement_cost_pct * 100)}%) + ({config.avg_vacancy_days} days × {config.currency_symbol}{config.daily_vacancy_cost}) + {config.currency_symbol}{config.onboarding_training_cost.toLocaleString()}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-50"
            >
              {success ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{success ? 'Saved!' : saving ? 'Saving...' : 'Save Parameters'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
