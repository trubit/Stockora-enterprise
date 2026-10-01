import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext.tsx';
import { setAppNavigator } from './utils/navigation.ts';
import Layout from './components/Layout.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';
import { socket } from './socket.ts';
import PWAInstallBanner from './components/PWAInstallBanner.tsx';
import { ProtectedRoute } from './routes/ProtectedRoute.tsx';

// --- Lazy-Loaded Route Components for Optimal Initial Bundle Size & Fast First Paint ---
const LandingPage = lazy(() => import('./pages/LandingPage.tsx'));
const SignIn = lazy(() => import('./pages/auth/SignIn.tsx'));
const SignOut = lazy(() => import('./pages/auth/SignOut.tsx'));
const SignUp = lazy(() => import('./pages/auth/SignUp.tsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.tsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.tsx'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail.tsx'));
const AcceptInvitation = lazy(() => import('./pages/auth/AcceptInvitation.tsx'));
const AccessDenied = lazy(() => import('./pages/auth/AccessDenied.tsx'));
const SessionExpired = lazy(() => import('./pages/auth/SessionExpired.tsx'));
const Profile = lazy(() => import('./pages/auth/Profile.tsx'));

const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const POS = lazy(() => import('./pages/POS.tsx'));
const Inventory = lazy(() => import('./pages/Inventory.tsx'));

const CompanySettings = lazy(() => import('./pages/admin/CompanySettings.tsx'));
const CompanySettingsPage = lazy(() =>
  import('./pages/tenant/CompanySettingsPage.tsx').then((m) => ({ default: m.CompanySettingsPage }))
);
const RegionalSettingsConsole = lazy(() =>
  import('./pages/tenant/RegionalSettingsConsole.tsx').then((m) => ({
    default: m.RegionalSettingsConsole,
  }))
);
const TenantOnboardingWizard = lazy(() =>
  import('./pages/tenant/TenantOnboardingWizard.tsx').then((m) => ({
    default: m.TenantOnboardingWizard,
  }))
);
const PlatformAdminDashboard = lazy(() =>
  import('./pages/admin/PlatformAdminDashboard.tsx').then((m) => ({
    default: m.PlatformAdminDashboard,
  }))
);

const PricingPage = lazy(() => import('./pages/billing/PricingPage.tsx'));
const BillingDashboard = lazy(() => import('./pages/billing/BillingDashboard.tsx'));
const UsageDashboard = lazy(() => import('./pages/billing/UsageDashboard.tsx'));
const PlatformBillingAdmin = lazy(() => import('./pages/admin/PlatformBillingAdmin.tsx'));

const IntegrationHub = lazy(() => import('./pages/integrations/IntegrationHub.tsx'));
const ApiKeyManager = lazy(() => import('./pages/integrations/ApiKeyManager.tsx'));
const WebhookManager = lazy(() => import('./pages/integrations/WebhookManager.tsx'));
const DataImportWizard = lazy(() => import('./pages/integrations/DataImportWizard.tsx'));
const DataExportCenter = lazy(() => import('./pages/integrations/DataExportCenter.tsx'));

const BranchList = lazy(() => import('./pages/admin/BranchList.tsx'));
const MasterDataList = lazy(() => import('./pages/admin/MasterDataList.tsx'));
const ProductCatalog = lazy(() => import('./pages/admin/ProductCatalog.tsx'));
const Suppliers = lazy(() => import('./pages/admin/Suppliers.tsx'));
const Customers = lazy(() => import('./pages/admin/Customers.tsx'));
const StockAdjustments = lazy(() => import('./pages/admin/StockAdjustments.tsx'));
const WarehouseTransfers = lazy(() => import('./pages/admin/WarehouseTransfers.tsx'));
const PurchaseOrders = lazy(() => import('./pages/admin/PurchaseOrders.tsx'));
const ReceivingLogistics = lazy(() => import('./pages/admin/ReceivingLogistics.tsx'));
const SalesBackOffice = lazy(() => import('./pages/admin/SalesBackOffice.tsx'));
const ReturnsLogistics = lazy(() => import('./pages/admin/ReturnsLogistics.tsx'));
const MarketingManager = lazy(() => import('./pages/admin/MarketingManager.tsx'));
const CommunicationCenter = lazy(() => import('./pages/admin/CommunicationCenter.tsx'));
const SchedulerMonitor = lazy(() => import('./pages/admin/SchedulerMonitor.tsx'));
const AdminConsole = lazy(() => import('./pages/admin/AdminConsole.tsx'));
const FinancialReports = lazy(() => import('./pages/admin/FinancialReports.tsx'));
const OfflineSyncMonitor = lazy(() => import('./pages/admin/OfflineSyncMonitor.tsx'));
const CurrencySettings = lazy(() => import('./pages/admin/CurrencySettings.tsx'));
const HardwareControl = lazy(() => import('./pages/admin/HardwareControl.tsx'));
const IntegrationManager = lazy(() => import('./pages/admin/IntegrationManager.tsx'));
const WarehouseVisualizer = lazy(() => import('./pages/admin/WarehouseVisualizer.tsx'));
const ExecutiveDashboard = lazy(() => import('./pages/admin/ExecutiveDashboard.tsx'));
const ReportBuilder = lazy(() => import('./pages/admin/ReportBuilder.tsx'));
const SavedReports = lazy(() => import('./pages/admin/SavedReports.tsx'));
const ScheduledReports = lazy(() => import('./pages/admin/ScheduledReports.tsx'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard.tsx'));
const ExportCenter = lazy(() => import('./pages/admin/ExportCenter.tsx'));
const WorkflowDesigner = lazy(() => import('./pages/admin/WorkflowDesigner.tsx'));
const WorkflowHistory = lazy(() => import('./pages/admin/WorkflowHistory.tsx'));
const ApprovalConsole = lazy(() => import('./pages/admin/ApprovalConsole.tsx'));
const OperationsCenter = lazy(() => import('./pages/admin/OperationsCenter.tsx'));
const AuditExplorer = lazy(() => import('./pages/admin/AuditExplorer.tsx'));
const AICopilot = lazy(() => import('./pages/admin/AICopilot.tsx'));
const AICopilotAdmin = lazy(() => import('./pages/admin/AICopilotAdmin.tsx'));

const AIIntelligenceConsole = lazy(() => import('./pages/analytics/AIIntelligenceConsole.tsx'));
const InventoryIntelligenceDashboard = lazy(
  () => import('./pages/inventory/InventoryIntelligenceDashboard.tsx')
);
const DemandForecasting = lazy(() => import('./pages/inventory/DemandForecasting.tsx'));
const ReorderRecommendations = lazy(() => import('./pages/inventory/ReorderRecommendations.tsx'));
const SupplierIntelligence = lazy(() => import('./pages/inventory/SupplierIntelligence.tsx'));
const StockOptimization = lazy(() => import('./pages/inventory/StockOptimization.tsx'));

const CRMDashboard = lazy(() => import('./pages/crm/CRMDashboard.tsx'));
const Customer360 = lazy(() => import('./pages/crm/Customer360.tsx'));
const CustomerSegments = lazy(() => import('./pages/crm/CustomerSegments.tsx'));
const CampaignManager = lazy(() => import('./pages/crm/CampaignManager.tsx'));
const LoyaltyDashboard = lazy(() => import('./pages/crm/LoyaltyDashboard.tsx'));
const CouponsPromotions = lazy(() => import('./pages/crm/CouponsPromotions.tsx'));
const CustomerRetention = lazy(() => import('./pages/crm/CustomerRetention.tsx'));
const CustomerJourneys = lazy(() => import('./pages/crm/CustomerJourneys.tsx'));

const POSTerminal = lazy(() => import('./pages/pos/POSTerminal.tsx'));
const RegisterSessionManager = lazy(() => import('./pages/pos/RegisterSessionManager.tsx'));
const POSTerminalConsole = lazy(() => import('./pages/pos/POSTerminalConsole.tsx'));
const RegisterSessionConsole = lazy(() => import('./pages/pos/RegisterSessionConsole.tsx'));
const HeldSalesConsole = lazy(() => import('./pages/pos/HeldSalesConsole.tsx'));

const OmnichannelOrderManagement = lazy(
  () => import('./pages/orders/OmnichannelOrderManagement.tsx')
);
const OrderFulfillmentManager = lazy(() => import('./pages/orders/OrderFulfillmentManager.tsx'));
const ReturnsRefundsManager = lazy(() => import('./pages/orders/ReturnsRefundsManager.tsx'));

const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard.tsx'));
const ChartOfAccountsManager = lazy(() => import('./pages/finance/ChartOfAccountsManager.tsx'));
const JournalEntryConsole = lazy(() => import('./pages/finance/JournalEntryConsole.tsx'));
const GeneralLedgerView = lazy(() => import('./pages/finance/GeneralLedgerView.tsx'));
const FinancialStatementsView = lazy(() => import('./pages/finance/FinancialStatementsView.tsx'));
const ExpenseManager = lazy(() => import('./pages/finance/ExpenseManager.tsx'));
const ARAPManagement = lazy(() => import('./pages/finance/ARAPManagement.tsx'));
const BankReconciliationConsole = lazy(
  () => import('./pages/finance/BankReconciliationConsole.tsx')
);
const TaxManagementConsole = lazy(() => import('./pages/finance/TaxManagementConsole.tsx'));
const FiscalPeriodManager = lazy(() => import('./pages/finance/FiscalPeriodManager.tsx'));
const BudgetingConsole = lazy(() => import('./pages/finance/BudgetingConsole.tsx'));

const ProcurementDashboard = lazy(() => import('./pages/procurement/ProcurementDashboard.tsx'));
const SupplierManager = lazy(() => import('./pages/procurement/SupplierManager.tsx'));
const SupplierProfileManager = lazy(() => import('./pages/procurement/SupplierProfileManager.tsx'));
const PurchaseRequestWorkflowConsole = lazy(
  () => import('./pages/procurement/PurchaseRequestWorkflowConsole.tsx')
);
const PurchaseOrderVersionConsole = lazy(
  () => import('./pages/procurement/PurchaseOrderVersionConsole.tsx')
);
const GoodsReceivingConsole = lazy(() => import('./pages/procurement/GoodsReceivingConsole.tsx'));
const SupplierReturnsManager = lazy(() => import('./pages/procurement/SupplierReturnsManager.tsx'));
const ThreeWayMatchingConsole = lazy(
  () => import('./pages/procurement/ThreeWayMatchingConsole.tsx')
);
const ProcurementAnalyticsDashboard = lazy(
  () => import('./pages/procurement/ProcurementAnalyticsDashboard.tsx')
);
const SupplierProductManager = lazy(() => import('./pages/procurement/SupplierProductManager.tsx'));
const QualityInspectionConsole = lazy(
  () => import('./pages/procurement/QualityInspectionConsole.tsx')
);
const AutomatedReplenishmentConsole = lazy(
  () => import('./pages/procurement/AutomatedReplenishmentConsole.tsx')
);
const SupplierComparisonConsole = lazy(
  () => import('./pages/procurement/SupplierComparisonConsole.tsx')
);
const LandedCostConsole = lazy(() => import('./pages/procurement/LandedCostConsole.tsx'));
const ProcurementBudgetManager = lazy(
  () => import('./pages/procurement/ProcurementBudgetManager.tsx')
);
const ProcurementSettings = lazy(() => import('./pages/procurement/ProcurementSettings.tsx'));

const WarehouseDashboard = lazy(() => import('./pages/warehouse/WarehouseDashboard.tsx'));
const WarehouseManager = lazy(() => import('./pages/warehouse/WarehouseManager.tsx'));
const WarehouseLocationManager = lazy(
  () => import('./pages/warehouse/WarehouseLocationManager.tsx')
);
const StockTransferConsole = lazy(() => import('./pages/warehouse/StockTransferConsole.tsx'));
const PutAwayConsole = lazy(() => import('./pages/warehouse/PutAwayConsole.tsx'));
const PickingConsole = lazy(() => import('./pages/warehouse/PickingConsole.tsx'));
const WavePickingConsole = lazy(() => import('./pages/warehouse/WavePickingConsole.tsx'));
const PackingStationConsole = lazy(() => import('./pages/warehouse/PackingStationConsole.tsx'));
const DispatchConsole = lazy(() => import('./pages/warehouse/DispatchConsole.tsx'));
const PackageManifestConsole = lazy(() => import('./pages/warehouse/PackageManifestConsole.tsx'));
const CycleCountConsole = lazy(() => import('./pages/warehouse/CycleCountConsole.tsx'));
const StockCountReconciliationConsole = lazy(
  () => import('./pages/warehouse/StockCountReconciliationConsole.tsx')
);
const InventoryExceptionsManager = lazy(
  () => import('./pages/warehouse/InventoryExceptionsManager.tsx')
);
const WarehouseAnalyticsDashboard = lazy(
  () => import('./pages/warehouse/WarehouseAnalyticsDashboard.tsx')
);
const WarehouseSettings = lazy(() => import('./pages/warehouse/WarehouseSettings.tsx'));

const SalesAnalyticsDashboard = lazy(() => import('./pages/sales/SalesAnalyticsDashboard.tsx'));
const OmnichannelOrderBuilder = lazy(() => import('./pages/sales/OmnichannelOrderBuilder.tsx'));
const SalesQuoteConsole = lazy(() => import('./pages/sales/SalesQuoteConsole.tsx'));
const PriceListManager = lazy(() => import('./pages/sales/PriceListManager.tsx'));
const SalesChannelConsole = lazy(() => import('./pages/sales/SalesChannelConsole.tsx'));
const SalesRepsTerritories = lazy(() => import('./pages/sales/SalesRepsTerritories.tsx'));

const OmnichannelSalesConsole = lazy(() => import('./pages/commerce/OmnichannelSalesConsole.tsx'));
const SalesReturnRefundConsole = lazy(
  () => import('./pages/commerce/SalesReturnRefundConsole.tsx')
);
const CommerceAnalyticsDashboard = lazy(
  () => import('./pages/commerce/CommerceAnalyticsDashboard.tsx')
);

const SalesAnalyticsView = lazy(() => import('./pages/analytics/SalesAnalyticsView.tsx'));
const InventoryAnalyticsView = lazy(() => import('./pages/analytics/InventoryAnalyticsView.tsx'));
const CustomerAnalyticsView = lazy(() => import('./pages/analytics/CustomerAnalyticsView.tsx'));
const SupplierAnalyticsView = lazy(() => import('./pages/analytics/SupplierAnalyticsView.tsx'));
const FinancialAnalyticsView = lazy(() => import('./pages/analytics/FinancialAnalyticsView.tsx'));
const ForecastAnalyticsView = lazy(() => import('./pages/analytics/ForecastAnalyticsView.tsx'));
const AnomalyIntelligenceView = lazy(() => import('./pages/analytics/AnomalyIntelligenceView.tsx'));
const KPIDashboardView = lazy(() => import('./pages/analytics/KPIDashboardView.tsx'));

function NavigationBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    setAppNavigator(navigate);
  }, [navigate]);
  return null;
}

function PageSuspenseFallback() {
  return (
    <LoadingScreen message="Stockora Enterprise Pro" submessage="Loading workspace module..." />
  );
}

function App() {
  useEffect(() => {
    // Standard WebSocket alerts for enterprise inventory monitoring (SRE/Reliability guidelines)
    socket.on('notification:low-stock', (data: { name: string; quantity: number }) => {
      toast.error(`Low Stock Warning: ${data.name} is down to ${data.quantity} units!`, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#1f2937',
          color: '#f59e0b',
          border: '1px solid #f59e0b',
        },
      });
    });

    socket.on('product:created', (data: { name: string }) => {
      toast.success(`New product catalog addition: "${data.name}"`, {
        position: 'bottom-right',
      });
    });

    return () => {
      socket.off('connect');
      socket.off('notification:low-stock');
      socket.off('product:created');
    };
  }, []);

  return (
    <BrowserRouter>
      <NavigationBridge />
      {/* Toast Notification Provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#f3f4f6',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            padding: '12px 16px',
            maxWidth: '420px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#111827',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#111827',
            },
          },
        }}
      />
      <ConfirmDialogProvider>
        <PWAInstallBanner />
        <Suspense fallback={<PageSuspenseFallback />}>
          <Routes>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<SignIn />} />
            <Route path="/signout" element={<SignOut />} />
            <Route path="/logout" element={<SignOut />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/invitations/accept/:token" element={<AcceptInvitation />} />
            <Route path="/invitations/accept" element={<AcceptInvitation />} />
            <Route path="/session-expired" element={<SessionExpired />} />
            <Route path="/access-denied" element={<AccessDenied />} />

            <Route path="/" element={<Layout />}>
              {/* Publicly accessible to all authenticated users */}
              <Route element={<ProtectedRoute />}>
                <Route index element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="ai/intelligence" element={<AIIntelligenceConsole />} />
                <Route path="ai" element={<AIIntelligenceConsole />} />
                <Route path="copilot/chat" element={<AICopilot />} />
                <Route path="offline-sync" element={<OfflineSyncMonitor />} />
              </Route>

              {/* POS Terminal & Register Manager */}
              <Route element={<ProtectedRoute requiredPermission="transactions:write" />}>
                <Route path="pos" element={<POS />} />
                <Route path="pos/terminal" element={<POSTerminal />} />
                <Route path="pos/register" element={<RegisterSessionManager />} />
              </Route>

              {/* Products & Inventory Catalog */}
              <Route element={<ProtectedRoute requiredPermission="products:read" />}>
                <Route path="products" element={<ProductCatalog />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="inventory/intelligence" element={<InventoryIntelligenceDashboard />} />
                <Route path="inventory/forecasting" element={<DemandForecasting />} />
                <Route path="inventory/reorder" element={<ReorderRecommendations />} />
                <Route path="inventory/suppliers" element={<SupplierIntelligence />} />
                <Route path="inventory/optimization" element={<StockOptimization />} />
                <Route path="transfers" element={<WarehouseTransfers />} />
                <Route path="receiving" element={<ReceivingLogistics />} />
              </Route>

              {/* Stock Adjustments */}
              <Route element={<ProtectedRoute requiredPermission="products:write" />}>
                <Route path="adjustments" element={<StockAdjustments />} />
              </Route>

              {/* Suppliers Directory */}
              <Route element={<ProtectedRoute requiredPermission="suppliers:read" />}>
                <Route path="purchase-orders" element={<PurchaseOrders />} />
                <Route path="suppliers" element={<Suppliers />} />
              </Route>

              {/* Customers Directory & Enterprise CRM */}
              <Route element={<ProtectedRoute requiredPermission="customers:read" />}>
                <Route path="customers" element={<Customers />} />
                <Route path="crm" element={<CRMDashboard />} />
                <Route path="crm/dashboard" element={<CRMDashboard />} />
                <Route path="crm/customer360" element={<Customer360 />} />
                <Route path="crm/customers/:id" element={<Customer360 />} />
                <Route path="crm/segments" element={<CustomerSegments />} />
                <Route path="crm/campaigns" element={<CampaignManager />} />
                <Route path="crm/loyalty" element={<LoyaltyDashboard />} />
                <Route path="crm/coupons" element={<CouponsPromotions />} />
                <Route path="crm/retention" element={<CustomerRetention />} />
                <Route path="crm/journeys" element={<CustomerJourneys />} />
              </Route>

              {/* Sales & Omnichannel Order Management */}
              <Route element={<ProtectedRoute requiredPermission="transactions:read" />}>
                <Route path="sales" element={<SalesBackOffice />} />
                <Route path="orders/omnichannel" element={<OmnichannelOrderManagement />} />
                <Route path="orders/fulfillment" element={<OrderFulfillmentManager />} />
                <Route path="orders/returns" element={<ReturnsRefundsManager />} />
              </Route>

              {/* Sales Returns */}
              <Route element={<ProtectedRoute requiredPermission="returns:read" />}>
                <Route path="returns" element={<ReturnsLogistics />} />
              </Route>

              {/* Marketing & Loyalty Campaigns */}
              <Route element={<ProtectedRoute requiredPermission="promotions:read" />}>
                <Route path="marketing" element={<MarketingManager />} />
                <Route path="crm/campaigns" element={<CampaignManager />} />
                <Route path="crm/coupons" element={<CouponsPromotions />} />
              </Route>

              {/* Communication Center */}
              <Route element={<ProtectedRoute requiredPermission="notifications:read" />}>
                <Route path="communication" element={<CommunicationCenter />} />
              </Route>

              {/* Finance & Currency Settings */}
              <Route element={<ProtectedRoute requiredPermission="finance:read" />}>
                <Route path="finance" element={<FinancialReports />} />
                <Route path="finance/dashboard" element={<FinanceDashboard />} />
                <Route path="finance/accounts" element={<ChartOfAccountsManager />} />
                <Route path="finance/journals" element={<JournalEntryConsole />} />
                <Route path="finance/ledger" element={<GeneralLedgerView />} />
                <Route path="finance/statements" element={<FinancialStatementsView />} />
                <Route path="finance/expenses" element={<ExpenseManager />} />
                <Route path="finance/ar-ap" element={<ARAPManagement />} />
                <Route path="finance/banking" element={<BankReconciliationConsole />} />
                <Route path="finance/tax" element={<TaxManagementConsole />} />
                <Route path="finance/periods" element={<FiscalPeriodManager />} />
                <Route path="finance/budgets" element={<BudgetingConsole />} />
                <Route path="currency" element={<CurrencySettings />} />
              </Route>

              {/* Executive & Analytics Reporting */}
              <Route element={<ProtectedRoute requiredPermission="reports:read" />}>
                <Route path="reports/executive" element={<ExecutiveDashboard />} />
                <Route path="company/analytics/executive" element={<ExecutiveDashboard />} />
                <Route path="company/analytics/sales" element={<SalesAnalyticsView />} />
                <Route path="company/analytics/inventory" element={<InventoryAnalyticsView />} />
                <Route path="company/analytics/customers" element={<CustomerAnalyticsView />} />
                <Route path="company/analytics/suppliers" element={<SupplierAnalyticsView />} />
                <Route path="company/analytics/finance" element={<FinancialAnalyticsView />} />
                <Route path="company/analytics/forecast" element={<ForecastAnalyticsView />} />
                <Route path="company/analytics/anomalies" element={<AnomalyIntelligenceView />} />
                <Route path="company/analytics/kpis" element={<KPIDashboardView />} />
                <Route path="reports/builder" element={<ReportBuilder />} />
                <Route path="reports/saved" element={<SavedReports />} />
                <Route path="reports/scheduled" element={<ScheduledReports />} />
                <Route path="reports/kpis" element={<KPIDashboardView />} />
                <Route path="reports/analytics" element={<AnalyticsDashboard />} />
                <Route path="reports/exports" element={<ExportCenter />} />
              </Route>

              {/* AI Copilot Admin Settings */}
              <Route element={<ProtectedRoute requiredPermission="security:write" />}>
                <Route path="copilot/settings" element={<AICopilotAdmin />} />
              </Route>

              {/* Workflow Designer */}
              <Route element={<ProtectedRoute requiredPermission="workflows:write" />}>
                <Route path="workflows/designer" element={<WorkflowDesigner />} />
              </Route>

              {/* Workflow History & Approvals */}
              <Route element={<ProtectedRoute requiredPermission="workflows:read" />}>
                <Route path="workflows/history" element={<WorkflowHistory />} />
                <Route path="workflows/approvals" element={<ApprovalConsole />} />
              </Route>

              {/* Operations & Hardware Administration */}
              <Route element={<ProtectedRoute requiredPermission="security:read" />}>
                <Route path="observability/operations" element={<OperationsCenter />} />
                <Route path="hardware" element={<HardwareControl />} />
                <Route path="integrations" element={<IntegrationManager />} />
              </Route>

              {/* Audit Logs */}
              <Route element={<ProtectedRoute requiredPermission="audit:read" />}>
                <Route path="observability/audit" element={<AuditExplorer />} />
              </Route>

              {/* Tenant Company Profiles & Multi-Tenant SaaS Management */}
              <Route element={<ProtectedRoute requiredPermission="companies:read" />}>
                <Route path="company" element={<CompanySettings />} />
                <Route path="company/settings" element={<CompanySettingsPage />} />
                <Route path="company/settings/regional" element={<RegionalSettingsConsole />} />
                <Route path="settings/regional" element={<RegionalSettingsConsole />} />
                <Route path="onboarding" element={<TenantOnboardingWizard />} />
              </Route>

              {/* Platform Super Administrator Console */}
              <Route element={<ProtectedRoute requirePlatformAdmin={true} />}>
                <Route path="admin/platform" element={<PlatformAdminDashboard />} />
                <Route path="console" element={<AdminConsole />} />
              </Route>

              {/* Branches List */}
              <Route element={<ProtectedRoute requiredPermission="branches:read" />}>
                <Route path="branches" element={<BranchList />} />
              </Route>

              {/* Warehouse Visualizer */}
              <Route element={<ProtectedRoute requiredPermission="warehouses:read" />}>
                <Route path="warehouse-visualizer" element={<WarehouseVisualizer />} />
              </Route>

              {/* Master Data */}
              <Route element={<ProtectedRoute requiredPermission="master_data:read" />}>
                <Route path="master-data" element={<MasterDataList />} />
              </Route>

              {/* Scheduler Monitor */}
              <Route element={<ProtectedRoute requiredPermission="automation:read" />}>
                <Route path="scheduler" element={<SchedulerMonitor />} />
              </Route>

              {/* Phase 38 — Advanced Procurement, Supplier Management & Automated Replenishment Routes */}
              <Route element={<ProtectedRoute requiredPermission="suppliers:read" />}>
                <Route path="procurement" element={<ProcurementDashboard />} />
                <Route path="procurement/dashboard" element={<ProcurementDashboard />} />
                <Route path="procurement/suppliers" element={<SupplierManager />} />
                <Route path="procurement/suppliers/:id" element={<SupplierProfileManager />} />
                <Route
                  path="procurement/suppliers/:id/profile"
                  element={<SupplierProfileManager />}
                />
                <Route
                  path="procurement/suppliers/:id/products"
                  element={<SupplierProductManager />}
                />
                <Route
                  path="procurement/suppliers/:id/performance"
                  element={<SupplierProfileManager />}
                />
                <Route path="procurement/products" element={<SupplierProductManager />} />
                <Route path="procurement/requests" element={<PurchaseRequestWorkflowConsole />} />
                <Route
                  path="procurement/requests/:id"
                  element={<PurchaseRequestWorkflowConsole />}
                />
                <Route
                  path="procurement/purchase-orders"
                  element={<PurchaseOrderVersionConsole />}
                />
                <Route
                  path="procurement/purchase-orders/:id"
                  element={<PurchaseOrderVersionConsole />}
                />
                <Route
                  path="procurement/replenishment"
                  element={<AutomatedReplenishmentConsole />}
                />
                <Route
                  path="procurement/replenishment/:id"
                  element={<AutomatedReplenishmentConsole />}
                />
                <Route
                  path="procurement/supplier-comparison"
                  element={<SupplierComparisonConsole />}
                />
                <Route path="procurement/landed-cost" element={<LandedCostConsole />} />
                <Route path="procurement/budgets" element={<ProcurementBudgetManager />} />
                <Route path="procurement/receiving" element={<GoodsReceivingConsole />} />
                <Route path="procurement/receiving/:id" element={<GoodsReceivingConsole />} />
                <Route path="procurement/inspections" element={<QualityInspectionConsole />} />
                <Route path="procurement/returns" element={<SupplierReturnsManager />} />
                <Route path="procurement/invoices" element={<ThreeWayMatchingConsole />} />
                <Route path="procurement/exceptions" element={<ThreeWayMatchingConsole />} />
                <Route
                  path="procurement/three-way-matching"
                  element={<ThreeWayMatchingConsole />}
                />
                <Route path="procurement/analytics" element={<ProcurementAnalyticsDashboard />} />
                <Route path="procurement/settings" element={<ProcurementSettings />} />
              </Route>

              {/* Phase 37 — Advanced Warehouse Operations & Logistics Engine Routes */}
              <Route element={<ProtectedRoute requiredPermission="warehouses:read" />}>
                <Route path="warehouse" element={<WarehouseDashboard />} />
                <Route path="warehouse/dashboard" element={<WarehouseDashboard />} />
                <Route path="warehouse/warehouses" element={<WarehouseManager />} />
                <Route path="warehouse/warehouses/:id" element={<WarehouseManager />} />
                <Route path="warehouse/locations" element={<WarehouseLocationManager />} />
                <Route path="warehouse/transfers" element={<StockTransferConsole />} />
                <Route path="warehouse/transfers/:id" element={<StockTransferConsole />} />
                <Route path="warehouse/putaway" element={<PutAwayConsole />} />
                <Route path="warehouse/picking" element={<PickingConsole />} />
                <Route path="warehouse/picking/:id" element={<PickingConsole />} />
                <Route path="warehouse/waves" element={<WavePickingConsole />} />
                <Route path="warehouse/packing" element={<PackingStationConsole />} />
                <Route path="warehouse/packing/:id" element={<PackingStationConsole />} />
                <Route path="warehouse/dispatch" element={<DispatchConsole />} />
                <Route path="warehouse/manifests" element={<PackageManifestConsole />} />
                <Route path="warehouse/cycle-count" element={<CycleCountConsole />} />
                <Route path="warehouse/counting" element={<StockCountReconciliationConsole />} />
                <Route path="warehouse/counts" element={<StockCountReconciliationConsole />} />
                <Route path="warehouse/counts/:id" element={<StockCountReconciliationConsole />} />
                <Route
                  path="warehouse/reconciliation"
                  element={<StockCountReconciliationConsole />}
                />
                <Route path="warehouse/exceptions" element={<InventoryExceptionsManager />} />
                <Route path="warehouse/analytics" element={<WarehouseAnalyticsDashboard />} />
                <Route path="warehouse/settings" element={<WarehouseSettings />} />
              </Route>

              {/* Phase 35 & 39 — Sales & Commerce Routes */}
              <Route element={<ProtectedRoute requiredPermission="transactions:read" />}>
                <Route path="sales" element={<SalesAnalyticsDashboard />} />
                <Route path="sales/analytics" element={<SalesAnalyticsDashboard />} />
                <Route path="sales/builder" element={<OmnichannelOrderBuilder />} />
                <Route path="sales/quotes" element={<SalesQuoteConsole />} />
                <Route path="sales/price-lists" element={<PriceListManager />} />
                <Route path="sales/channels" element={<SalesChannelConsole />} />
                <Route path="sales/territories" element={<SalesRepsTerritories />} />
                <Route path="commerce" element={<CommerceAnalyticsDashboard />} />
                <Route path="commerce/dashboard" element={<CommerceAnalyticsDashboard />} />
                <Route path="commerce/orders" element={<OmnichannelSalesConsole />} />
                <Route path="commerce/returns" element={<SalesReturnRefundConsole />} />
                <Route path="commerce/refunds" element={<SalesReturnRefundConsole />} />
                <Route path="commerce/analytics" element={<CommerceAnalyticsDashboard />} />
              </Route>

              {/* Phase 39 — Advanced POS Routes */}
              <Route element={<ProtectedRoute requiredPermission="transactions:write" />}>
                <Route path="pos/console" element={<POSTerminalConsole />} />
                <Route path="pos/register-console" element={<RegisterSessionConsole />} />
                <Route path="pos/held-sales" element={<HeldSalesConsole />} />
              </Route>

              {/* Phase 41 — Advanced Financial Management, Accounting & Cashflow Routes */}
              <Route element={<ProtectedRoute requiredPermission="finance:read" />}>
                <Route path="finance" element={<FinanceDashboard />} />
                <Route path="finance/dashboard" element={<FinanceDashboard />} />
                <Route path="finance/accounts" element={<ChartOfAccountsManager />} />
                <Route path="finance/journals" element={<JournalEntryConsole />} />
                <Route path="finance/ledger" element={<GeneralLedgerView />} />
                <Route path="finance/statements" element={<FinancialStatementsView />} />
                <Route path="finance/reports" element={<FinancialStatementsView />} />
                <Route path="finance/expenses" element={<ExpenseManager />} />
                <Route path="finance/ar-ap" element={<ARAPManagement />} />
                <Route path="finance/receivables" element={<ARAPManagement />} />
                <Route path="finance/payables" element={<ARAPManagement />} />
                <Route path="finance/banking" element={<BankReconciliationConsole />} />
                <Route path="finance/reconciliation" element={<BankReconciliationConsole />} />
                <Route path="finance/tax" element={<TaxManagementConsole />} />
                <Route path="finance/periods" element={<FiscalPeriodManager />} />
              </Route>

              {/* Phase 44 — Subscription Plans, Usage Limits & SaaS Billing */}
              <Route element={<ProtectedRoute requiredPermission="companies:read" />}>
                <Route path="pricing" element={<PricingPage />} />
                <Route path="company/billing" element={<BillingDashboard />} />
                <Route path="company/usage" element={<UsageDashboard />} />
              </Route>
              <Route element={<ProtectedRoute requirePlatformAdmin={true} />}>
                <Route path="admin/billing" element={<PlatformBillingAdmin />} />
              </Route>

              {/* Phase 45 — Enterprise Integrations, External APIs, Webhooks, Import & Export */}
              <Route element={<ProtectedRoute requiredPermission="security:read" />}>
                <Route path="company/integrations" element={<IntegrationHub />} />
                <Route path="company/developer/api-keys" element={<ApiKeyManager />} />
                <Route path="company/developer/webhooks" element={<WebhookManager />} />
                <Route path="company/import" element={<DataImportWizard />} />
                <Route path="company/export" element={<DataExportCenter />} />
                <Route path="integrations/hub" element={<IntegrationHub />} />
                <Route path="developer/api-keys" element={<ApiKeyManager />} />
                <Route path="developer/webhooks" element={<WebhookManager />} />
                <Route path="data/import" element={<DataImportWizard />} />
                <Route path="data/export" element={<DataExportCenter />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ConfirmDialogProvider>
    </BrowserRouter>
  );
}

export default App;
