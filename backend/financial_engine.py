"""
Financial Impact and What-If Scenario Calculation Engine.
Reveals every formula, calculation component, parameter, and assumption.
Strictly distinguishes historical calculated loss, estimated scenario potential,
and verified realized savings.
"""

import uuid
import datetime
import pandas as pd
from typing import Dict, Any, List, Optional
from backend.models import FinancialConfig, ScenarioInput, ScenarioResult


def calculate_cost_per_departure(
    base_salary: float,
    config: FinancialConfig
) -> Dict[str, Any]:
    """
    Computes standard turnover cost components for an individual departure.
    Cost = Recruiting & Replacement (salary * replacement_pct) + Vacancy Cost (days * daily_loss) + Onboarding
    """
    recruiting_replacement = base_salary * config.replacement_cost_pct
    vacancy_cost = config.avg_vacancy_days * config.daily_vacancy_cost
    onboarding_cost = config.onboarding_training_cost
    total_cost = recruiting_replacement + vacancy_cost + onboarding_cost

    return {
        "base_salary": base_salary,
        "recruiting_replacement": round(recruiting_replacement, 2),
        "vacancy_cost": round(vacancy_cost, 2),
        "onboarding_training_cost": round(onboarding_cost, 2),
        "total_cost_per_departure": round(total_cost, 2)
    }


def compute_historical_attrition_cost(
    df: pd.DataFrame,
    config: FinancialConfig,
    filters: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculates historical cost based on observed departures and configured cost formulas.
    """
    from backend.analytics_engine import apply_filters
    filtered = apply_filters(df, filters)
    attrited = filtered[filtered["attrition"] == 1]
    n_attritions = len(attrited)

    if n_attritions == 0:
        return {
            "historical_attrition_count": 0,
            "total_estimated_turnover_loss": 0.0,
            "avg_cost_per_departure": 0.0,
            "breakdown": {
                "recruiting_replacement": 0.0,
                "vacancy_productivity_loss": 0.0,
                "onboarding_training": 0.0
            },
            "currency": config.currency,
            "currency_symbol": config.currency_symbol,
            "formula_documentation": (
                "Total Loss = Sum of (Base Salary * Replacement%) + (Avg Vacancy Days * Daily Cost) + Onboarding Cost"
            )
        }

    total_recruiting = float((attrited["base_salary"] * config.replacement_cost_pct).sum())
    total_vacancy = float(n_attritions * config.avg_vacancy_days * config.daily_vacancy_cost)
    total_onboarding = float(n_attritions * config.onboarding_training_cost)
    total_loss = total_recruiting + total_vacancy + total_onboarding

    return {
        "historical_attrition_count": n_attritions,
        "total_estimated_turnover_loss": round(total_loss, 2),
        "avg_cost_per_departure": round(total_loss / n_attritions, 2),
        "breakdown": {
            "recruiting_replacement": round(total_recruiting, 2),
            "vacancy_productivity_loss": round(total_vacancy, 2),
            "onboarding_training": round(total_onboarding, 2)
        },
        "currency": config.currency,
        "currency_symbol": config.currency_symbol,
        "formula_documentation": (
            f"Calculated using configured {config.currency} parameters: "
            f"Replacement ({int(config.replacement_cost_pct*100)}% of salary) + "
            f"Vacancy ({config.avg_vacancy_days} days @ {config.currency_symbol}{config.daily_vacancy_cost}/day) + "
            f"Onboarding ({config.currency_symbol}{config.onboarding_training_cost} per hire)."
        )
    }


def simulate_what_if_scenario(
    df: pd.DataFrame,
    scenario_input: ScenarioInput,
    config: FinancialConfig
) -> ScenarioResult:
    """
    Computes what-if retention projection for a specific cohort.
    Shows central, low, and high uncertainty bounds based on effect size ranges.
    Every step is documented and marked as an assumption.
    """
    # Select cohort
    cohort = df[df["status"] == "Active"].copy()
    if scenario_input.department != "all":
        cohort = cohort[cohort["department"] == scenario_input.department]
    if scenario_input.tenure_band != "all":
        cohort = cohort[cohort["tenure_band"] == scenario_input.tenure_band]
    if scenario_input.work_arrangement != "all":
        cohort = cohort[cohort["work_arrangement"] == scenario_input.work_arrangement]
    if scenario_input.overtime_filter != "all":
        cohort = cohort[cohort["overtime_frequency"] == scenario_input.overtime_filter]

    n_eligible = len(cohort)
    if n_eligible == 0:
        # Fallback to total active population if filter produces 0
        cohort = df[df["status"] == "Active"].copy()
        n_eligible = len(cohort)

    # Baseline expected annual attrition rate for this cohort
    # We estimate baseline from cohort's historical rate or risk scores if present
    if "risk_score" in cohort.columns and cohort["risk_score"].notnull().any():
        baseline_rate = float(cohort["risk_score"].mean())
    else:
        # Cohort historical rate
        baseline_rate = float((df["attrition"] == 1).mean())

    baseline_expected_exits = n_eligible * baseline_rate * (scenario_input.time_horizon_months / 12.0)

    # Average departure cost for this cohort
    avg_salary = float(cohort["base_salary"].mean()) if n_eligible > 0 else 85000.0
    cost_per_exit = (
        (avg_salary * config.replacement_cost_pct) +
        (config.avg_vacancy_days * config.daily_vacancy_cost) +
        config.onboarding_training_cost
    )

    # Reach & Adoption
    reach_fraction = scenario_input.assumed_reach_pct / 100.0
    adoption_fraction = scenario_input.assumed_adoption_pct / 100.0
    participating_n = int(round(n_eligible * reach_fraction * adoption_fraction))

    # Intervention Cost
    total_intervention_cost = participating_n * scenario_input.intervention_cost_per_employee

    # Assumed Effect Size: Relative Risk Reduction (RRR)
    # Central = user input; Low = central * 0.65; High = min(0.60, central * 1.35)
    central_rrr = scenario_input.assumed_risk_reduction_pct / 100.0
    low_rrr = max(0.05, central_rrr * 0.65)
    high_rrr = min(0.60, central_rrr * 1.35)

    # Avoided departures = Expected exits * Effective adoption * RRR
    avoided_central = baseline_expected_exits * (participating_n / max(1, n_eligible)) * central_rrr
    avoided_low = baseline_expected_exits * (participating_n / max(1, n_eligible)) * low_rrr
    avoided_high = baseline_expected_exits * (participating_n / max(1, n_eligible)) * high_rrr

    # Gross financial savings
    gross_central = avoided_central * cost_per_exit
    gross_low = avoided_low * cost_per_exit
    gross_high = avoided_high * cost_per_exit

    # Net financial benefit
    net_central = gross_central - total_intervention_cost
    roi_pct = ((net_central) / total_intervention_cost * 100) if total_intervention_cost > 0 else 0.0

    formula_breakdown = [
        {
            "step": "1. Eligible Population",
            "formula": "Count of Active employees matching selected cohort filters",
            "value": f"{n_eligible} employees"
        },
        {
            "step": "2. Expected Baseline Departures",
            "formula": "Eligible Headcount * Baseline Rate * (Horizon / 12 months)",
            "value": f"{round(baseline_expected_exits, 1)} expected exits (rate: {round(baseline_rate * 100, 1)}%)"
        },
        {
            "step": "3. Intervention Reach & Adoption",
            "formula": "Eligible Headcount * Reach % * Adoption %",
            "value": f"{participating_n} participants ({scenario_input.assumed_reach_pct}% reach, {scenario_input.assumed_adoption_pct}% adoption)"
        },
        {
            "step": "4. Average Cost Per Departure",
            "formula": f"({int(config.replacement_cost_pct*100)}% * {config.currency_symbol}{round(avg_salary):,}) + ({config.avg_vacancy_days}d * {config.currency_symbol}{config.daily_vacancy_cost}) + {config.currency_symbol}{config.onboarding_training_cost:,}",
            "value": f"{config.currency_symbol}{round(cost_per_exit):,} per avoided departure"
        },
        {
            "step": "5. Estimated Avoided Departures",
            "formula": f"Expected Exits * Participation Share * Assumed Risk Reduction ({scenario_input.assumed_risk_reduction_pct}%)",
            "value": f"{round(avoided_central, 1)} departures avoided [Range: {round(avoided_low, 1)} - {round(avoided_high, 1)}]"
        },
        {
            "step": "6. Intervention Investment",
            "formula": f"Participating Headcount * Unit Cost ({config.currency_symbol}{scenario_input.intervention_cost_per_employee})",
            "value": f"{config.currency_symbol}{round(total_intervention_cost):,}"
        },
        {
            "step": "7. Estimated Net Benefit & ROI",
            "formula": "Estimated Gross Savings - Intervention Cost",
            "value": f"{config.currency_symbol}{round(net_central):,} net benefit ({round(roi_pct, 1)}% ROI)"
        }
    ]

    return ScenarioResult(
        scenario_id=f"scn_{uuid.uuid4().hex[:8]}",
        name=scenario_input.name,
        created_at=datetime.datetime.now().isoformat(),
        dataset_version="Active Snapshot",
        model_version="LogisticRegression-L2",
        eligible_population=n_eligible,
        participating_employees=participating_n,
        baseline_expected_attritions=round(baseline_expected_exits, 1),
        baseline_attrition_rate_pct=round(baseline_rate * 100, 1),
        assumed_relative_reduction_pct=scenario_input.assumed_risk_reduction_pct,
        estimated_avoided_attritions_central=round(avoided_central, 1),
        estimated_avoided_attritions_low=round(avoided_low, 1),
        estimated_avoided_attritions_high=round(avoided_high, 1),
        estimated_gross_savings_central=round(gross_central, 2),
        estimated_gross_savings_low=round(gross_low, 2),
        estimated_gross_savings_high=round(gross_high, 2),
        total_intervention_cost=round(total_intervention_cost, 2),
        estimated_net_benefit_central=round(net_central, 2),
        estimated_roi_pct=round(roi_pct, 1),
        formula_breakdown=formula_breakdown,
        is_assumption_notice=(
            "HYPOTHETICAL SIMULATION ESTIMATE. The entered risk reduction is a user-specified assumption, "
            "not a measured empirical guarantee. Savings must be verified post-implementation through tracked outcomes."
        )
    )
