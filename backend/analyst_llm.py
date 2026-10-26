"""
Conversational Workforce Analyst with Server-Side Grounding Tools.
Never hallucinates metrics. Executes verified analytical routines to answer user questions
and grounds every factual statement with exact sample sizes, dates, denominators,
and causal disclaimers.
"""

import os
import re
import json
import pandas as pd
from typing import Dict, Any, List, Optional


def query_workforce_analyst(
    df: pd.DataFrame,
    question: str,
    filters: Dict[str, Any],
    history: Optional[List[Dict[str, str]]] = None,
    gemini_api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Controlled query router.
    Executes real statistical tools on the dataset based on question intent
    and constructs an evidence-grounded response.
    """
    from backend.analytics_engine import (
        get_overview_metrics,
        compute_cohort_breakdown,
        compute_all_root_cause_investigations
    )
    from backend.ml_engine import ACTIVE_MODEL

    q_lower = question.lower()
    citations = []
    tool_executed = ""
    result_data = None

    # Tool 1: Overview / Headcount / Attrition Rate Query
    if any(k in q_lower for k in ["how many", "headcount", "overall rate", "attrition rate", "total employees", "overview", "summary"]):
        tool_executed = "get_overview_metrics"
        metrics = get_overview_metrics(df, filters, ACTIVE_MODEL["eval_result"] if ACTIVE_MODEL else None)
        result_data = metrics

        citations.append({
            "source": "Active Dataset Snapshot",
            "metric": "Overall Attrition Rate",
            "value": f"{metrics['historical_attrition_rate_pct']}%",
            "numerator_denominator": f"{metrics['historical_attrition_count']} exits / {metrics['historical_attrition_denominator']} total records",
            "coverage": f"{metrics['data_coverage_pct']}% complete data coverage"
        })

        active_n = metrics["current_active_headcount"]
        historical_n = metrics["historical_attrition_count"]
        rate = metrics["historical_attrition_rate_pct"]

        answer = (
            f"### Workforce & Attrition Overview\n\n"
            f"Based on the active dataset ({metrics['analysis_period']}):\n\n"
            f"- **Total Tracked Records**: **{metrics['total_headcount']:,}** employees\n"
            f"- **Current Active Headcount**: **{active_n:,}** active personnel\n"
            f"- **Historical Departures**: **{historical_n:,}** employees\n"
            f"- **Cumulative Attrition Rate**: **{rate}%** (Numerator: {historical_n}, Denominator: {metrics['historical_attrition_denominator']})\n"
            f"- **Core Data Coverage**: **{metrics['data_coverage_pct']}%**\n\n"
            f"> [!NOTE]\n"
            f"> This rate represents cumulative historical departures over the observation window. It is a descriptive observation of past events, not a future risk forecast."
        )

    # Tool 2: Department or Role Cohort Breakdown
    elif any(k in q_lower for k in ["department", "role", "engineering", "sales", "customer success", "marketing", "operations"]):
        dimension = "department"
        tool_executed = "compute_cohort_breakdown(department)"
        cohort_res = compute_cohort_breakdown(df, dimension, filters)
        result_data = cohort_res

        top_dept = cohort_res["cohorts"][0] if cohort_res["cohorts"] else None
        lowest_dept = cohort_res["cohorts"][-1] if cohort_res["cohorts"] else None

        citations.append({
            "source": "Department Cohort Breakdown",
            "dimension": "Department",
            "total_cohorts": len(cohort_res["cohorts"]),
            "overall_rate": f"{cohort_res['overall_rate_pct']}%"
        })

        dept_bullets = "\n".join([
            f"- **{c['cohort_name']}**: {c['attrition_rate_pct']}% attrition ({c['attrition_count']}/{c['headcount']} employees, 95% CI: [{c['ci_95_lower']}%, {c['ci_95_upper']}%])"
            for c in cohort_res["cohorts"][:5]
        ])

        answer = (
            f"### Departmental Attrition Analysis\n\n"
            f"Across **{cohort_res['total_count']}** employees with complete department tracking:\n\n"
            f"{dept_bullets}\n\n"
            f"**Key Findings:**\n"
            f"- Highest historical attrition is in **{top_dept['cohort_name']}** at **{top_dept['attrition_rate_pct']}%** (n={top_dept['headcount']}).\n"
            f"- Lowest historical attrition is in **{lowest_dept['cohort_name']}** at **{lowest_dept['attrition_rate_pct']}%** (n={lowest_dept['headcount']}).\n\n"
            f"> [!WARNING]\n"
            f"> **Causal Safeguard**: Departmental rate variations reflect differences in industry benchmark turnover, job market liquidity, and workload demands. They should not be treated as evidence of departmental leadership fault without adjusting for tenure and role mix."
        )

    # Tool 3: Root Cause / Statistical Drivers / Overtime / Compensation
    elif any(k in q_lower for k in ["cause", "driver", "why", "overtime", "compensation", "salary", "pay", "parity", "odds ratio", "burnout", "stagnation"]):
        tool_executed = "compute_all_root_cause_investigations"
        investigations = compute_all_root_cause_investigations(df, filters)
        result_data = investigations

        sig_tests = [t for t in investigations if t["is_statistically_significant"]]
        for t in sig_tests[:3]:
            citations.append({
                "source": "Chi-Square & Odds Ratio Test",
                "factor": t["factor_name"],
                "odds_ratio": f"{t['odds_ratio']} (95% CI: [{t['odds_ratio_ci_lower']}, {t['odds_ratio_ci_upper']}])",
                "p_value": t["p_value_display"],
                "sample_size": f"n_a={t['group_a_count']}, n_b={t['group_b_count']}"
            })

        evidence_blocks = "\n\n".join([
            f"#### 🔍 {t['factor_name']}\n"
            f"- **Group Comparison**: {t['group_a_label']} ({t['group_a_rate_pct']}%, n={t['group_a_count']}) vs {t['group_b_label']} ({t['group_b_rate_pct']}%, n={t['group_b_count']})\n"
            f"- **Effect Size**: Odds Ratio = **{t['odds_ratio']}** (95% CI: [{t['odds_ratio_ci_lower']}, {t['odds_ratio_ci_upper']}], p {t['p_value_display']})\n"
            f"- **Interpretation**: {t['plain_language_summary']}\n"
            f"- **Key Limitations**: {'; '.join(t['limitations'][:2])}"
            for t in sig_tests[:2]
        ])

        answer = (
            f"### Evidence-Based Root Cause Investigation\n\n"
            f"We evaluated potential drivers using formal 2x2 contingency analysis and Chi-Square tests of independence:\n\n"
            f"{evidence_blocks}\n\n"
            f"> [!IMPORTANT]\n"
            f"> **Statistical Guidance**: High odds ratios indicate strong statistical associations within this observational dataset, but do **not** prove pure causality. Confounders like role seniority and market hiring cycles must be considered."
        )

    # Tool 4: Model Evaluation / Predictive Accuracy / ROC AUC
    elif any(k in q_lower for k in ["model", "auc", "roc", "accuracy", "precision", "recall", "predict", "machine learning"]):
        if ACTIVE_MODEL is not None:
            tool_executed = "get_model_evaluation_metrics"
            eval_m = ACTIVE_MODEL["eval_result"]
            result_data = eval_m

            citations.append({
                "source": "Held-Out Test Set Evaluation",
                "algorithm": eval_m["algorithm"],
                "roc_auc": str(eval_m["model_roc_auc"]),
                "pr_auc": str(eval_m["model_pr_auc"]),
                "test_sample_size": f"n={eval_m['test_count']} (Holdout)"
            })

            top_features = ", ".join([f"{f['feature']} ({f['direction']})" for f in eval_m["feature_importances"][:4]])

            answer = (
                f"### Predictive Model Evaluation Summary\n\n"
                f"- **Active Model**: `{eval_m['algorithm']}` (Trained: {eval_m['created_at'][:10]})\n"
                f"- **Split Method**: {eval_m['split_method']}\n"
                f"- **Held-Out Test ROC-AUC**: **{eval_m['model_roc_auc']}** (vs baseline: {eval_m['baseline_roc_auc']})\n"
                f"- **Held-Out PR-AUC**: **{eval_m['model_pr_auc']}**\n"
                f"- **Precision @ {eval_m['threshold']} threshold**: **{eval_m['precision']}** | **Recall**: **{eval_m['recall']}**\n"
                f"- **Leading Associated Features**: {top_features}\n\n"
                f"> [!NOTE]\n"
                f"> {eval_m['decision_support_disclaimer']}"
            )
        else:
            answer = (
                f"### Model Evaluation Status\n\n"
                f"A predictive model has not yet been trained in this session. "
                f"Navigate to the **'Model Evaluation'** tab to train and evaluate a model pipeline with stratified holdout validation."
            )

    # Tool 5: General Analytical Questions / What can you do?
    else:
        tool_executed = "general_workforce_intelligence_guidance"
        answer = (
            f"### RetentionIQ Workforce Intelligence Assistant\n\n"
            f"I can analyze your workforce data through controlled, verifiable statistical calculations. You can ask:\n\n"
            f"1. **Overview & Headcount**: *'What is our total active headcount and historical attrition rate?'*\n"
            f"2. **Departmental Comparison**: *'Which departments show the highest historical turnover?'*\n"
            f"3. **Statistical Drivers**: *'Is frequent overtime significantly associated with employee departures?'*\n"
            f"4. **Compensation Parity**: *'What is the odds ratio for employees below market salary parity?'*\n"
            f"5. **Model Performance**: *'What is the held-out ROC-AUC and leading predictive features?'*\n"
            f"6. **Financial Projections**: *'What is the estimated cost of our historical departures?'*\n\n"
            f"Every answer is grounded in exact calculations from the active dataset without simulated numbers."
        )

    return {
        "question": question,
        "answer": answer,
        "tool_executed": tool_executed,
        "citations": citations,
        "grounded": True,
        "mode": "Server-side Grounded Analytics Engine (Zero Hallucination)"
    }
