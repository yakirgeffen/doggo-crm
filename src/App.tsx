import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ClientsPage } from './pages/ClientsPage';
import { NewClientPage } from './pages/NewClientPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { NewProgramPage } from './pages/NewProgramPage';
import { ProgramDetailPage } from './pages/ProgramDetailPage';
import { NewSessionPage } from './pages/NewSessionPage';
import { SeedPage } from './pages/SeedPage';
import { StorefrontAdminPage } from './pages/StorefrontAdminPage';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { ToastProvider } from './context/ToastContext';
import { LandingPage } from './pages/public/LandingPage';
import { WelcomePage } from './pages/public/WelcomePage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/public/TermsOfServicePage';
import { PublicStorefrontPage } from './pages/public/PublicStorefrontPage';
import { PublicIntakePage } from './pages/public/PublicIntakePage';

// Root entry: unauthenticated visitors at '/' see the LandingPage
// (CMO trainer-acquisition surface). Authenticated visitors render the
// Layout with the Dashboard. Sub-routes under '/' (e.g., /clients) still
// require auth — unauthenticated visitors land on /login per the
// existing redirect contract.
function RootEntry() {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-bg-app">
                <div className="text-primary">Loading...</div>
            </div>
        );
    }

    if (!session) {
        if (location.pathname === '/') return <LandingPage />;
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Layout />;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
          <Routes>
            {/* ========== Public Routes ========== */}
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Public Storefront & Intake */}
            <Route path="/t/:trainerHandle" element={<PublicStorefrontPage />} />
            <Route path="/t/:trainerHandle/intake" element={<PublicIntakePage />} />

            {/* ========== Root + Authenticated Routes ========== */}
            <Route path="/" element={<RootEntry />}>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/new" element={<NewClientPage />} />
              <Route path="clients/:id" element={<ClientDetailPage />} />
              <Route path="storefront" element={<StorefrontAdminPage />} />

              {/* Programs — kept for backwards compat, will fold into clients in Phase 2 */}
              <Route path="programs" element={<ProgramsPage />} />
              <Route path="programs/new" element={<NewProgramPage />} />
              <Route path="programs/:id" element={<ProgramDetailPage />} />
              <Route path="programs/:programId/sessions/new" element={<NewSessionPage />} />

              <Route path="calendar" element={<CalendarPage />} />
              <Route path="settings" element={<SettingsPage />} />
              {import.meta.env.DEV && <Route path="seed" element={<SeedPage />} />}
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

