import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  HelpCircle,
  Brain,
  Lightbulb,
  DollarSign,
  ClipboardList,
  MessageSquare
} from 'lucide-react';

import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { AuditLogModal } from './components/AuditLogModal';
import { CostConfigModal } from './components/CostConfigModal';
import { UploadModal } from './components/UploadModal';

import { OverviewPage } from './pages/OverviewPage';
import { DataWorkspacePage } from './pages/DataWorkspacePage';
import { WorkforceAnalyticsPage } from './pages/WorkforceAnalyticsPage';
import { RootCausePage } from './pages/RootCausePage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { FinancialScenariosPage } from './pages/FinancialScenariosPage';
import { InterventionsRegisterPage } from './pages/InterventionsRegisterPage';
import { AnalystChatPage } from './pages/AnalystChatPage';

import { api } from './services/api';
import { FilterCriteria, DatasetMeta, EmployeeDetail, InterventionRecord, RecommendationItem } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [userRole, setUserRole] = useState<string>('Executive / HR Leader');
  const [datasetMeta, setDatasetMeta] = useState<DatasetMeta | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Global Analytical Filter Criteria
  const [filters, setFilters] = useState<FilterCriteria>({
    department: 'all',
    location: 'all',
    work_arrangement: 'all',
    tenure_band: 'all',
  });

  // Modal states
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isCostConfigOpen, setIsCostConfigOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Cross-page action state (e.g. recommendation assigned to register)
  const [pendingIntervention, setPendingIntervention] = useState<Partial<InterventionRecord> | null>(null);

  // Data refresh key
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDatasetMeta = () => {
    api.getDatasetMeta()
      .then(res => setDatasetMeta(res.meta))
      .catch(console.error);
  };

  useEffect(() => {
    loadDatasetMeta();
  }, [refreshKey]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await api.regenerateSynthetic();
      setDatasetMeta(res.dataset);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAssignToRegister = (rec: RecommendationItem) => {
    setPendingIntervention({
      title: rec.title,
      target_cohort: rec.target_population,
      intervention_type: rec.catalog_type === 'INT-WORKLOAD' ? 'Workload & Schedule' :
                         rec.catalog_type === 'INT-PARITY' ? 'Compensation & Parity' :
                         rec.catalog_type === 'INT-COACHING' ? 'Manager Leadership' : 'Career Mobility',
      owner: rec.suggested_owner,
      status: 'Planned',
      notes: `Generated from recommendation (${rec.rationale})`
    });
    setActiveTab('interventions');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'data', label: 'Data Workspace', icon: Database },
    { id: 'analytics', label: 'Workforce Analytics', icon: BarChart3 },
    { id: 'root-cause', label: 'Root-Cause Evidence', icon: HelpCircle },
    { id: 'model', label: 'Model Evaluation', icon: Brain },
    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { id: 'financial', label: 'Costs & Scenarios', icon: DollarSign },
    { id: 'interventions', label: 'Intervention Register', icon: ClipboardList },
    { id: 'analyst', label: 'AI Analyst', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        datasetMeta={datasetMeta}
        userRole={userRole}
        setUserRole={setUserRole}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenCostConfig={() => setIsCostConfigOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Global Filter Bar */}
      <FilterBar filters={filters} setFilters={setFilters} />

      {/* Primary Navigation Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewPage key={refreshKey} filters={filters} onNavigateTab={setActiveTab} />
        )}
        {activeTab === 'data' && (
          <DataWorkspacePage
            key={refreshKey}
            onOpenUpload={() => setIsUploadOpen(true)}
            onRegenerate={handleRegenerate}
            isRegenerating={isRegenerating}
          />
        )}
        {activeTab === 'analytics' && (
          <WorkforceAnalyticsPage
            key={refreshKey}
            filters={filters}
            userRole={userRole}
            onSelectEmployee={setSelectedEmployee}
          />
        )}
        {activeTab === 'root-cause' && (
          <RootCausePage key={refreshKey} filters={filters} />
        )}
        {activeTab === 'model' && (
          <ModelEvaluationPage key={refreshKey} />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsPage
            key={refreshKey}
            onAssignToRegister={handleAssignToRegister}
          />
        )}
        {activeTab === 'financial' && (
          <FinancialScenariosPage
            key={refreshKey}
            filters={filters}
            onOpenCostConfig={() => setIsCostConfigOpen(true)}
          />
        )}
        {activeTab === 'interventions' && (
          <InterventionsRegisterPage
            key={refreshKey}
            initialNewIntervention={pendingIntervention}
            onClearInitialNew={() => setPendingIntervention(null)}
          />
        )}
        {activeTab === 'analyst' && (
          <AnalystChatPage key={refreshKey} filters={filters} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RetentionIQ Decision-Support System • Built for Authorized HR & Business Leadership</span>
          <span>Responsible AI Guidelines • Excludes Protected Classes from Automated Decisions</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        userRole={userRole}
      />
      <AuditLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />
      <CostConfigModal
        isOpen={isCostConfigOpen}
        onClose={() => setIsCostConfigOpen(false)}
        onSaved={() => setRefreshKey(prev => prev + 1)}
      />
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportComplete={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}

export default App;
