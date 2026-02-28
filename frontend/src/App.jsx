import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage    from './pages/auth/LoginPage';
import HomePage     from './pages/home/HomePage';
import PrivateRoute from './components/PrivateRoute';

// Dashboard temporaire
function Dashboard() {
  return (
    <div style={{ padding: 40, background: '#EBF2FB', minHeight: '100vh' }}>
      <h1>Dashboard 🎉</h1>
      <p>Tu es connecté !</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ✅ HomePage = page par défaut */}
          <Route path="/"          element={<HomePage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          {/* Toute route inconnue → HomePage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}