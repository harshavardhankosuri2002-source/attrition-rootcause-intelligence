"""
Reproducible synthetic dataset generator for Employee Attrition Root-Cause Intelligence.
All data is synthetically generated with a fixed seed (seed=42) and explicitly labeled.
No real employee data is used.
"""

import random
import datetime
import numpy as np
import pandas as pd
from typing import List, Dict, Any

SEED = 42

DEPARTMENTS = {
    "Engineering": {
        "roles": ["Software Engineer", "Senior Software Engineer", "Staff Engineer", "QA Engineer", "DevOps Engineer"],
        "base_salary_range": (85000, 185000),
        "weight": 0.32
    },
    "Sales": {
        "roles": ["Account Executive", "Senior Account Executive", "Sales Development Rep", "Sales Engineer", "Sales Manager"],
        "base_salary_range": (65000, 150000),
        "weight": 0.22
    },
    "Customer Success": {
        "roles": ["CS Specialist", "CS Manager", "Implementation Consultant", "Technical Support Specialist"],
        "base_salary_range": (60000, 115000),
        "weight": 0.16
    },
    "Marketing": {
        "roles": ["Marketing Manager", "Content Strategist", "Growth Marketing Lead", "Product Marketing Specialist"],
        "base_salary_range": (70000, 135000),
        "weight": 0.11
    },
    "Product": {
        "roles": ["Product Manager", "Senior Product Manager", "Product Designer", "User Researcher"],
        "base_salary_range": (90000, 175000),
        "weight": 0.08
    },
    "Operations": {
        "roles": ["Operations Analyst", "Finance Specialist", "Business Operations Manager"],
        "base_salary_range": (65000, 120000),
        "weight": 0.06
    },
    "People & HR": {
        "roles": ["HR Generalist", "Technical Recruiter", "People Partner", "Total Rewards Specialist"],
        "base_salary_range": (65000, 125000),
        "weight": 0.05
    }
}

LOCATIONS = [
    ("San Francisco (HQ)", 0.32),
    ("New York", 0.24),
    ("Austin", 0.16),
    ("London", 0.12),
    ("Remote - US", 0.11),
    ("Remote - EMEA", 0.05),
]

WORK_ARRANGEMENTS = [("Hybrid", 0.54), ("Fully Remote", 0.28), ("In-Office", 0.18)]
AGE_BANDS = [("20-29", 0.28), ("30-39", 0.44), ("40-49", 0.20), ("50+", 0.08)]
GENDERS = [("Female", 0.44), ("Male", 0.51), ("Non-Binary / Undeclared", 0.05)]


def generate_synthetic_dataset(num_records: int = 1250, seed: int = SEED) -> pd.DataFrame:
    """
    Generates a realistic cohort of synthetic employee records.
    Calculates realistic hazard logits with noise so machine learning models
    achieve realistic AUC (~0.78 - 0.83) without target leakage or trivial determinism.
    """
    random.seed(seed)
    np.random.seed(seed)

    records: List[Dict[str, Any]] = []
    ref_date = datetime.date(2025, 10, 1)

    dept_names = list(DEPARTMENTS.keys())
    dept_weights = [DEPARTMENTS[d]["weight"] for d in dept_names]

    loc_names = [l[0] for l in LOCATIONS]
    loc_weights = [l[1] for l in LOCATIONS]

    arr_names = [a[0] for a in WORK_ARRANGEMENTS]
    arr_weights = [a[1] for a in WORK_ARRANGEMENTS]

    age_names = [a[0] for a in AGE_BANDS]
    age_weights = [a[1] for a in AGE_BANDS]

    gen_names = [g[0] for g in GENDERS]
    gen_weights = [g[1] for g in GENDERS]

    for i in range(1, num_records + 1):
        emp_id = f"EMP-{1000 + i}"
        name = f"Employee {1000 + i}"

        # Assign Dept & Role
        dept = random.choices(dept_names, weights=dept_weights, k=1)[0]
        role = random.choice(DEPARTMENTS[dept]["roles"])
        min_sal, max_sal = DEPARTMENTS[dept]["base_salary_range"]

        location = random.choices(loc_names, weights=loc_weights, k=1)[0]
        work_arr = random.choices(arr_names, weights=arr_weights, k=1)[0]
        age_band = random.choices(age_names, weights=age_weights, k=1)[0]
        gender = random.choices(gen_names, weights=gen_weights, k=1)[0]

        # Tenure in months (distributed between 3 and 72 months)
        tenure_months = round(float(np.random.gamma(shape=2.5, scale=10.0)), 1)
        tenure_months = max(3.0, min(tenure_months, 72.0))

        if tenure_months < 12:
            tenure_band = "< 1 year"
        elif tenure_months < 24:
            tenure_band = "1 - 2 years"
        elif tenure_months < 48:
            tenure_band = "2 - 4 years"
        else:
            tenure_band = "4+ years"

        # Hire date
        hire_days_ago = int(tenure_months * 30.4375)
        hire_date = ref_date - datetime.timedelta(days=hire_days_ago)

        # Base Salary & Compa-ratio
        # Seniority boost based on tenure
        tenure_factor = 1.0 + (tenure_months / 120.0)
        base_salary = round(random.uniform(min_sal, max_sal) * tenure_factor, -2)
        # Compa-ratio represents employee pay relative to market midpoint (0.75 to 1.25)
        compa_ratio = round(float(np.random.normal(0.98, 0.11)), 2)
        compa_ratio = max(0.72, min(1.30, compa_ratio))

        # Overtime frequency
        # Engineering and Customer Success experience higher overtime rates
        if dept in ["Customer Success", "Sales", "Engineering"]:
            ot_weights = [0.28, 0.44, 0.28]  # Frequent, Moderate, Rare
        else:
            ot_weights = [0.12, 0.38, 0.50]
        overtime_freq = random.choices(["Frequent / High", "Moderate", "Rare / Never"], weights=ot_weights, k=1)[0]

        # Engagement score (1.0 to 5.0)
        eng_score = round(float(np.random.normal(3.7, 0.75)), 1)
        eng_score = max(1.0, min(5.0, eng_score))

        # Manager satisfaction (1.0 to 5.0)
        mgr_sat = round(float(np.random.normal(3.8, 0.8)), 1)
        mgr_sat = max(1.0, min(5.0, mgr_sat))

        # Promotion recency
        max_promo_months = min(tenure_months, 48.0)
        last_promo_months = round(random.uniform(0.0, max_promo_months), 1)

        # Trainings completed (0 to 12)
        trainings = int(np.random.poisson(lam=max(1.0, tenure_months * 0.15)))
        trainings = min(trainings, 12)

        # Commute distance
        if work_arr == "Fully Remote":
            commute_dist = 0.0
        else:
            commute_dist = round(float(np.random.exponential(scale=11.0) + 2.0), 1)
            commute_dist = min(55.0, commute_dist)

        # Realistic missingness (for validation and real data testing)
        # 2% of engagement scores missing, 1.5% of manager satisfaction missing
        if random.random() < 0.02:
            eng_score = None
        if random.random() < 0.015:
            mgr_sat = None

        # Performance rating
        perf_rating = round(random.choices([2.0, 3.0, 4.0, 5.0], weights=[0.05, 0.48, 0.38, 0.09], k=1)[0], 1)

        # --- Underlying Latent Hazard for Attrition ---
        # Baseline log-odds
        logit = -1.95

        # Overtime factor
        if overtime_freq == "Frequent / High":
            logit += 0.85
        elif overtime_freq == "Rare / Never":
            logit -= 0.30

        # Compa-ratio penalty if below 0.88 market parity
        if compa_ratio < 0.88:
            logit += 0.75
        elif compa_ratio > 1.10:
            logit -= 0.35

        # Engagement score influence
        eff_eng = eng_score if eng_score is not None else 3.5
        if eff_eng < 2.8:
            logit += 0.90
        elif eff_eng > 4.2:
            logit -= 0.65

        # Manager satisfaction
        eff_mgr = mgr_sat if mgr_sat is not None else 3.7
        if eff_mgr < 2.5:
            logit += 0.60

        # Career stagnation (no promotion in > 28 months for longer tenures)
        if tenure_months > 24 and last_promo_months > 24:
            logit += 0.55

        # 1-2 year retention cliff
        if tenure_band == "1 - 2 years":
            logit += 0.40

        # Work arrangement: Long commute in-office increases hazard
        if work_arr == "In-Office" and commute_dist > 25:
            logit += 0.35

        # Dept baseline variance (Customer Success & Sales naturally have higher industry churn)
        if dept in ["Customer Success", "Sales"]:
            logit += 0.25
        elif dept == "Operations":
            logit -= 0.30

        # Random individual noise
        logit += float(np.random.normal(0, 0.35))

        # Logistic probability
        p_attrition = 1.0 / (1.0 + np.exp(-logit))

        # Outcome assignment
        attrited = 1 if (random.random() < p_attrition) else 0

        if attrited == 1:
            status = "Terminated"
            # Termination date occurred between hire date + 3 months and reference date
            term_offset_days = random.randint(90, max(91, hire_days_ago - 10))
            term_date = (hire_date + datetime.timedelta(days=term_offset_days)).isoformat()
        else:
            status = "Active"
            term_date = None

        record = {
            "employee_id": emp_id,
            "name": name,
            "department": dept,
            "job_role": role,
            "location": location,
            "work_arrangement": work_arr,
            "hire_date": hire_date.isoformat(),
            "termination_date": term_date,
            "status": status,
            "attrition": attrited,
            "tenure_months": tenure_months,
            "tenure_band": tenure_band,
            "age_band": age_band,
            "gender": gender,
            "base_salary": base_salary,
            "compa_ratio": compa_ratio,
            "overtime_frequency": overtime_freq,
            "engagement_score": eng_score,
            "manager_satisfaction": mgr_sat,
            "last_promotion_months_ago": last_promo_months,
            "trainings_completed": trainings,
            "performance_rating": perf_rating,
            "commute_distance_miles": commute_dist,
            "is_synthetic": True,
        }
        records.append(record)

    df = pd.DataFrame(records)
    return df
