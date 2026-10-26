"""
FastAPI Server for Employee Attrition Root-Cause Intelligence.
Handles data ingestion, validation, statistical analysis, model pipelines,
financial modeling, intervention lifecycle, and conversational analyst tool router.
"""

import os
import io
import csv
import json
import math
import uuid
import datetime
import pandas as pd
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, StreamingResponse

from backend.models import (
    FilterCriteria,
    FinancialConfig,
    ScenarioInput,
    InterventionRecord
)
from backend.synthetic_data import generate_synthetic_dataset
from backend.analytics_engine import (
    get_overview_metrics,
    compute_cohort_breakdown,
    compute_all_root_cause_investigations,
    apply_filters
)
import backend.ml_engine as ml_engine
from backend.ml_engine import (
    train_and_evaluate_model,
    score_population,
    get_employee_explanation,
)
from backend.financial_engine import (
    compute_historical_attrition_cost,
    simulate_what_if_scenario
)
from backend.interventions import (
    INTERVENTION_CATALOG,
    SEED_INTERVENTIONS,
    generate_data_grounded_recommendations
)
from backend.analyst_llm import query_workforce_analyst

app = FastAPI(
    title="RetentionIQ API",
    description="Evidence-based workforce retention decision-support system with causal safeguards",
    version="1.0.0"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for active session
DATA_REGISTRY: Dict[str, pd.DataFrame] = {}
DATA_META: Dict[str, Any] = {}
CURRENT_FINANCIAL_CONFIG = FinancialConfig()
INTERVENTIONS_STORE: List[Dict[str, Any]] = list(SEED_INTERVENTIONS)
AUDIT_LOGS: List[Dict[str, Any]] = []


def record_audit(action: str, details: str, user_role: str = "People Analyst"):
    """Appends an entry to the security and compliance audit log."""
    AUDIT_LOGS.insert(0, {
        "timestamp": datetime.datetime.now().isoformat(),
        "action": action,
        "details": details,
        "user_role": user_role
    })
    # Keep last 100 entries
    if len(AUDIT_LOGS) > 100:
        AUDIT_LOGS.pop()


# Initialize with reproducible synthetic dataset on startup
def initialize_default_dataset():
    df = generate_synthetic_dataset(num_records=1250, seed=42)
    dataset_id = "synthetic_default_v1"
    DATA_REGISTRY[dataset_id] = df

    DATA_META[dataset_id] = {
        "id": dataset_id,
        "name": "Benchmark Enterprise Synthetic Cohort (n=1,250)",
        "created_at": datetime.datetime.now().isoformat(),
        "record_count": len(df),
        "active_count": int((df["status"] == "Active").sum()),
        "attrition_count": int((df["attrition"] == 1).sum()),
        "historical_rate_pct": round(((df["attrition"] == 1).sum() / len(df)) * 100, 2),
        "is_active": True,
        "is_synthetic": True,
        "columns": list(df.columns),
        "missing_rates": {col: round(float(df[col].isnull().mean()) * 100, 1) for col in df.columns if df[col].isnull().any()}
    }

    # Automatically train an initial reference model so metrics and risk distribution are ready
    try:
        train_and_evaluate_model(df, algorithm="LogisticRegression", test_size=0.25, random_state=42, threshold=0.35)
    except Exception as e:
        print(f"Warning: Initial model training deferred: {e}")

    record_audit("SYSTEM_INIT", "Synthetic demo dataset generated with seed=42 and activated.", "System")


initialize_default_dataset()


def get_active_df() -> pd.DataFrame:
    """Returns the currently active dataset."""
    for ds_id, meta in DATA_META.items():
        if meta.get("is_active"):
            return DATA_REGISTRY[ds_id]
    # Fallback to first available
    first_id = list(DATA_REGISTRY.keys())[0]
    return DATA_REGISTRY[first_id]


# --- Health & Metadata ---
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RetentionIQ Decision-Support Engine",
        "timestamp": datetime.datetime.now().isoformat(),
        "active_dataset": DATA_META.get(list(DATA_REGISTRY.keys())[0], {}).get("name", "None")
    }


@app.get("/api/dataset/meta")
def get_dataset_metadata():
    active_df = get_active_df()
    active_id = [k for k, v in DATA_META.items() if v.get("is_active")][0]
    meta = DATA_META[active_id]
    return {
        "meta": meta,
        "all_datasets": list(DATA_META.values())
    }


@app.post("/api/dataset/regenerate-synthetic")
def regenerate_synthetic():
    """Regenerates the benchmark synthetic dataset with fresh random variation."""
    new_seed = int(datetime.datetime.now().timestamp()) % 10000
    df = generate_synthetic_dataset(num_records=1250, seed=new_seed)
    dataset_id = f"synthetic_{new_seed}"

    # Deactivate previous
    for v in DATA_META.values():
        v["is_active"] = False

    DATA_REGISTRY[dataset_id] = df
    DATA_META[dataset_id] = {
        "id": dataset_id,
        "name": f"Regenerated Synthetic Cohort (seed={new_seed}, n=1,250)",
        "created_at": datetime.datetime.now().isoformat(),
        "record_count": len(df),
        "active_count": int((df["status"] == "Active").sum()),
        "attrition_count": int((df["attrition"] == 1).sum()),
        "historical_rate_pct": round(((df["attrition"] == 1).sum() / len(df)) * 100, 2),
        "is_active": True,
        "is_synthetic": True,
        "columns": list(df.columns),
        "missing_rates": {col: round(float(df[col].isnull().mean()) * 100, 1) for col in df.columns if df[col].isnull().any()}
    }

    train_and_evaluate_model(df, algorithm="LogisticRegression", test_size=0.25, random_state=42, threshold=0.35)
    record_audit("DATASET_REGENERATED", f"Regenerated synthetic dataset with seed={new_seed}", "People Analyst")

    return {"status": "success", "message": f"Regenerated synthetic dataset with seed {new_seed}", "dataset": DATA_META[dataset_id]}


# --- Ingestion & Validation ---
@app.post("/api/dataset/upload-preview")
async def upload_preview(file: UploadFile = File(...)):
    """
    Validates uploaded CSV or Excel file without writing directly to active data.
    Inspects column structure, identifies canonical mapping, checks invalid dates,
    detects negative values, and returns preview and validation errors/warnings.
    """
    if not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .csv or .xlsx file.")

    content = await file.read()
    if len(content) > 15 * 1024 * 1024:  # 15MB limit
        raise HTTPException(status_code=400, detail="File exceeds 15MB size limit.")

    try:
        if file.filename.endswith(".csv"):
            preview_df = pd.read_csv(io.BytesIO(content), nrows=100)
        else:
            preview_df = pd.read_excel(io.BytesIO(content), nrows=100)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

    # Column mapping validation against Canonical Schema
    canonical_schema = {
        "employee_id": {"required": True, "type": "string"},
        "department": {"required": True, "type": "string"},
        "job_role": {"required": True, "type": "string"},
        "hire_date": {"required": True, "type": "date"},
        "attrition": {"required": True, "type": "integer_or_boolean"},
        "tenure_months": {"required": False, "type": "numeric"},
        "base_salary": {"required": False, "type": "numeric"},
        "compa_ratio": {"required": False, "type": "numeric"},
        "overtime_frequency": {"required": False, "type": "category"}
    }

    uploaded_cols = list(preview_df.columns)
    mapped_columns = {}
    missing_required = []

    for c_field, spec in canonical_schema.items():
        # Fuzzy case-insensitive match
        match = next((col for col in uploaded_cols if col.lower().replace("_", "").replace(" ", "") == c_field.replace("_", "")), None)
        if match:
            mapped_columns[c_field] = match
        elif spec["required"]:
            missing_required.append(c_field)

    # Validation checks
    errors = []
    warnings = []

    if missing_required:
        errors.append(f"Missing required canonical fields: {', '.join(missing_required)}")

    # Check for empty file
    if len(preview_df) == 0:
        errors.append("File contains 0 data rows.")

    # Check date column validity
    date_col = mapped_columns.get("hire_date")
    if date_col and date_col in preview_df.columns:
        invalid_dates = pd.to_datetime(preview_df[date_col], errors="coerce").isnull().sum()
        if invalid_dates > 0:
            warnings.append(f"{invalid_dates} rows contain unparseable dates in column '{date_col}'.")

    # Sample rows for preview (masking names/ids if present)
    preview_rows = preview_df.head(10).to_dict(orient="records")

    record_audit("DATASET_PREVIEWED", f"Previewed upload '{file.filename}' ({len(preview_df)} sample rows inspected)", "People Analyst")

    return {
        "filename": file.filename,
        "row_count_preview": len(preview_df),
        "columns_found": uploaded_cols,
        "mapped_columns": mapped_columns,
        "missing_required": missing_required,
        "validation_errors": errors,
        "validation_warnings": warnings,
        "can_import": len(errors) == 0,
        "preview_rows": preview_rows
    }


# --- Overview & Workforce Analytics ---
@app.get("/api/overview")
def get_overview(
    department: str = Query("all"),
    location: str = Query("all"),
    work_arrangement: str = Query("all"),
    tenure_band: str = Query("all")
):
    df = get_active_df()
    filters = {
        "department": department,
        "location": location,
        "work_arrangement": work_arrangement,
        "tenure_band": tenure_band
    }
    return get_overview_metrics(df, filters, ml_engine.ACTIVE_MODEL["eval_result"] if ml_engine.ACTIVE_MODEL else None)


@app.get("/api/workforce-analytics/cohort")
def get_cohort_analytics(
    dimension: str = Query("department"),
    department: str = Query("all"),
    location: str = Query("all"),
    work_arrangement: str = Query("all"),
    tenure_band: str = Query("all")
):
    df = get_active_df()
    filters = {
        "department": department,
        "location": location,
        "work_arrangement": work_arrangement,
        "tenure_band": tenure_band
    }
    return compute_cohort_breakdown(df, dimension, filters)


@app.get("/api/workforce-analytics/employees")
def list_employees(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=5, le=100),
    search: str = Query(""),
    status: str = Query("all"),
    risk_band: str = Query("all"),
    department: str = Query("all"),
    user_role: str = Query("Executive / HR Leader")
):
    df = get_active_df()
    filtered = df.copy()

    if status != "all":
        filtered = filtered[filtered["status"] == status]

    if department != "all":
        filtered = filtered[filtered["department"] == department]

    if risk_band != "all" and "risk_band" in filtered.columns:
        filtered = filtered[filtered["risk_band"] == risk_band]

    if search:
        search_lower = search.lower()
        filtered = filtered[
            filtered["employee_id"].str.lower().str.contains(search_lower, na=False) |
            filtered["job_role"].str.lower().str.contains(search_lower, na=False) |
            filtered["department"].str.lower().str.contains(search_lower, na=False)
        ]

    total_records = len(filtered)
    start_idx = (page - 1) * limit
    page_df = filtered.iloc[start_idx : start_idx + limit]

    # Convert to privacy-conscious records
    records = []
    for _, row in page_df.iterrows():
        raw_id = str(row["employee_id"])
        # Privacy masking: Analyst and Executive see masked identifiers
        masked_id = f"EMP-***{raw_id[-3:]}" if user_role != "System Admin" else raw_id

        records.append({
            "employee_id": raw_id,
            "masked_id": masked_id,
            "department": row["department"],
            "job_role": row["job_role"],
            "location": row["location"],
            "work_arrangement": row["work_arrangement"],
            "status": row["status"],
            "tenure_months": float(row["tenure_months"]),
            "tenure_band": row["tenure_band"],
            "compa_ratio": float(row["compa_ratio"]),
            "overtime_frequency": row["overtime_frequency"],
            "engagement_score": float(row["engagement_score"]) if pd.notnull(row["engagement_score"]) else None,
            "risk_score": float(row["risk_score"]) if ("risk_score" in row and pd.notnull(row["risk_score"])) else None,
            "risk_band": str(row["risk_band"]) if ("risk_band" in row and pd.notnull(row["risk_band"])) else None
        })

    return {
        "page": page,
        "limit": limit,
        "total_records": total_records,
        "total_pages": math.ceil(total_records / limit) if limit > 0 else 1,
        "employees": records
    }


@app.get("/api/employee/{emp_id}")
def get_employee_detail(emp_id: str):
    df = get_active_df()
    explanation = get_employee_explanation(df, emp_id)
    if not explanation:
        raise HTTPException(status_code=404, detail=f"Employee '{emp_id}' not found.")
    return explanation


# --- Root-Cause Evidence ---
@app.get("/api/root-cause/investigations")
def get_root_cause_investigations(
    department: str = Query("all"),
    location: str = Query("all"),
    work_arrangement: str = Query("all"),
    tenure_band: str = Query("all")
):
    df = get_active_df()
    filters = {
        "department": department,
        "location": location,
        "work_arrangement": work_arrangement,
        "tenure_band": tenure_band
    }
    return compute_all_root_cause_investigations(df, filters)


# --- Model Training & Evaluation ---
@app.post("/api/model/train")
def train_model(
    algorithm: str = Query("LogisticRegression"),
    test_size: float = Query(0.25, ge=0.10, le=0.40),
    threshold: float = Query(0.35, ge=0.10, le=0.90)
):
    df = get_active_df()
    try:
        eval_result = train_and_evaluate_model(
            df=df,
            algorithm=algorithm,
            test_size=test_size,
            threshold=threshold,
            random_state=42
        )
        record_audit("MODEL_TRAINED", f"Trained {algorithm} model with {int((1-test_size)*100)}/{int(test_size*100)} split (ROC-AUC={eval_result['model_roc_auc']})", "People Analyst")
        return {"status": "success", "evaluation": eval_result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/model/evaluation")
def get_model_evaluation():
    if ml_engine.ACTIVE_MODEL is None or "eval_result" not in ml_engine.ACTIVE_MODEL:
        raise HTTPException(status_code=404, detail="No active model evaluation available. Train a model first.")
    return ml_engine.ACTIVE_MODEL["eval_result"]


# --- Recommendations & Interventions ---
@app.get("/api/recommendations")
def get_recommendations():
    df = get_active_df()
    return generate_data_grounded_recommendations(df)


@app.get("/api/interventions/catalog")
def get_catalog():
    return INTERVENTION_CATALOG


@app.get("/api/interventions")
def get_interventions():
    return INTERVENTIONS_STORE


@app.post("/api/interventions")
def create_intervention(intervention: InterventionRecord):
    new_record = intervention.model_dump()
    if not new_record.get("id"):
        new_record["id"] = f"INT-REG-{len(INTERVENTIONS_STORE)+1:03d}"
    INTERVENTIONS_STORE.insert(0, new_record)
    record_audit("INTERVENTION_CREATED", f"Created intervention '{intervention.title}'", "People Analyst")
    return {"status": "success", "intervention": new_record}


@app.put("/api/interventions/{int_id}")
def update_intervention(int_id: str, updated: Dict[str, Any]):
    match = next((item for item in INTERVENTIONS_STORE if item["id"] == int_id), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Intervention '{int_id}' not found.")

    for k, v in updated.items():
        if k != "id":
            match[k] = v

    record_audit("INTERVENTION_UPDATED", f"Updated intervention '{int_id}' (status: {match.get('status')})", "People Analyst")
    return {"status": "success", "intervention": match}


# --- Financial Impact & Scenarios ---
@app.get("/api/financial/config")
def get_financial_config():
    return CURRENT_FINANCIAL_CONFIG


@app.post("/api/financial/config")
def update_financial_config(config: FinancialConfig):
    global CURRENT_FINANCIAL_CONFIG
    CURRENT_FINANCIAL_CONFIG = config
    record_audit("FINANCIAL_CONFIG_UPDATED", f"Updated cost config (Replacement %: {config.replacement_cost_pct*100}%)", "System Admin")
    return {"status": "success", "config": CURRENT_FINANCIAL_CONFIG}


@app.get("/api/financial/historical-cost")
def get_historical_cost(
    department: str = Query("all"),
    location: str = Query("all"),
    work_arrangement: str = Query("all"),
    tenure_band: str = Query("all")
):
    df = get_active_df()
    filters = {
        "department": department,
        "location": location,
        "work_arrangement": work_arrangement,
        "tenure_band": tenure_band
    }
    return compute_historical_attrition_cost(df, CURRENT_FINANCIAL_CONFIG, filters)


@app.post("/api/financial/simulate-scenario")
def simulate_scenario(scenario_input: ScenarioInput):
    df = get_active_df()
    result = simulate_what_if_scenario(df, scenario_input, CURRENT_FINANCIAL_CONFIG)
    record_audit("SCENARIO_SIMULATED", f"Simulated scenario '{scenario_input.name}' (Avoided: {result.estimated_avoided_attritions_central} exits)", "People Analyst")
    return result


# --- Grounded Conversational Analyst ---
@app.post("/api/analyst/query")
def ask_analyst(payload: Dict[str, Any]):
    df = get_active_df()
    question = payload.get("question", "")
    filters = payload.get("filters", {"department": "all", "location": "all", "work_arrangement": "all", "tenure_band": "all"})
    history = payload.get("history", [])

    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    res = query_workforce_analyst(df, question, filters, history)
    record_audit("ANALYST_QUERY", f"Executed grounded query: '{question[:50]}...'", "People Analyst")
    return res


# --- Audit Log & Governance ---
@app.get("/api/audit-log")
def get_audit_log():
    return AUDIT_LOGS


# --- Export with Spreadsheet Formula Injection Defense ---
@app.get("/api/export/cohorts.csv")
def export_cohorts(dimension: str = "department"):
    df = get_active_df()
    res = compute_cohort_breakdown(df, dimension, {"department": "all", "location": "all", "work_arrangement": "all", "tenure_band": "all"})

    output = io.StringIO()
    writer = csv.writer(output)

    # Header with export metadata
    writer.writerow(["# RetentionIQ Export", f"Dimension: {dimension}", f"Export Timestamp: {datetime.datetime.now().isoformat()}", "Classification: Strictly Confidential"])
    writer.writerow(["Cohort", "Headcount", "Active Headcount", "Attrition Count", "Attrition Rate (%)", "95% CI Lower (%)", "95% CI Upper (%)", "Share of Total (%)"])

    for c in res["cohorts"]:
        # Formula injection mitigation: prepend single-quote if string starts with =, +, -, @
        val_name = str(c["cohort_name"])
        if val_name.startswith(("=", "+", "-", "@")):
            val_name = f"'{val_name}"

        writer.writerow([
            val_name,
            c["headcount"],
            c["active_headcount"],
            c["attrition_count"],
            c["attrition_rate_pct"],
            c["ci_95_lower"],
            c["ci_95_upper"],
            c["share_of_total_pct"]
        ])

    record_audit("DATA_EXPORTED", f"Exported cohort breakdown for dimension '{dimension}'", "Executive / HR Leader")

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=retention_cohorts_{dimension}_{datetime.date.today()}.csv"}
    )


# Mount static production frontend if built
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
if os.path.exists(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
