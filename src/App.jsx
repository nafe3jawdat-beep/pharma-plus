import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { EchoProvider } from "./contexts/EchoContext";
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import TwoFactorVerify from './pages/TwoFactorVerify';
import 'leaflet/dist/leaflet.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const PharmacistRoutes = lazy(() => import('./routes/pharmacist.routes'));
const AdminRoutes = lazy(() => import('./routes/admin.routes'));
const CompanyRoutes = lazy(() => import('./routes/company.routes'));

function App() {
  const loading = <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span></div>;

  return (
    <AuthProvider>
      <EchoProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/" element={<Suspense fallback={loading}><LandingPage /></Suspense>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-2fa" element={<TwoFactorVerify />} />
        <Route path="/Dashboard/*" element={<ErrorBoundary><Suspense fallback={loading}><PharmacistRoutes /></Suspense></ErrorBoundary>} />
        <Route path="/Admin/*" element={<ErrorBoundary><Suspense fallback={loading}><AdminRoutes /></Suspense></ErrorBoundary>} />
        <Route path="/Company/Dashboard/*" element={<ErrorBoundary><Suspense fallback={loading}><CompanyRoutes /></Suspense></ErrorBoundary>} />
      </Routes>
      </EchoProvider>
    </AuthProvider>
  );
}

export default App;
