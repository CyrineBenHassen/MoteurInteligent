// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }  from './context/AuthContext';
import RegisterPage       from './pages/auth/RegisterPage';
import LoginPage          from './pages/auth/LoginPage';
import HomePage           from './pages/home/HomePage';
import AuthCallback       from './pages/auth/AuthCallback';
import Dashboard          from './pages/dashboard/Dashboard';
import PrivateRoute       from './components/PrivateRoute';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';
import Onboarding         from './pages/Onboarding/Onboarding';

// ─── Guard : redirige si déjà onboardé, bloque si non connecté ───────────────
function OnboardingRoute() {
  const { user, loading } = useAuth();

  if (loading) return null; // attend que /me réponde

  if (!user) {
    // pas connecté → login
    return <Navigate to="/login" replace />;
  }

  if (user.onboarding_completed) {
    // déjà onboardé → dashboard directement
    return <Navigate to="/dashboard" replace />;
  }

  return <Onboarding />;
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>           {/* ← BrowserRouter EN PREMIER */}
      <AuthProvider>          {/* ← AuthProvider DEDANS (useNavigate dispo) */}
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/auth/callback"   element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* Onboarding protégée */}
          <Route path="/onboarding" element={<OnboardingRoute />} />

          {/* Dashboard protégé */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}