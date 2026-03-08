import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message || 'Reset link sent! Check your email.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root login-page">
      <div className="auth-left">
        <div className="deco-orb-1" /><div className="deco-orb-2" />
        <div className="deco-ring deco-ring-1" /><div className="deco-ring deco-ring-2" />
        <div className="deco-glow-line" />
        <div className="left-content">
          <div className="left-tagline">
            <h1>Reset Your<br /><span className="gold">Password</span></h1>
            <p>We'll send you a secure link to reset your password.</p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="form-card">
          <div className="card-box">
            <div className="form-header">
              <h2>FORGOT PASSWORD</h2>
              <p>Remember it? <Link to="/login">Sign in</Link></p>
            </div>

            {error && (
              <div className="error-msg">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="success-msg">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
                </svg>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Email Address</label>
                <div className="input-wrap">
                  <input
                    type="email"
                    placeholder="Enter your email address"
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

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link to="/login" style={{ color: '#888', fontSize: '14px' }}>← Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}