import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { LoginPage } from './pages/LoginPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { RequireAuth } from './components/RequireAuth';
import { ToastProvider } from './context/ToastContext';
import { WelcomePage } from './pages/public/WelcomePage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/public/TermsOfServicePage';
import { PublicStorefrontPage } from './pages/public/PublicStorefrontPage';
import { PublicIntakePage } from './pages/public/PublicIntakePage';

function App() {
  return (
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

            {/* ========== Authenticated Routes ========== */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
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
              <Route path="seed" element={<SeedPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

