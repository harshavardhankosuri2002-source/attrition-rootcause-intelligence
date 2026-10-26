"""
Unit and Integration Tests for RetentionIQ Analytics, Statistical Tests, and ML Pipeline.
"""

import pytest
import pandas as pd
from backend.synthetic_data import generate_synthetic_dataset
from backend.analytics_engine import (
    apply_filters,
    get_overview_metrics,
    compute_cohort_breakdown,
    compute_all_root_cause_investigations,
    perform_statistical_test
)
from backend.ml_engine import train_and_evaluate_model, get_employee_explanation
from backend.financial_engine import (
    compute_historical_attrition_cost,
    simulate_what_if_scenario
)
from backend.models import FinancialConfig, ScenarioInput
from backend.analyst_llm import query_workforce_analyst


@pytest.fixture
def sample_df():
    return generate_synthetic_dataset(num_records=400, seed=42)


def test_synthetic_data_generation(sample_df):
    assert len(sample_df) == 400
    assert "attrition" in sample_df.columns
    assert "employee_id" in sample_df.columns
    assert "department" in sample_df.columns
    assert "compa_ratio" in sample_df.columns
    # Check that attrition is strictly binary
    assert set(sample_df["attrition"].unique()).issubset({0, 1})
    # Check realistic attrition rate (between 10% and 30%)
    rate = sample_df["attrition"].mean()
    assert 0.10 <= rate <= 0.30


def test_overview_metrics(sample_df):
    filters = {"department": "all", "location": "all", "work_arrangement": "all", "tenure_band": "all"}
    metrics = get_overview_metrics(sample_df, filters)

    assert metrics["total_headcount"] == 400
    assert metrics["historical_attrition_count"] == int((sample_df["attrition"] == 1).sum())
    assert metrics["historical_attrition_denominator"] == 400
    assert metrics["historical_attrition_rate_pct"] > 0
    assert len(metrics["top_patterns"]) > 0


def test_cohort_breakdown(sample_df):
    filters = {"department": "all", "location": "all", "work_arrangement": "all", "tenure_band": "all"}
    res = compute_cohort_breakdown(sample_df, "department", filters)

    assert res["dimension"] == "department"
    assert len(res["cohorts"]) > 0
    total_headcount_sum = sum(c["headcount"] for c in res["cohorts"])
    assert total_headcount_sum == 400
    # Every cohort must report CI bounds
    for c in res["cohorts"]:
        assert c["ci_95_lower"] <= c["ci_95_upper"]
        assert c["attrition_count"] <= c["headcount"]


def test_statistical_test_contingency(sample_df):
    test_res = perform_statistical_test(
        df=sample_df,
        factor_name="Test Overtime",
        group_a_label="Frequent Overtime",
        group_a_filter=(sample_df["overtime_frequency"] == "Frequent / High"),
        group_b_label="Rare Overtime",
        group_b_filter=(sample_df["overtime_frequency"] == "Rare / Never"),
        limitations=["Observational limit"],
        adjustment_variables=["Department"]
    )

    assert "odds_ratio" in test_res
    assert test_res["odds_ratio_ci_lower"] <= test_res["odds_ratio_ci_upper"]
    assert 0.0 <= test_res["p_value"] <= 1.0
    assert len(test_res["plain_language_summary"]) > 0


def test_ml_pipeline_and_holdout_evaluation(sample_df):
    eval_res = train_and_evaluate_model(
        df=sample_df,
        algorithm="LogisticRegression",
        test_size=0.25,
        threshold=0.35,
        random_state=42
    )

    assert eval_res["train_count"] == 300
    assert eval_res["test_count"] == 100
    # Model should perform better than random chance baseline
    assert eval_res["model_roc_auc"] > 0.60
    assert eval_res["model_pr_auc"] > 0
    assert len(eval_res["feature_importances"]) > 0
    assert "fairness_metrics" in eval_res


def test_financial_scenario_simulation(sample_df):
    config = FinancialConfig(currency="USD", replacement_cost_pct=0.75)
    scenario_input = ScenarioInput(
        name="Test Initiative",
        department="all",
        assumed_risk_reduction_pct=25.0,
        assumed_reach_pct=80.0,
        assumed_adoption_pct=70.0,
        intervention_cost_per_employee=1000.0
    )

    res = simulate_what_if_scenario(sample_df, scenario_input, config)
    assert res.eligible_population > 0
    assert res.participating_employees > 0
    assert res.estimated_avoided_attritions_central >= 0
    assert res.estimated_avoided_attritions_low <= res.estimated_avoided_attritions_high
    assert res.total_intervention_cost > 0
    assert len(res.formula_breakdown) == 7


def test_conversational_analyst_grounding(sample_df):
    q_res = query_workforce_analyst(sample_df, "What is our overall attrition rate?", {})
    assert q_res["grounded"] is True
    assert "Cumulative Attrition Rate" in q_res["answer"]
    assert len(q_res["citations"]) > 0
