import {
  FilterCriteria,
  DatasetMeta,
  OverviewSummary,
  CohortAnalysisResult,
  EmployeeSummary,
  EmployeeDetail,
  StatisticalTest,
  ModelEvaluation,
  RecommendationItem,
  FinancialConfig,
  HistoricalTurnoverCost,
  ScenarioResult,
  InterventionRecord,
  AuditLogEntry
} from '../types';

const API_BASE = '/api';

function buildQuery(filters: FilterCriteria, extra: Record<string, any> = {}): string {
  const params = new URLSearchParams();
  if (filters.department) params.append('department', filters.department);
  if (filters.location) params.append('location', filters.location);
  if (filters.work_arrangement) params.append('work_arrangement', filters.work_arrangement);
  if (filters.tenure_band) params.append('tenure_band', filters.tenure_band);

  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null) {
      params.append(k, String(v));
    }
  }
  return params.toString();
}

export const api = {
  async getDatasetMeta(): Promise<{ meta: DatasetMeta; all_datasets: DatasetMeta[] }> {
    const res = await fetch(`${API_BASE}/dataset/meta`);
    if (!res.ok) throw new Error('Failed to fetch dataset metadata');
    return res.json();
  },

  async regenerateSynthetic(): Promise<{ status: string; message: string; dataset: DatasetMeta }> {
    const res = await fetch(`${API_BASE}/dataset/regenerate-synthetic`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to regenerate synthetic dataset');
    return res.json();
  },

  async uploadPreview(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/dataset/upload-preview`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload error' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  async getOverview(filters: FilterCriteria): Promise<OverviewSummary> {
    const res = await fetch(`${API_BASE}/overview?${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to fetch overview summary');
    return res.json();
  },

  async getCohortAnalytics(dimension: string, filters: FilterCriteria): Promise<CohortAnalysisResult> {
    const res = await fetch(`${API_BASE}/workforce-analytics/cohort?${buildQuery(filters, { dimension })}`);
    if (!res.ok) throw new Error('Failed to fetch cohort analytics');
    return res.json();
  },

  async getEmployees(
    filters: FilterCriteria,
    options: { page?: number; limit?: number; search?: string; status?: string; risk_band?: string; user_role?: string }
  ): Promise<{ page: number; limit: number; total_records: number; total_pages: number; employees: EmployeeSummary[] }> {
    const res = await fetch(`${API_BASE}/workforce-analytics/employees?${buildQuery(filters, options)}`);
    if (!res.ok) throw new Error('Failed to fetch employee list');
    return res.json();
  },

  async getEmployeeDetail(empId: string): Promise<EmployeeDetail> {
    const res = await fetch(`${API_BASE}/employee/${empId}`);
    if (!res.ok) throw new Error(`Failed to fetch detail for ${empId}`);
    return res.json();
  },

  async getRootCauseInvestigations(filters: FilterCriteria): Promise<StatisticalTest[]> {
    const res = await fetch(`${API_BASE}/root-cause/investigations?${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to fetch root-cause investigations');
    return res.json();
  },

  async trainModel(params: { algorithm: string; test_size: number; threshold: number }): Promise<{ status: string; evaluation: ModelEvaluation }> {
    const q = new URLSearchParams({
      algorithm: params.algorithm,
      test_size: String(params.test_size),
      threshold: String(params.threshold)
    });
    const res = await fetch(`${API_BASE}/model/train?${q.toString()}`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Model training failed' }));
      throw new Error(err.detail || 'Failed to train model');
    }
    return res.json();
  },

  async getModelEvaluation(): Promise<ModelEvaluation> {
    const res = await fetch(`${API_BASE}/model/evaluation`);
    if (!res.ok) throw new Error('Failed to fetch model evaluation');
    return res.json();
  },

  async getRecommendations(): Promise<RecommendationItem[]> {
    const res = await fetch(`${API_BASE}/recommendations`);
    if (!res.ok) throw new Error('Failed to fetch retention recommendations');
    return res.json();
  },

  async getInterventions(): Promise<InterventionRecord[]> {
    const res = await fetch(`${API_BASE}/interventions`);
    if (!res.ok) throw new Error('Failed to fetch interventions');
    return res.json();
  },

  async createIntervention(intervention: Partial<InterventionRecord>): Promise<any> {
    const res = await fetch(`${API_BASE}/interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intervention),
    });
    if (!res.ok) throw new Error('Failed to create intervention');
    return res.json();
  },

  async updateIntervention(id: string, updated: Partial<InterventionRecord>): Promise<any> {
    const res = await fetch(`${API_BASE}/interventions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error('Failed to update intervention');
    return res.json();
  },

  async getFinancialConfig(): Promise<FinancialConfig> {
    const res = await fetch(`${API_BASE}/financial/config`);
    if (!res.ok) throw new Error('Failed to fetch financial config');
    return res.json();
  },

  async updateFinancialConfig(config: FinancialConfig): Promise<any> {
    const res = await fetch(`${API_BASE}/financial/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update financial config');
    return res.json();
  },

  async getHistoricalCost(filters: FilterCriteria): Promise<HistoricalTurnoverCost> {
    const res = await fetch(`${API_BASE}/financial/historical-cost?${buildQuery(filters)}`);
    if (!res.ok) throw new Error('Failed to fetch historical cost');
    return res.json();
  },

  async simulateScenario(scenario: any): Promise<ScenarioResult> {
    const res = await fetch(`${API_BASE}/financial/simulate-scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario),
    });
    if (!res.ok) throw new Error('Failed to simulate scenario');
    return res.json();
  },

  async askAnalyst(question: string, filters: FilterCriteria, history: any[] = []): Promise<any> {
    const res = await fetch(`${API_BASE}/analyst/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, filters, history }),
    });
    if (!res.ok) throw new Error('Analyst query failed');
    return res.json();
  },

  async getAuditLog(): Promise<AuditLogEntry[]> {
    const res = await fetch(`${API_BASE}/audit-log`);
    if (!res.ok) throw new Error('Failed to fetch audit log');
    return res.json();
  }
};
