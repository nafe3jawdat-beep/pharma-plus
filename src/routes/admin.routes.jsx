import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../Admin/AdminLayout';
import AdminDashboard from '../Admin/Dashboard';
import UserList from '../Admin/Users/UserList';
import UserShow from '../Admin/Users/UserShow';
import UserForm from '../Admin/Users/UserForm';
import CompanyList from '../Admin/Companies/CompanyList';
import CompanyShow from '../Admin/Companies/CompanyShow';
import CompanyForm from '../Admin/Companies/CompanyForm';
import PendingCompanies from '../Admin/Companies/PendingCompanies';
import DoctorList from '../Admin/Doctors/DoctorList';
import DoctorShow from '../Admin/Doctors/DoctorShow';
import DoctorForm from '../Admin/Doctors/DoctorForm';
import PendingDoctors from '../Admin/Doctors/PendingDoctors';
import PharmacistList from '../Admin/Pharmacists/PharmacistList';
import PharmacistShow from '../Admin/Pharmacists/PharmacistShow';
import PharmacistForm from '../Admin/Pharmacists/PharmacistForm';
import PendingPharmacists from '../Admin/Pharmacists/PendingPharmacists';
import PatientList from '../Admin/Patients/PatientList';
import PatientForm from '../Admin/Patients/PatientForm';
import SpecialistList from '../Admin/Specialists/SpecialistList';
import SpecialistForm from '../Admin/Specialists/SpecialistForm';
import ScientificRepList from '../Admin/ScientificReps/ScientificRepList';
import ScientificRepForm from '../Admin/ScientificReps/ScientificRepForm';
import ChronicDiseaseList from '../Admin/MedicalData/ChronicDiseaseList';
import ChronicDiseaseForm from '../Admin/MedicalData/ChronicDiseaseForm';
import ActiveIngredientList from '../Admin/MedicalData/ActiveIngredientList';
import ActiveIngredientForm from '../Admin/MedicalData/ActiveIngredientForm';
import MedicationList from '../Admin/MedicalData/MedicationList';
import MedicationForm from '../Admin/MedicalData/MedicationForm';
import ProposalList from '../Admin/Proposals/ProposalList';
import ProposalShow from '../Admin/Proposals/ProposalShow';
import ActivityLog from '../Admin/Audit/ActivityLog';
import SettingsPage from '../Admin/Settings';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="Dashboard" element={<AdminDashboard />} />
        <Route path="Users" element={<UserList />} />
        <Route path="Users/create" element={<UserForm />} />
        <Route path="Users/:id" element={<UserShow />} />
        <Route path="Users/:id/edit" element={<UserForm />} />
        <Route path="Companies" element={<CompanyList />} />
        <Route path="Companies/create" element={<CompanyForm />} />
        <Route path="Companies/Pending" element={<PendingCompanies />} />
        <Route path="Companies/:id" element={<CompanyShow />} />
        <Route path="Companies/:id/edit" element={<CompanyForm />} />
        <Route path="Doctors" element={<DoctorList />} />
        <Route path="Doctors/create" element={<DoctorForm />} />
        <Route path="Doctors/Pending" element={<PendingDoctors />} />
        <Route path="Doctors/:id" element={<DoctorShow />} />
        <Route path="Doctors/:id/edit" element={<DoctorForm />} />
        <Route path="Pharmacists" element={<PharmacistList />} />
        <Route path="Pharmacists/create" element={<PharmacistForm />} />
        <Route path="Pharmacists/Pending" element={<PendingPharmacists />} />
        <Route path="Pharmacists/:id" element={<PharmacistShow />} />
        <Route path="Pharmacists/:id/edit" element={<PharmacistForm />} />
        <Route path="Patients" element={<PatientList />} />
        <Route path="Patients/create" element={<PatientForm />} />
        <Route path="Patients/:id/edit" element={<PatientForm />} />
        <Route path="Specialists" element={<SpecialistList />} />
        <Route path="Specialists/create" element={<SpecialistForm />} />
        <Route path="Specialists/:id/edit" element={<SpecialistForm />} />
        <Route path="ScientificReps" element={<ScientificRepList />} />
        <Route path="ScientificReps/create" element={<ScientificRepForm />} />
        <Route path="ScientificReps/:id/edit" element={<ScientificRepForm />} />
        <Route path="MedicalData/Diseases" element={<ChronicDiseaseList />} />
        <Route path="MedicalData/Diseases/create" element={<ChronicDiseaseForm />} />
        <Route path="MedicalData/Diseases/:id/edit" element={<ChronicDiseaseForm />} />
        <Route path="MedicalData/Ingredients" element={<ActiveIngredientList />} />
        <Route path="MedicalData/Ingredients/create" element={<ActiveIngredientForm />} />
        <Route path="MedicalData/Ingredients/:id/edit" element={<ActiveIngredientForm />} />
        <Route path="MedicalData/Medications" element={<MedicationList />} />
        <Route path="MedicalData/Medications/create" element={<MedicationForm />} />
        <Route path="MedicalData/Medications/:id/edit" element={<MedicationForm />} />
        <Route path="Proposals" element={<ProposalList />} />
        <Route path="Proposals/:id" element={<ProposalShow />} />
        <Route path="Activity" element={<ActivityLog />} />
        <Route path="Settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
