import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import './Auth.css';

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // false = caché (par défaut) | true = visible
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setSuccess(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // SVG cadenas — identique pour les 2 champs
  const LockIcon = () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  // Style bouton œil
  const eyeStyle = (visible) => ({
    position: 'absolute', right: '14px', top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: visible ? '#d4af37' : '#c8d4e0',
    padding: '4px', display: 'flex',
    alignItems: 'center', transition: 'color 0.2s',
  });

  // SVG œil ouvert (mot de passe caché)
  const EyeOpen = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  // SVG œil barré (mot de passe visible)
  const EyeOff = () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <div className="auth-root login-page">
      <div className="auth-left">
        <div className="deco-orb-1" /><div className="deco-orb-2" />
        <div className="deco-ring deco-ring-1" /><div className="deco-ring deco-ring-2" />
        <div className="deco-glow-line" />
        <div className="left-content">
          <div className="left-tagline">
            <h1>Create New<br /><span className="gold">Password</span></h1>
            <p>Choose a strong password for your account.</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="form-card">
          <div className="card-box">
            <div className="form-header">
              <h2>RESET PASSWORD</h2>
              <p>Remember it? <Link to="/login">Sign in</Link></p>
            </div>

            {error && (
              <div className="error-msg">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-msg">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
                </svg>
                {success} Redirecting to login...
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* ── New Password ── */}
              <div className="field">
                <label>New Password</label>
                <div className="input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingRight: password ? '44px' : '16px' }}
                  />
                  <span className="input-ico">
                    <LockIcon />
                  </span>
                  {password && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(p => !p)}
                      style={eyeStyle(showPassword)}
                    >
                      {showPassword ? <EyeOpen /> : <EyeOff />}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Confirm Password ── */}
              <div className="field">
                <label>Confirm Password</label>
                <div className="input-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    style={{ paddingRight: confirm ? '44px' : '16px' }}
                  />
                  <span className="input-ico">
                    <LockIcon />
                  </span>
                  {confirm && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm(p => !p)}
                      style={eyeStyle(showConfirm)}
                    >
                      {showConfirm ? <EyeOff /> : <EyeOpen />}
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading || !!success}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}