import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [fErr, setFErr] = useState({});
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth(); 
  const navigate = useNavigate();

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const str = pwStrength(form.password);
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][str];
  const strCls = str <= 1 ? 'weak' : str <= 2 ? 'medium' : 'strong';

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.includes('@')) e.email = 'Enter a valid email';
    if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setFErr(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!agreed) { setError('Please accept the Terms of Service to continue.'); return; }
    setError(''); setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, password_confirmation: form.confirm });
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-root register-page">

        <div className="auth-left">
          <div className="deco-orb-1" />
          <div className="deco-orb-2" />
          <div className="deco-ring deco-ring-1" />
          <div className="deco-ring deco-ring-2" />
          <div className="deco-ring-3" />
          <div className="deco-ring-4" />
          <div className="deco-dot deco-dot-1" />
          <div className="deco-dot deco-dot-2" />
          <div className="deco-dot deco-dot-3" />
          <div className="deco-dot deco-dot-4" />
          <div className="deco-glow-line" />

          <div className="left-headline">
            <h1>Smart Testing<br />Starts <span className="gold">Here</span></h1>
            <div className="gold-line" />
           <p>Stop writing tests manually. Our generative AI engine crawls your web app, identifies interactive elements, and instantly produces Selenium & Cypress automation scripts.</p>
          </div>

          <div className="steps">
            {[
              { n: '01', t: 'Sign up for free', d: 'Instant access — no setup, no credit card' },
              { n: '02', t: 'Submit your app URL', d: 'Drop a URL and let the engine do the rest' },
              { n: '03', t:'AI generates test cases', d: 'Covers functional scenarios, edge cases & error flows automatically'},
              { n: '04', t: 'Download Selenium & Cypress scripts', d: 'Production-ready scripts with a full PDF report, zero manual effort' },
            ].map((s, i, arr) => (
              <div className="step" key={s.n}>
                <div className="step-left">
                  <div className="step-num">{s.n}</div>
                  {i < arr.length - 1 && <div className="step-connector" />}
                </div>
                <div className="step-body">
                  <div className="step-title">{s.t}</div>
                  <div className="step-desc">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-right">
          <div className="form-card">
            <div className="card-box">
              <div className="form-header">
                <h2>CREATE ACCOUNT</h2>
                <p>Already registered? <Link to="/login"> Sign in </Link></p>
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
                  <label>Full Name</label>
                  <div className="input-wrap">
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      autoComplete="name"
                      value={form.name}
                      onChange={set('name')}
                      className={fErr.name ? 'err' : ''}
                    />
                    <span className="input-ico">
                      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                  </div>
                  {fErr.name && <div className="field-err">✕ {fErr.name}</div>}
                </div>

                <div className="field">
                  <label>Email Address</label>
                  <div className="input-wrap">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      autoComplete="email"
                      value={form.email}
                      onChange={set('email')}
                      className={fErr.email ? 'err' : ''}
                    />
                    <span className="input-ico">
                      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                      </svg>
                    </span>
                  </div>
                  {fErr.email && <div className="field-err">✕ {fErr.email}</div>}
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="input-wrap">
                    <input
                      type="password"
                      placeholder="Create a password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={set('password')}
                      className={fErr.password ? 'err' : ''}
                    />
                    <span className="input-ico">
                      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                  </div>
                  {form.password && (
                    <>
                      <div className="strength-bar">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`s-seg ${i <= str ? strCls : ''}`} />
                        ))}
                      </div>
                      <div className="strength-label">Password strength: {strLabel}</div>
                    </>
                  )}
                  {fErr.password && <div className="field-err">✕ {fErr.password}</div>}
                </div>

                <div className="field">
                  <label>Confirm Password</label>
                  <div className="input-wrap">
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      value={form.confirm}
                      onChange={set('confirm')}
                      className={fErr.confirm ? 'err' : ''}
                    />
                    <span className="input-ico">
                      <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4" /><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                  </div>
                  {fErr.confirm && <div className="field-err">✕ {fErr.confirm}</div>}
                </div>

                <label className="terms-row">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </label>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
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