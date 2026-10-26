# RetentionIQ — Employee Attrition Root-Cause Intelligence

[![Python](https://img.shields.io/badge/Python-3.14%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

> **Enterprise Decision-Support System**: Empowers authorized HR and business leaders to understand workforce attrition patterns, assess risk under statistical uncertainty, investigate hypotheses without false causal claims, simulate retention interventions, and track realized outcomes.

---

## 🛡️ Epistemic Standards & Decision-Support Policy

RetentionIQ enforces strict boundaries across analytical assertions:

1. **Observed Historical Facts**: Calculated directly from verified operational employee records (explicit numerators, denominators, and date windows).
2. **Model Estimates & Uncertainty**: Probabilities generated from holdout evaluations (ROC-AUC, PR-AUC, Brier score, calibration curves). Scores represent statistical associations on past data, not individual destiny.
3. **Associations vs Hypotheses**: Disproportionate attrition rates in cohorts are flagged as **empirical hypotheses for human review**, not definitive causes.
4. **Causal Effects**: Never claimed unless supported by a suitable experimental or quasi-experimental design (e.g., randomized rollout, difference-in-differences, or regression discontinuity).
5. **Financial Accounting**: Transparently separates calculated historical turnover costs from hypothetical scenario potential and verified realized savings.
6. **Non-Consequential Decision Safeguard**: **Strictly decision-support**. Prohibited from making or recommending automated hiring, firing, promotion, compensation, or adverse personnel decisions.

---

## 🚀 Quickstart & Local Execution

The application is completely self-contained with a local demo mode and reproducible synthetic dataset. No external credentials or paid APIs are required.

### Prerequisites

- **Python**: 3.10+ (tested on Python 3.14) with `fastapi`, `uvicorn`, `pandas`, `scikit-learn`, `scipy`, `pydantic`.
- **Node.js**: v18+ with `npm`.

### Installation & Run

1. **Navigate to the application workspace**:
   ```bash
   cd C:\Users\harsh\.gemini\antigravity-ide\scratch\attrition-rootcause-intelligence
   ```

2. **Run the Backend & Web Application**:
   FastAPI automatically mounts and serves the production-compiled React frontend at the root:
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
   ```
   Open your browser to: **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)**

3. **Development Mode (Vite Hot-Reload)**:
   If developing frontend components with live HMR:
   ```bash
   # Terminal 1: Backend
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

   # Terminal 2: Frontend Vite dev server (proxies /api to 8000)
   npm run dev
   ```
   Access Vite dev server at: **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**

4. **Running Unit & Statistical Tests**:
   ```bash
   python -m pytest tests/test_analytics.py -v
   ```

---

## 🏗️ Architecture & Component Design

```
attrition-rootcause-intelligence/
├── backend/
│   ├── main.py                  # FastAPI REST API, routing, audit logging, formula injection defense
│   ├── models.py                # Pydantic schemas, data contracts, and validation rules
│   ├── synthetic_data.py        # Reproducible synthetic cohort generator (seed=42, n=1,250)
│   ├── analytics_engine.py      # Chi-square contingency tests, Odds Ratios (95% CI), cohort profiling
│   ├── ml_engine.py             # Stratified holdout pipeline, ROC/PR curves, calibration, fairness audit
│   ├── financial_engine.py      # Turnover replacement/vacancy cost formulas & what-if simulator
│   ├── interventions.py         # Retention playbook catalog, recommendation engine, outcome register
│   └── analyst_llm.py           # Grounded conversational engine with server-side tool execution
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Dataset badge, role switcher, regenerate, audit log, upload triggers
│   │   ├── FilterBar.tsx        # Persistent global analytical filter scope
│   │   ├── EmployeeDetailModal.tsx # Privacy-conscious drawer (masked PII, observed facts, model factors)
│   │   ├── AuditLogModal.tsx    # Governance & compliance audit trail
│   │   ├── CostConfigModal.tsx  # Editable turnover replacement & vacancy cost parameters
│   │   └── UploadModal.tsx      # Ingestion preview, schema mapping, and validation checker
│   ├── pages/
│   │   ├── OverviewPage.tsx     # Executive KPIs, quarterly trend, risk distribution, pattern cards
│   │   ├── DataWorkspacePage.tsx # Canonical schema profiling, missingness rates, privacy toggles
│   │   ├── WorkforceAnalyticsPage.tsx # Cohort comparative bars, 95% CIs, drill-down employee directory
│   │   ├── RootCausePage.tsx    # 2x2 contingency analysis, Odds Ratios, multivariable regressions
│   │   ├── ModelEvaluationPage.tsx # Stratified holdout metrics, ROC/PR curves, fairness audit
│   │   ├── RecommendationsPage.tsx # Data-grounded supportive suggestions & intervention catalog
│   │   ├── FinancialScenariosPage.tsx # Transparent cost formulas, interactive what-if simulator
│   │   ├── InterventionsRegisterPage.tsx # Outcome tracker with quasi-experimental comparison cohorts
│   │   └── AnalystChatPage.tsx  # Zero-hallucination grounded AI analyst with verified citations
│   ├── services/
│   │   └── api.ts               # Typed frontend API client
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Root state orchestration & primary tab router
│   ├── main.tsx                 # React DOM mount point
│   └── index.css                # Enterprise design tokens, dark palette, custom scrollbars
├── tests/
│   └── test_analytics.py        # Comprehensive pytest suite for analytics, ML, and financial math
├── dist/                        # Compiled production frontend bundle
├── package.json                 # Node.js dependencies (React, Vite, Recharts, Tailwind CSS)
└── README.md                    # System documentation
```

---

## 🔬 Analytical & Statistical Methods

### 1. 2x2 Contingency Analysis & Chi-Square Tests
- Evaluates categorical factors (e.g. Frequent Overtime vs Rare Overtime) against binary attrition.
- Computes **Odds Ratio (OR)** with Woolf's 95% Confidence Interval:
  $$\text{Odds Ratio} = \frac{(a + 0.5) \cdot (d + 0.5)}{(b + 0.5) \cdot (c + 0.5)}$$
  $$\text{SE}(\ln \text{OR}) = \sqrt{\frac{1}{a+0.5} + \frac{1}{b+0.5} + \frac{1}{c+0.5} + \frac{1}{d+0.5}}$$
- Conducts Pearson's Chi-Square Test of Independence with Yates' continuity correction (`scipy.stats.chi2_contingency`).

### 2. Machine Learning Holdout Evaluation
- **Target Definition**: Binary historical departure (`attrition == 1`).
- **Data Splitting**: Stratified 75% Train / 25% Held-out Test split.
- **Preprocessing**: Median imputation for numeric features, StandardScaler normalization, One-Hot Encoding for categorical features.
- **Protected Attribute Safeguard**: Sensitive characteristics (`gender`, `age_band`) are strictly excluded from predictive features.
- **Evaluation Metrics on Held-out Data**:
  - Receiver Operating Characteristic Area Under Curve (ROC-AUC)
  - Precision-Recall Area Under Curve (PR-AUC)
  - Brier score loss for probability calibration
  - Confusion Matrix evaluated at user-selected threshold ($\tau = 0.35$ default)
  - Demographic Parity & Error Rate parity audit across protected groups.

### 3. Financial Modeling & What-If Simulator
- **Turnover Cost Formula**:
  $$\text{Cost per Departure} = (\text{Base Salary} \times \text{Replacement \%}) + (\text{Vacancy Days} \times \text{Daily Cost}) + \text{Onboarding Cost}$$
- **Avoided Departures Estimation**:
  $$\text{Avoided Exits} = \text{Eligible Cohort} \times \text{Baseline Hazard} \times \left(\frac{\text{Horizon}}{12}\right) \times \text{Participation Rate} \times \text{Assumed RRR}$$
- Exposes Central, Low ($0.65\times$), and High ($1.35\times$) uncertainty bounds for all ROI projections.

---

## 🔒 Security, Privacy & Responsible Use Safeguards

- **Identifier Masking**: Identifiers are masked by default (e.g., `EMP-***842`) for Executive and People Analyst roles. Full IDs are restricted to System Admin.
- **Spreadsheet Formula Injection Defense**: In all CSV exports, any cell string beginning with `=`, `+`, `-`, or `@` is prepended with a single quote (`'`) to neutralize Excel/Sheets formula injection.
- **File Ingestion Size & Format Verification**: Enforces a 15MB limit, accepts only valid CSV/Excel files, verifies date columns, and alerts on row-level anomalies prior to import confirmation.
- **Immutable Audit Trail**: Logs dataset regeneration, model training runs, scenario simulations, analyst queries, and CSV exports.

---

## ⚖️ Governance & Legal Disclaimers

> **Disclaimer**: RetentionIQ is an advisory decision-support product. It does not replace human judgment, ethical review, or consultation with employee representatives. Scores and risk bands reflect observational co-occurrences in past data and must never be used to make adverse individual employment decisions.
