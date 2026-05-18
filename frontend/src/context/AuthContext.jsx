import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper centralisé pour rediriger selon l'état onboarding
  const redirectAfterAuth = (userData) => {
    if (!userData.onboarding_completed) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/me')
        .then(res => {
          setUser(res.data);
          // Pas de redirect ici — l'utilisateur est déjà sur une page
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, []);

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    redirectAfterAuth(res.data.user); // ← nouveau user → toujours onboarding
  };

  const login = async (data) => {
    const res = await api.post('/auth/login', data);
    localStorage.setItem('token', res.data.access_token);
    setUser(res.data.user);
    redirectAfterAuth(res.data.user); // ← redirige selon onboarding_completed
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const setAuthFromGoogle = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
    redirectAfterAuth(userData); // ← aussi pour Google OAuth
  };

  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:8000/auth/google';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, register, login, logout, loginWithGoogle, setAuthFromGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);