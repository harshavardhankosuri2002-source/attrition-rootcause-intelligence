import React, { useEffect, useState } from 'react';
import {
  Brain,
  Sliders,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Award,
  Layers,
  CheckCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { ModelEvaluation } from '../types';

export const ModelEvaluationPage: React.FC = () => {
  const [modelEval, setModelEval] = useState<ModelEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  // Training parameters
  const [algorithm, setAlgorithm] = useState<'LogisticRegression' | 'RandomForest'>('LogisticRegression');
  const [testSplit, setTestSplit] = useState(0.25);
  const [threshold, setThreshold] = useState(0.35);

  const fetchEvaluation = () => {
    setLoading(true);
    api.getModelEvaluation()
      .then(res => {
        setModelEval(res);
        setThreshold(res.threshold);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvaluation();
  }, []);

  const handleRetrain = async () => {
    setTraining(true);
    try {
      const res = await api.trainModel({
        algorithm,
        test_size: testSplit,
        threshold
      });
      setModelEval(res.evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px] text-xs text-slate-400">
        Loading active model evaluation metrics...
      </div>
    );
  }

  if (!modelEval) {
    return (
      <div className="card-panel p-8 text-center text-xs text-slate-400">
        No model trained yet. Click below to train a model pipeline on the active dataset.
        <div className="mt-4">
          <button
            onClick={handleRetrain}
            disabled={training}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            {training ? 'Training...' : 'Train Baseline & Model Pipeline'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Safeguard & Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200 block text-sm">Experimental Decision Support Protocol</span>
            <p className="text-slate-400 leading-relaxed">
              {modelEval.decision_support_disclaimer}
            </p>
          </div>
        </div>
      </div>

      {/* Model Control & Configuration Bar */}
      <div className="card-panel p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Predictive Pipeline & Holdout Evaluation</h2>
              <span className="badge badge-blue">{modelEval.algorithm}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluated strictly on held-out test split ({modelEval.split_method}) • Target: {modelEval.target_definition}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Algorithm Selector */}
            <div className="flex items-center space-x-1">
              <span className="text-slate-400">Model:</span>
              <select
                value={algorithm}
                onChange={e => setAlgorithm(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="LogisticRegression">Regularized Logistic Regression (L2)</option>
                <option value="RandomForest">Random Forest Classifier (Ensemble)</option>
              </select>
            </div>

            {/* Threshold Slider */}
            <div className="flex items-center space-x-2 bg-slate-850 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400">Decision Threshold:</span>
              <span className="font-mono font-bold text-blue-400">{threshold}</span>
              <input
                type="range"
                min="0.15"
                max="0.75"
                step="0.05"
                value={threshold}
                onChange={e => setThreshold(parseFloat(e.target.value))}
                className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <button
              onClick={handleRetrain}
              disabled={training}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
              <span>{training ? 'Evaluating...' : 'Train & Evaluate'}</span>
            </button>
          </div>
        </div>

        {/* Core Held-Out Evaluation Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800 text-center">
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Held-Out ROC-AUC</span>
            <span className="text-xl font-bold text-emerald-400">{modelEval.model_roc_auc}</span>
            <span className="text-[9px] text-slate-500 block">Baseline: {modelEval.baseline_roc_auc}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Held-Out PR-AUC</span>
            <span className="text-xl font-bold text-blue-400">{modelEval.model_pr_auc}</span>
            <span className="text-[9px] text-slate-500 block">Prevalence: {modelEval.test_attrition_rate_pct}%</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Precision @ {modelEval.threshold}</span>
            <span className="text-xl font-bold text-white">{modelEval.precision}</span>
            <span className="text-[9px] text-slate-500 block">Positive Predictive Val</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Recall (Sensitivity)</span>
            <span className="text-xl font-bold text-white">{modelEval.recall}</span>
            <span className="text-[9px] text-slate-500 block">Exits Identified</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">F1-Score</span>
            <span className="text-xl font-bold text-white">{modelEval.f1}</span>
            <span className="text-[9px] text-slate-500 block">Harmonic Mean</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Brier Loss</span>
            <span className="text-xl font-bold text-cyan-400">{modelEval.brier_score}</span>
            <span className="text-[9px] text-slate-500 block">Prob Calibration</span>
          </div>
        </div>
      </div>

      {/* Visual Diagnostic Curves & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ROC Curve */}
        <div className="card-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white tracking-tight">Receiver Operating Characteristic (ROC)</h3>
            <span className="text-[10px] text-emerald-400 font-mono">AUC={modelEval.model_roc_auc}</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">True Positive Rate vs False Positive Rate across all thresholds</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={modelEval.roc_curve_points} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fpr" stroke="#64748b" fontSize={10} domain={[0, 1]} tickLine={false} />
                <YAxis dataKey="tpr" stroke="#64748b" fontSize={10} domain={[0, 1]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(val: any) => [val, 'Rate']}
                />
                <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Probability Calibration Curve */}
        <div className="card-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white tracking-tight">Model Calibration Reliability</h3>
            <span className="text-[10px] text-blue-400 font-mono">Brier={modelEval.brier_score}</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-4">Predicted probability vs observed event frequency</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={modelEval.calibration_curve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mean_predicted" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis dataKey="observed_frequency" stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="observed_frequency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix at Current Threshold */}
        <div className="card-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white tracking-tight">Held-Out Confusion Matrix</h3>
              <span className="text-[10px] font-mono text-slate-400">n={modelEval.test_count} Test Rows</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">Evaluated at decision threshold = {modelEval.threshold}</p>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">True Negatives (Retained)</span>
                <span className="text-lg font-bold text-emerald-400">{modelEval.confusion_matrix.true_negatives}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">False Positives (Overalert)</span>
                <span className="text-lg font-bold text-amber-400">{modelEval.confusion_matrix.false_positives}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">False Negatives (Missed)</span>
                <span className="text-lg font-bold text-rose-400">{modelEval.confusion_matrix.false_negatives}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-850 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">True Positives (Identified)</span>
                <span className="text-lg font-bold text-blue-400">{modelEval.confusion_matrix.true_positives}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-slate-850 border border-slate-800 text-[10px] text-slate-400">
            Adjusting the decision threshold balances early supportive outreach against false alerts.
          </div>
        </div>
      </div>

      {/* Global Feature Importance / Logistic Coefficients */}
      <div className="card-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Global Feature Influence & Importance</h3>
            <p className="text-xs text-slate-400">
              Statistical influence of preprocessed features on model predictions. (Protected demographic attributes strictly excluded)
            </p>
          </div>
          <span className="badge badge-slate">Top 10 Features</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-medium">Feature</th>
                <th className="p-3 font-medium">Model Influence Score</th>
                {modelEval.algorithm === 'LogisticRegression' && <th className="p-3 font-medium">Model Coefficient</th>}
                <th className="p-3 font-medium">Association Direction</th>
                <th className="p-3 font-medium">Interpretation Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {modelEval.feature_importances.slice(0, 8).map((feat, i) => (
                <tr key={i} className="hover:bg-slate-850/50">
                  <td className="p-3 font-mono font-medium text-white">{feat.feature}</td>
                  <td className="p-3 font-mono text-blue-400 font-semibold">{feat.importance}</td>
                  {modelEval.algorithm === 'LogisticRegression' && (
                    <td className="p-3 font-mono">
                      <span className={(feat.coefficient || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        {feat.coefficient}
                      </span>
                    </td>
                  )}
                  <td className="p-3">
                    <span className={`badge ${feat.direction.includes('Higher') ? 'badge-rose' : 'badge-emerald'}`}>
                      {feat.direction}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">Statistical association in training distribution; not an independent causal lever.</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fairness & Demographic Parity Audit */}
      <div className="card-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">Fairness & Disparate Impact Audit (Holdout Test Split)</h3>
            <p className="text-xs text-slate-400">
              Verifying that model false alert rates and positive rates remain balanced across protected demographic groups
            </p>
          </div>
          <span className="badge badge-emerald">Fairness Monitored</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gender Parity */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-2">Gender Demographics</span>
            {modelEval.fairness_metrics?.gender ? (
              <div className="space-y-2 text-xs">
                {Object.entries(modelEval.fairness_metrics.gender).map(([group, metrics]: [string, any]) => (
                  <div key={group} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">{group}</span>
                      <span className="text-[10px] text-slate-400 block">n={metrics.count} test staff</span>
                    </div>
                    <div className="text-right text-[11px] font-mono space-x-3">
                      <span>Pred Rate: <strong className="text-blue-300">{metrics.positive_prediction_rate_pct}%</strong></span>
                      <span>FPR: <strong className="text-amber-300">{metrics.false_positive_rate_pct}%</strong></span>
                      <span>FNR: <strong className="text-rose-300">{metrics.false_negative_rate_pct}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-xs">No demographic gender data available in active dataset.</div>
            )}
          </div>

          {/* Age Band Parity */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-2">Age Band Cohorts</span>
            {modelEval.fairness_metrics?.age_band ? (
              <div className="space-y-2 text-xs">
                {Object.entries(modelEval.fairness_metrics.age_band).map(([group, metrics]: [string, any]) => (
                  <div key={group} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">{group} years</span>
                      <span className="text-[10px] text-slate-400 block">n={metrics.count} test staff</span>
                    </div>
                    <div className="text-right text-[11px] font-mono space-x-3">
                      <span>Pred Rate: <strong className="text-blue-300">{metrics.positive_prediction_rate_pct}%</strong></span>
                      <span>FPR: <strong className="text-amber-300">{metrics.false_positive_rate_pct}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-xs">No demographic age band data available in active dataset.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
