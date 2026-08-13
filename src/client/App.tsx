import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import POS from './pages/POS.tsx';
import Inventory from './pages/Inventory.tsx';
import { socket } from './socket.ts';
import SignIn from './pages/auth/SignIn.tsx';
import SignUp from './pages/auth/SignUp.tsx';
import ForgotPassword from './pages/auth/ForgotPassword.tsx';
import ResetPassword from './pages/auth/ResetPassword.tsx';
import VerifyEmail from './pages/auth/VerifyEmail.tsx';
import AccessDenied from './pages/auth/AccessDenied.tsx';
import SessionExpired from './pages/auth/SessionExpired.tsx';
import Profile from './pages/auth/Profile.tsx';
import CompanySettings from './pages/admin/CompanySettings.tsx';
import BranchList from './pages/admin/BranchList.tsx';
import MasterDataList from './pages/admin/MasterDataList.tsx';
import ProductCatalog from './pages/admin/ProductCatalog.tsx';
import Suppliers from './pages/admin/Suppliers.tsx';
import Customers from './pages/admin/Customers.tsx';
import StockAdjustments from './pages/admin/StockAdjustments.tsx';
import WarehouseTransfers from './pages/admin/WarehouseTransfers.tsx';
import PurchaseOrders from './pages/admin/PurchaseOrders.tsx';
import ReceivingLogistics from './pages/admin/ReceivingLogistics.tsx';
import SalesBackOffice from './pages/admin/SalesBackOffice.tsx';
import ReturnsLogistics from './pages/admin/ReturnsLogistics.tsx';
import MarketingManager from './pages/admin/MarketingManager.tsx';
import CommunicationCenter from './pages/admin/CommunicationCenter.tsx';
import SchedulerMonitor from './pages/admin/SchedulerMonitor.tsx';
import AdminConsole from './pages/admin/AdminConsole.tsx';
import FinancialReports from './pages/admin/FinancialReports.tsx';
import OfflineSyncMonitor from './pages/admin/OfflineSyncMonitor.tsx';
import CurrencySettings from './pages/admin/CurrencySettings.tsx';
import HardwareControl from './pages/admin/HardwareControl.tsx';
import IntegrationManager from './pages/admin/IntegrationManager.tsx';
import WarehouseVisualizer from './pages/admin/WarehouseVisualizer.tsx';
import ExecutiveDashboard from './pages/admin/ExecutiveDashboard.tsx';
import ReportBuilder from './pages/admin/ReportBuilder.tsx';
import SavedReports from './pages/admin/SavedReports.tsx';
import ScheduledReports from './pages/admin/ScheduledReports.tsx';
import KPIManagement from './pages/admin/KPIManagement.tsx';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard.tsx';
import ExportCenter from './pages/admin/ExportCenter.tsx';
import WorkflowDesigner from './pages/admin/WorkflowDesigner.tsx';
import WorkflowHistory from './pages/admin/WorkflowHistory.tsx';
import ApprovalConsole from './pages/admin/ApprovalConsole.tsx';
import OperationsCenter from './pages/admin/OperationsCenter.tsx';
import AuditExplorer from './pages/admin/AuditExplorer.tsx';
import AICopilot from './pages/admin/AICopilot.tsx';
import AICopilotAdmin from './pages/admin/AICopilotAdmin.tsx';
import InventoryIntelligenceDashboard from './pages/inventory/InventoryIntelligenceDashboard.tsx';
import DemandForecasting from './pages/inventory/DemandForecasting.tsx';
import ReorderRecommendations from './pages/inventory/ReorderRecommendations.tsx';
import SupplierIntelligence from './pages/inventory/SupplierIntelligence.tsx';
import StockOptimization from './pages/inventory/StockOptimization.tsx';
import CRMDashboard from './pages/crm/CRMDashboard.tsx';
import Customer360 from './pages/crm/Customer360.tsx';
import CustomerSegments from './pages/crm/CustomerSegments.tsx';
import CampaignManager from './pages/crm/CampaignManager.tsx';
import LoyaltyDashboard from './pages/crm/LoyaltyDashboard.tsx';
import CouponsPromotions from './pages/crm/CouponsPromotions.tsx';
import POSTerminal from './pages/pos/POSTerminal.tsx';
import RegisterSessionManager from './pages/pos/RegisterSessionManager.tsx';
import OmnichannelOrderManagement from './pages/orders/OmnichannelOrderManagement.tsx';
import OrderFulfillmentManager from './pages/orders/OrderFulfillmentManager.tsx';
import ReturnsRefundsManager from './pages/orders/ReturnsRefundsManager.tsx';
import FinanceDashboard from './pages/finance/FinanceDashboard.tsx';
import ChartOfAccountsManager from './pages/finance/ChartOfAccountsManager.tsx';
import JournalEntryConsole from './pages/finance/JournalEntryConsole.tsx';
import GeneralLedgerView from './pages/finance/GeneralLedgerView.tsx';
import FinancialStatementsView from './pages/finance/FinancialStatementsView.tsx';
import ExpenseManager from './pages/finance/ExpenseManager.tsx';
import ARAPManagement from './pages/finance/ARAPManagement.tsx';
import BankReconciliationConsole from './pages/finance/BankReconciliationConsole.tsx';
import TaxManagementConsole from './pages/finance/TaxManagementConsole.tsx';
import FiscalPeriodManager from './pages/finance/FiscalPeriodManager.tsx';
import BudgetingConsole from './pages/finance/BudgetingConsole.tsx';
import ProcurementDashboard from './pages/procurement/ProcurementDashboard.tsx';
import SupplierManager from './pages/procurement/SupplierManager.tsx';
import PurchaseRequestConsole from './pages/procurement/PurchaseRequestConsole.tsx';
import PurchaseOrderConsole from './pages/procurement/PurchaseOrderConsole.tsx';
import GoodsReceivingConsole from './pages/procurement/GoodsReceivingConsole.tsx';
import SupplierReturnsManager from './pages/procurement/SupplierReturnsManager.tsx';
import ThreeWayMatchingConsole from './pages/procurement/ThreeWayMatchingConsole.tsx';
import ProcurementAnalyticsDashboard from './pages/procurement/ProcurementAnalyticsDashboard.tsx';
import LandingPage from './pages/LandingPage.tsx';
import { ProtectedRoute } from './routes/ProtectedRoute.tsx';

function App() {
  useEffect(() => {
    // Standard WebSocket alerts for enterprise inventory monitoring (SRE/Reliability guidelines)
    socket.on('connect', () => {
      console.log('Real-time updates socket connected');
    });

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
      {/* Toast Notification Provider */}
      <Toaster
        toastOptions={{
          style: {
            background: '#111827',
            color: '#f3f4f6',
            border: '1px solid rgba(255,255,255,0.05)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#111827',
            },
          },
        }}
      />
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        <Route path="/" element={<Layout />}>
          {/* Publicly accessible to all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
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
            <Route path="crm/dashboard" element={<CRMDashboard />} />
            <Route path="crm/customer360" element={<Customer360 />} />
            <Route path="crm/segments" element={<CustomerSegments />} />
            <Route path="crm/loyalty" element={<LoyaltyDashboard />} />
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
            <Route path="reports/builder" element={<ReportBuilder />} />
            <Route path="reports/saved" element={<SavedReports />} />
            <Route path="reports/scheduled" element={<ScheduledReports />} />
            <Route path="reports/kpis" element={<KPIManagement />} />
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
            <Route path="console" element={<AdminConsole />} />
          </Route>

          {/* Audit Logs */}
          <Route element={<ProtectedRoute requiredPermission="audit:read" />}>
            <Route path="observability/audit" element={<AuditExplorer />} />
          </Route>

          {/* Tenant Company Profiles */}
          <Route element={<ProtectedRoute requiredPermission="companies:read" />}>
            <Route path="company" element={<CompanySettings />} />
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

          {/* Phase 33 — Procurement & Supply Chain Routes */}
          <Route path="procurement" element={<ProcurementDashboard />} />
          <Route path="procurement/suppliers" element={<SupplierManager />} />
          <Route path="procurement/requests" element={<PurchaseRequestConsole />} />
          <Route path="procurement/purchase-orders" element={<PurchaseOrderConsole />} />
          <Route path="procurement/receiving" element={<GoodsReceivingConsole />} />
          <Route path="procurement/returns" element={<SupplierReturnsManager />} />
          <Route path="procurement/three-way-matching" element={<ThreeWayMatchingConsole />} />
          <Route path="procurement/analytics" element={<ProcurementAnalyticsDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
