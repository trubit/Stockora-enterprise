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
        <Route path="/login" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        <Route path="/" element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="company" element={<CompanySettings />} />
            <Route path="branches" element={<BranchList />} />
            <Route path="master-data" element={<MasterDataList />} />
            <Route path="products" element={<ProductCatalog />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="adjustments" element={<StockAdjustments />} />
            <Route path="transfers" element={<WarehouseTransfers />} />
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="receiving" element={<ReceivingLogistics />} />
            <Route path="sales" element={<SalesBackOffice />} />
            <Route path="returns" element={<ReturnsLogistics />} />
            <Route path="marketing" element={<MarketingManager />} />
            <Route path="communication" element={<CommunicationCenter />} />
            <Route path="scheduler" element={<SchedulerMonitor />} />
            <Route path="offline-sync" element={<OfflineSyncMonitor />} />
            <Route path="console" element={<AdminConsole />} />
            <Route path="finance" element={<FinancialReports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
