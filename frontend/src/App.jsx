import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage    from './pages/auth/LoginPage';
import HomePage     from './pages/home/HomePage';
import AuthCallback  from './pages/auth/AuthCallback';
import Dashboard    from './pages/dashboard/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/auth/ResetPasswordPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}