import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const params  = new URLSearchParams(window.location.search);
    const token   = params.get('token');
    const userRaw = params.get('user');
    const error   = params.get('error');

    if (error || !token || !userRaw) {
      navigate('/login?error=google_failed');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));

      // ✅ Sauvegarde directement dans localStorage SANS passer par le contexte
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ Redirige — AuthContext lira localStorage automatiquement
      navigate('/dashboard', { replace: true });
    } catch {
      navigate('/login?error=parse_failed');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0f0f1a', color: '#fff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid #d4a017',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p>Connexion avec Google...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}