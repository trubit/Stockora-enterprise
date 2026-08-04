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

          {/* POS Terminal */}
          <Route element={<ProtectedRoute requiredPermission="transactions:write" />}>
            <Route path="pos" element={<POS />} />
          </Route>

          {/* Products & Inventory Catalog */}
          <Route element={<ProtectedRoute requiredPermission="products:read" />}>
            <Route path="products" element={<ProductCatalog />} />
            <Route path="inventory" element={<Inventory />} />
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

          {/* Customers Directory */}
          <Route element={<ProtectedRoute requiredPermission="customers:read" />}>
            <Route path="customers" element={<Customers />} />
          </Route>

          {/* Sales Back Office */}
          <Route element={<ProtectedRoute requiredPermission="transactions:read" />}>
            <Route path="sales" element={<SalesBackOffice />} />
          </Route>

          {/* Sales Returns */}
          <Route element={<ProtectedRoute requiredPermission="returns:read" />}>
            <Route path="returns" element={<ReturnsLogistics />} />
          </Route>

          {/* Marketing & Loyalty */}
          <Route element={<ProtectedRoute requiredPermission="promotions:read" />}>
            <Route path="marketing" element={<MarketingManager />} />
          </Route>

          {/* Communication Center */}
          <Route element={<ProtectedRoute requiredPermission="notifications:read" />}>
            <Route path="communication" element={<CommunicationCenter />} />
          </Route>

          {/* Finance & Currency Settings */}
          <Route element={<ProtectedRoute requiredPermission="finance:read" />}>
            <Route path="finance" element={<FinancialReports />} />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
