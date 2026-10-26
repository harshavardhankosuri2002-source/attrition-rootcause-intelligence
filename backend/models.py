"""
Data schemas and API contracts for Employee Attrition Root-Cause Intelligence.
All types are explicitly defined with strict validation and safe defaults.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class FilterCriteria(BaseModel):
    department: Optional[str] = "all"
    location: Optional[str] = "all"
    work_arrangement: Optional[str] = "all"
    tenure_band: Optional[str] = "all"
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class DatasetMeta(BaseModel):
    id: str
    name: str
    created_at: str
    record_count: int
    active_count: int
    attrition_count: int
    historical_rate_pct: float
    is_active: bool = False
    is_synthetic: bool = True
    columns: List[str] = []
    missing_rates: Dict[str, float] = {}
    validation_status: str = "valid"
    warnings: List[str] = []


class EmployeeRecord(BaseModel):
    employee_id: str
    name: str
    department: str
    job_role: str
    location: str
    work_arrangement: str
    hire_date: str
    termination_date: Optional[str] = None
    status: str  # "Active" or "Terminated"
    attrition: int  # 1 or 0
    tenure_months: float
    tenure_band: str
    age_band: str
    gender: str
    base_salary: float
    compa_ratio: float
    overtime_frequency: str
    engagement_score: Optional[float] = None
    manager_satisfaction: Optional[float] = None
    last_promotion_months_ago: float
    trainings_completed: int
    performance_rating: Optional[float] = None
    commute_distance_miles: float
    # Computed prediction fields (if model evaluated)
    risk_score: Optional[float] = None
    risk_band: Optional[str] = None  # "Low", "Moderate", "Elevated", "High"
    top_risk_factors: Optional[List[Dict[str, Any]]] = None
    top_protective_factors: Optional[List[Dict[str, Any]]] = None


class OverviewSummary(BaseModel):
    total_headcount: int
    data_coverage_pct: float
    historical_attrition_count: int
    historical_attrition_denominator: int
    historical_attrition_rate_pct: float
    analysis_period: str
    current_active_headcount: int
    scored_headcount: int
    model_available: bool
    risk_distribution: Dict[str, int]
    top_patterns: List[Dict[str, Any]]
    recent_trend: List[Dict[str, Any]]
    dataset_info: Dict[str, Any]


class CohortAnalysisResult(BaseModel):
    dimension: str
    cohorts: List[Dict[str, Any]]
    total_count: int
    total_attritions: int
    overall_rate_pct: float
    data_caveats: List[str]


class StatisticalTestResult(BaseModel):
    factor_name: str
    group_a_label: str
    group_a_count: int
    group_a_attritions: int
    group_a_rate_pct: float
    group_b_label: str
    group_b_count: int
    group_b_attritions: int
    group_b_rate_pct: float
    rate_difference_pct: float
    relative_risk: float
    odds_ratio: float
    odds_ratio_ci_lower: float
    odds_ratio_ci_upper: float
    chi2_stat: float
    p_value: float
    p_value_display: str
    is_statistically_significant: bool
    evidence_strength: str  # "Strong", "Moderate", "Inconclusive", "Underpowered"
    limitations: List[str]
    adjustment_variables: List[str]
    plain_language_summary: str


class ModelEvaluationResult(BaseModel):
    model_id: str
    created_at: str
    dataset_id: str
    algorithm: str
    target_definition: str
    features_used: List[str]
    features_excluded_protected: List[str]
    split_method: str
    train_count: int
    test_count: int
    test_attrition_rate_pct: float
    baseline_algorithm: str
    baseline_roc_auc: float
    model_roc_auc: float
    model_pr_auc: float
    brier_score: float
    threshold: float
    confusion_matrix: Dict[str, int]
    precision: float
    recall: float
    f1: float
    feature_importances: List[Dict[str, Any]]
    calibration_curve: List[Dict[str, Any]]
    roc_curve_points: List[Dict[str, Any]]
    fairness_metrics: Dict[str, Any]
    decision_support_disclaimer: str


class FinancialConfig(BaseModel):
    currency: str = "USD"
    currency_symbol: str = "$"
    replacement_cost_pct: float = 0.75  # 75% of annual salary
    avg_vacancy_days: int = 42
    daily_vacancy_cost: float = 320.0
    onboarding_training_cost: float = 7500.0


class ScenarioInput(BaseModel):
    name: str = "Targeted Retention Initiative"
    department: str = "all"
    tenure_band: str = "all"
    work_arrangement: str = "all"
    overtime_filter: str = "all"
    time_horizon_months: int = 12
    intervention_cost_per_employee: float = 1200.0
    assumed_risk_reduction_pct: float = 20.0  # e.g., 20% relative hazard reduction
    assumed_reach_pct: float = 85.0
    assumed_adoption_pct: float = 75.0


class ScenarioResult(BaseModel):
    scenario_id: str
    name: str
    created_at: str
    dataset_version: str
    model_version: Optional[str]
    eligible_population: int
    participating_employees: int
    baseline_expected_attritions: float
    baseline_attrition_rate_pct: float
    assumed_relative_reduction_pct: float
    estimated_avoided_attritions_central: float
    estimated_avoided_attritions_low: float
    estimated_avoided_attritions_high: float
    estimated_gross_savings_central: float
    estimated_gross_savings_low: float
    estimated_gross_savings_high: float
    total_intervention_cost: float
    estimated_net_benefit_central: float
    estimated_roi_pct: float
    formula_breakdown: List[Dict[str, Any]]
    is_assumption_notice: str


class InterventionRecord(BaseModel):
    id: str
    title: str
    target_cohort: str
    intervention_type: str  # "Workload & Schedule", "Compensation & Parity", "Manager Coaching", "Career Mobility", "Upskilling"
    status: str  # "Planned", "Active", "Paused", "Completed", "Closed"
    owner: str
    start_date: str
    planned_duration_months: int
    budget: float
    actual_cost: Optional[float] = None
    target_reach_count: int
    enrolled_count: int
    observed_attrition_rate_pct: Optional[float] = None
    comparison_baseline_rate_pct: Optional[float] = None
    measured_difference_pct: Optional[float] = None
    outcome_status: str  # "Pending", "Under Evaluation", "Verified Outcome", "Inconclusive"
    causal_design_notes: str
    notes: str
    is_verified: bool = False
