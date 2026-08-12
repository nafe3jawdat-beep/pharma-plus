import { Routes, Route } from 'react-router-dom';
import PharmacistLayout from '../Pharmacist/PharmacistLayout';
import DashboardContent from '../Pharmacist/Dashboard';
import NotificationsPage from '../Pharmacist/NotificationsPage';
import RequestsPage from '../Pharmacist/RequestsPage';
import OrdersPage from '../Pharmacist/OrdersPage';
import AddDrugPage from '../Pharmacist/AddDrugPage';
import AddPharmacyPage from '../Pharmacist/AddPharmacyPage';
import EditPharmacyPage from '../Pharmacist/EditPharmacyPage';
import StockManagement from '../Pharmacist/StockManagement';
import EmployeesPage from '../Pharmacist/EmployeesPage';
import AnalyticsPage from '../Pharmacist/AnalyticsPage';
import SettingsPage from '../Pharmacist/SettingsPage';
import MedicationsPage from '../Pharmacist/MedicationsPage';
import PharmacySearchPage from '../Pharmacist/PharmacySearchPage';
import ProposalsPage from '../Pharmacist/ProposalsPage';
import POSPage from '../Pharmacist/POSPage';
import BatchesPage from '../Pharmacist/BatchesPage';
import SalariesPage from '../Pharmacist/SalariesPage';
import ExpensesPage from '../Pharmacist/ExpensesPage';
import FinancePage from '../Pharmacist/FinancePage';
import ProtectedRoute from '../components/ProtectedRoute';

export default function PharmacistRoutes() {
  return (
    <Routes>
      <Route element={<PharmacistLayout />}>
        <Route index element={<DashboardContent />} />
        <Route path="Notifications" element={<NotificationsPage />} />
        <Route path="Requests" element={<ProtectedRoute requiredPermissions={['orders_process']}><RequestsPage /></ProtectedRoute>} />
        <Route path="Orders" element={<ProtectedRoute requiredPermissions={['orders_process']}><OrdersPage /></ProtectedRoute>} />
        <Route path="AddDrugPage" element={<AddDrugPage />} />
        <Route path="Proposals" element={<ProposalsPage />} />
        <Route path="AddPharmacy" element={<ProtectedRoute requiredPermissions={['pharmacy_manage']}><AddPharmacyPage /></ProtectedRoute>} />
        <Route path="EditPharmacy" element={<ProtectedRoute requiredPermissions={['pharmacy_manage', 'operating_hours_manage']}><EditPharmacyPage /></ProtectedRoute>} />
        <Route path="FindPharmacy" element={<PharmacySearchPage />} />
        <Route path="StockManagement" element={<ProtectedRoute requiredPermissions={['inventory_manage']}><StockManagement /></ProtectedRoute>} />
        <Route path="Employees" element={<ProtectedRoute requiredPermissions={['pharmacy_manage']}><EmployeesPage /></ProtectedRoute>} />
        <Route path="Salaries" element={<ProtectedRoute requiredPermissions={[]}><SalariesPage /></ProtectedRoute>} />
        <Route path="Expenses" element={<ProtectedRoute requiredPermissions={[]}><ExpensesPage /></ProtectedRoute>} />
        <Route path="Finance" element={<ProtectedRoute requiredPermissions={[]}><FinancePage /></ProtectedRoute>} />
        <Route path="AnalyticsPage" element={<ProtectedRoute requiredPermissions={[]}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="Settings" element={<SettingsPage />} />
        <Route path="Medications" element={<ProtectedRoute requiredPermissions={['inventory_manage']}><MedicationsPage /></ProtectedRoute>} />
        <Route path="POS" element={<ProtectedRoute requiredPermissions={['inventory_manage']}><POSPage /></ProtectedRoute>} />
        <Route path="Batches" element={<ProtectedRoute requiredPermissions={['inventory_manage']}><BatchesPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
