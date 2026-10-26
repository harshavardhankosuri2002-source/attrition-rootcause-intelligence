export interface FilterCriteria {
  department: string;
  location: string;
  work_arrangement: string;
  tenure_band: string;
}

export interface DatasetMeta {
  id: string;
  name: string;
  created_at: string;
  record_count: number;
  active_count: number;
  attrition_count: number;
  historical_rate_pct: number;
  is_active: boolean;
  is_synthetic: boolean;
  columns: string[];
  missing_rates: Record<string, number>;
}

export interface OverviewSummary {
  total_headcount: number;
  data_coverage_pct: number;
  historical_attrition_count: number;
  historical_attrition_denominator: number;
  historical_attrition_rate_pct: number;
  analysis_period: string;
  current_active_headcount: number;
  scored_headcount: number;
  model_available: boolean;
  risk_distribution: {
    Low: number;
    Moderate: number;
    Elevated: number;
    High: number;
  };
  top_patterns: Array<{
    dimension: string;
    observation: string;
    difference_pct: number;
    sample_size: string;
    caveat: string;
  }>;
  recent_trend: Array<{
    period: string;
    attrition_count: number;
    active_headcount_estimate: number;
    attrition_rate_pct: number;
  }>;
  dataset_info: {
    unfiltered_total: number;
    filtered_total: number;
    filter_applied: boolean;
  };
}

export interface CohortItem {
  cohort_name: string;
  headcount: number;
  active_headcount: number;
  attrition_count: number;
  attrition_rate_pct: number;
  ci_95_lower: number;
  ci_95_upper: number;
  is_small_sample: boolean;
  avg_compa_ratio?: number;
  avg_engagement?: number;
  share_of_total_pct: number;
}

export interface CohortAnalysisResult {
  dimension: string;
  cohorts: CohortItem[];
  total_count: number;
  total_attritions: number;
  overall_rate_pct: number;
  data_caveats: string[];
}

export interface EmployeeSummary {
  employee_id: string;
  masked_id: string;
  department: string;
  job_role: string;
  location: string;
  work_arrangement: string;
  status: string;
  tenure_months: number;
  tenure_band: string;
  compa_ratio: number;
  overtime_frequency: string;
  engagement_score: number | null;
  risk_score: number | null;
  risk_band: string | null;
}

export interface EmployeeDetail extends EmployeeSummary {
  name: string;
  hire_date: string;
  base_salary: number;
  manager_satisfaction: number | null;
  last_promotion_months_ago: number;
  trainings_completed: number;
  top_risk_factors: Array<{ factor: string; observation: string; weight: string }>;
  top_protective_factors: Array<{ factor: string; observation: string; weight: string }>;
  data_completeness_pct: number;
  non_actionable_notice: string;
}

export interface StatisticalTest {
  factor_name: string;
  group_a_label: string;
  group_a_count: number;
  group_a_attritions: number;
  group_a_rate_pct: number;
  group_b_label: string;
  group_b_count: number;
  group_b_attritions: number;
  group_b_rate_pct: number;
  rate_difference_pct: number;
  relative_risk: number;
  odds_ratio: number;
  odds_ratio_ci_lower: number;
  odds_ratio_ci_upper: number;
  chi2_stat: number;
  p_value: number;
  p_value_display: string;
  is_statistically_significant: boolean;
  evidence_strength: string;
  limitations: string[];
  adjustment_variables: string[];
  plain_language_summary: string;
}

export interface ModelEvaluation {
  model_id: string;
  created_at: string;
  dataset_id: string;
  algorithm: string;
  target_definition: string;
  features_used: string[];
  features_excluded_protected: string[];
  split_method: string;
  train_count: number;
  test_count: number;
  test_attrition_rate_pct: number;
  baseline_algorithm: string;
  baseline_roc_auc: number;
  model_roc_auc: number;
  model_pr_auc: number;
  brier_score: number;
  threshold: number;
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  precision: number;
  recall: number;
  f1: number;
  feature_importances: Array<{
    feature: string;
    importance: number;
    coefficient?: number;
    direction: string;
  }>;
  calibration_curve: Array<{
    mean_predicted: number;
    observed_frequency: number;
  }>;
  roc_curve_points: Array<{
    fpr: number;
    tpr: number;
  }>;
  fairness_metrics: Record<string, Record<string, {
    count: number;
    positive_prediction_rate_pct: number;
    false_positive_rate_pct: number;
    false_negative_rate_pct: number;
    is_underpowered: boolean;
  }>>;
  decision_support_disclaimer: string;
}

export interface RecommendationItem {
  rec_id: string;
  title: string;
  catalog_type: string;
  target_population: string;
  rationale: string;
  supporting_observations: string[];
  required_assumptions: string;
  evidence_strength: string;
  expected_effort: string;
  estimated_cost_range: string;
  suggested_owner: string;
  suggested_review_date: string;
  status: string;
}

export interface FinancialConfig {
  currency: string;
  currency_symbol: string;
  replacement_cost_pct: number;
  avg_vacancy_days: number;
  daily_vacancy_cost: number;
  onboarding_training_cost: number;
}

export interface HistoricalTurnoverCost {
  historical_attrition_count: number;
  total_estimated_turnover_loss: number;
  avg_cost_per_departure: number;
  breakdown: {
    recruiting_replacement: number;
    vacancy_productivity_loss: number;
    onboarding_training: number;
  };
  currency: string;
  currency_symbol: string;
  formula_documentation: string;
}

export interface ScenarioResult {
  scenario_id: string;
  name: string;
  created_at: string;
  dataset_version: string;
  model_version: string;
  eligible_population: number;
  participating_employees: number;
  baseline_expected_attritions: number;
  baseline_attrition_rate_pct: number;
  assumed_relative_reduction_pct: number;
  estimated_avoided_attritions_central: number;
  estimated_avoided_attritions_low: number;
  estimated_avoided_attritions_high: number;
  estimated_gross_savings_central: number;
  estimated_gross_savings_low: number;
  estimated_gross_savings_high: number;
  total_intervention_cost: number;
  estimated_net_benefit_central: number;
  estimated_roi_pct: number;
  formula_breakdown: Array<{
    step: string;
    formula: string;
    value: string;
  }>;
  is_assumption_notice: string;
}

export interface InterventionRecord {
  id: string;
  title: string;
  target_cohort: string;
  intervention_type: string;
  status: "Planned" | "Active" | "Paused" | "Completed" | "Closed";
  owner: string;
  start_date: string;
  planned_duration_months: number;
  budget: number;
  actual_cost: number | null;
  target_reach_count: number;
  enrolled_count: number;
  observed_attrition_rate_pct: number | null;
  comparison_baseline_rate_pct: number | null;
  measured_difference_pct: number | null;
  outcome_status: string;
  causal_design_notes: string;
  notes: string;
  is_verified: boolean;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  details: string;
  user_role: string;
}
