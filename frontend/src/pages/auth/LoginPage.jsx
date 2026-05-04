import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth(); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-root login-page">

        <div className="auth-left">
          <div className="deco-orb-1" />
          <div className="deco-orb-2" />
          <div className="deco-ring deco-ring-1" />
          <div className="deco-ring deco-ring-2" />
          <div className="deco-dot deco-dot-1" />
          <div className="deco-dot deco-dot-2" />
          <div className="deco-dot deco-dot-3" />
          <div className="deco-dot deco-dot-4" />
          <div className="deco-glow-line" />

          <div className="left-content">
            <div className="left-tagline">
              <h1>Test Smarter,<br />Ship <span className="gold">Faster</span></h1>
              <p>Your AI-powered engine for automated web test generation</p>
            </div>

            <div className="benefits-list">
              {[
                { title: 'Automated DOM Crawling',     desc: 'Instantly maps every interactive element of your app' },
                { title: 'AI-Generated Test Cases',    desc: 'Covers functional flows, edge cases & error scenarios' },
                { title: 'Selenium & Cypress Scripts', desc: 'Production-ready code, zero manual effort' },
                { title: 'Downloadable PDF Report',    desc: 'Full documentation of every generated test' },
              ].map((item, i, arr) => (
                <div key={i}>
                  <div className="benefit-item">
                    <div className="benefit-check">✓</div>
                    <div className="benefit-text">
                      <span className="benefit-title">{item.title}</span>
                      <span className="benefit-desc">{item.desc}</span>
                    </div>
                  </div>
                  {i < arr.length - 1 && <div className="benefit-sep" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="form-card">
            <div className="card-box">
              <div className="form-header">
                <h2>WELCOME BACK</h2>
                <p>No account yet? <Link to="/register">Create your account</Link></p>
              </div>

              {error && (
                <div className="error-msg">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Email Address</label>
                  <div className="input-wrap">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    <span className="input-ico">
                      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="field">
  <label>Password</label>
  <div className="input-wrap">
    <input
      type={showPassword ? "text" : "password"}
      placeholder="Enter your password"
      autoComplete="current-password"
      value={password}
      onChange={e => setPassword(e.target.value)}
      required
    />
    <span className="input-ico">
      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </span>

    {/* Bouton œil — visible seulement si password non vide */}
    {password && (
      <button
        type="button"
        onClick={() => setShowPassword(prev => !prev)}
        style={{
          position: 'absolute',
          right: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: showPassword ? '#d4af37' : '#c8d4e0',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.2s',
        }}
        tabIndex={-1}
        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
       {showPassword ? (
  /* Œil ouvert — mot de passe CACHÉ (par défaut) */
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  /* Œil barré — mot de passe VISIBLE */
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)}
      </button>
    )}
  </div>
</div>

                <div className="row-between">
                  <label className="check-label">
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                    Remember me
                  </label>
                  <Link to="/forgot-password" className="forgot">Forgot password?</Link>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="divider">
                <span /><small>or</small><span />
              </div>

              <button type="button" className="google-btn" onClick={loginWithGoogle}>
                <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
                Continue with Google
              </button>

            </div>
          </div>
        </div>

      </div>
    </>
  );
}