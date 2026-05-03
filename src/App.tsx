import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastContext';

// Public routes — typically the cold-load entry point. Keep landing eager
// (visited first; affects LCP), lazy-load the rest.
import { LandingPage } from './pages/public/LandingPage';
const PricingPage = lazy(() => import('./pages/public/PricingPage').then(m => ({ default: m.PricingPage })));
const BlogIndexPage = lazy(() => import('./pages/public/BlogIndexPage').then(m => ({ default: m.BlogIndexPage })));
const BlogPostPage = lazy(() => import('./pages/public/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const WelcomePage = lazy(() => import('./pages/public/WelcomePage').then(m => ({ default: m.WelcomePage })));
const PrivacyPolicyPage = lazy(() => import('./pages/public/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/public/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const PublicStorefrontPage = lazy(() => import('./pages/public/PublicStorefrontPage').then(m => ({ default: m.PublicStorefrontPage })));
const PublicIntakePage = lazy(() => import('./pages/public/PublicIntakePage').then(m => ({ default: m.PublicIntakePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

// Authenticated routes — defer until the trainer actually navigates there.
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const NewClientPage = lazy(() => import('./pages/NewClientPage').then(m => ({ default: m.NewClientPage })));
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));
const ProgramsPage = lazy(() => import('./pages/ProgramsPage').then(m => ({ default: m.ProgramsPage })));
const NewProgramPage = lazy(() => import('./pages/NewProgramPage').then(m => ({ default: m.NewProgramPage })));
const ProgramDetailPage = lazy(() => import('./pages/ProgramDetailPage').then(m => ({ default: m.ProgramDetailPage })));
const NewSessionPage = lazy(() => import('./pages/NewSessionPage').then(m => ({ default: m.NewSessionPage })));
const SeedPage = lazy(() => import('./pages/SeedPage').then(m => ({ default: m.SeedPage })));
const StorefrontAdminPage = lazy(() => import('./pages/StorefrontAdminPage').then(m => ({ default: m.StorefrontAdminPage })));
const LeadsPage = lazy(() => import('./pages/LeadsPage').then(m => ({ default: m.LeadsPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

function RouteSpinner() {
    return (
        <div className="flex h-screen items-center justify-center bg-bg-app">
            <div className="text-primary">טוען...</div>
        </div>
    );
}

function RootEntry() {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <RouteSpinner />;
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
          <Suspense fallback={<RouteSpinner />}>
          <Routes>
            {/* ========== Public Routes ========== */}
            <Route path="/welcome" element={<WelcomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
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
              <Route path="leads" element={<LeadsPage />} />
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
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
