import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/users/UsersPage';
import RolesPage from './pages/roles/RolesPage';
import CustomerListPage from './pages/customers/CustomerListPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import SampleListPage from './pages/samples/SampleListPage';
import SampleFormPage from './pages/samples/SampleFormPage';
import SampleDetailPage from './pages/samples/SampleDetailPage';
import SpecificationPage from './pages/masters/SpecificationPage';
import TestMasterPage from './pages/masters/TestMasterPage';
import EquipmentPage from './pages/masters/EquipmentPage';
import TestPlanPage from './pages/plans/TestPlanPage';
import WorkshopPage from './pages/workshop/WorkshopPage';
import ResultsPage from './pages/results/ResultsPage';
import ApprovalsPage from './pages/approvals/ApprovalsPage';
import InvoicePage from './pages/invoices/InvoicePage';
import DispatchPage from './pages/dispatch/DispatchPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import { getDefaultRoute } from './utils/permissions';
import { setAccessToken } from './utils/api';

const App = () => {
  const { isAuthenticated, fetchMe, user, accessToken } = useAuth();

  useEffect(() => {
    if (accessToken) {
      setAccessToken(accessToken);
      fetchMe();
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute(user)} replace /> : <LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<ProtectedRoute pageName="dashboard"><DashboardPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute pageName="customers"><CustomerListPage /></ProtectedRoute>} />
        <Route path="/customers/new" element={<ProtectedRoute pageName="customers" action="canAdd"><CustomerFormPage /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute pageName="customers"><CustomerDetailPage /></ProtectedRoute>} />
        <Route path="/customers/:id/edit" element={<ProtectedRoute pageName="customers" action="canEdit"><CustomerFormPage /></ProtectedRoute>} />
        <Route path="/samples" element={<ProtectedRoute pageName="samples"><SampleListPage /></ProtectedRoute>} />
        <Route path="/samples/new" element={<ProtectedRoute pageName="samples" action="canAdd"><SampleFormPage /></ProtectedRoute>} />
        <Route path="/samples/:id" element={<ProtectedRoute pageName="samples"><SampleDetailPage /></ProtectedRoute>} />
        <Route path="/workshop" element={<ProtectedRoute pageName="workshop"><WorkshopPage /></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute pageName="plans"><TestPlanPage /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute pageName="results"><ResultsPage /></ProtectedRoute>} />
        <Route path="/approvals" element={<ProtectedRoute pageName="approvals"><ApprovalsPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute pageName="invoices"><InvoicePage /></ProtectedRoute>} />
        <Route path="/dispatch" element={<ProtectedRoute pageName="dispatch"><DispatchPage /></ProtectedRoute>} />
        <Route path="/specifications" element={<ProtectedRoute pageName="specifications"><SpecificationPage /></ProtectedRoute>} />
        <Route path="/tests" element={<ProtectedRoute pageName="tests"><TestMasterPage /></ProtectedRoute>} />
        <Route path="/equipment" element={<ProtectedRoute pageName="equipment"><EquipmentPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute pageName="reports"><ReportsPage /></ProtectedRoute>} />
        <Route path="/reports/delay" element={<ProtectedRoute pageName="reports"><ReportsPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute pageName="users"><UsersPage /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute pageName="roles"><RolesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute pageName="settings"><SettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? getDefaultRoute(user) : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
