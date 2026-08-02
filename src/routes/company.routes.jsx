import { Routes, Route } from 'react-router-dom';
import CompanyLayout from '../Company/CompanyLayout';
import CompanyDashboard from '../Company/Dashboard';
import RepsPage from '../Company/RepsPage';
import SchedulesPage from '../Company/SchedulesPage';
import VisitsPage from '../Company/VisitsPage';
import AssignmentsPage from '../Company/AssignmentsPage';
import SettingsPage from '../Pharmacist/SettingsPage';

export default function CompanyRoutes() {
  return (
    <Routes>
      <Route element={<CompanyLayout />}>
        <Route index element={<CompanyDashboard />} />
        <Route path="Reps" element={<RepsPage />} />
        <Route path="Schedules" element={<SchedulesPage />} />
        <Route path="Visits" element={<VisitsPage />} />
        <Route path="Assignments" element={<AssignmentsPage />} />
        <Route path="Settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
