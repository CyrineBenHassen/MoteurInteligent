import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage    from './pages/auth/LoginPage';
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
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}