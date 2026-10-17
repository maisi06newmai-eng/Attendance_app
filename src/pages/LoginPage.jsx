import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, BookOpen, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEMO_ACCOUNTS } from '../data/sampleData';

export default function LoginPage() {
  const { login, showToast } = useApp();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accounts = DEMO_ACCOUNTS[role] || [];

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email or student ID.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // Simulate network
    const result = login(email.trim(), password, role);
    setLoading(false);

    if (result.success) {
      showToast(`Welcome, ${result.user.name}!`, 'success', 'Login Successful');
      navigate(role === 'teacher' ? '/teacher' : '/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-card-header">
          <div className="login-logo-wrap">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect x="3" y="4" width="18" height="22" rx="2.5" stroke="#D9AD70" strokeWidth="1.8" />
              <path d="M7 9h10M7 13h10M7 17h7" stroke="#D9AD70" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="23" cy="22" r="5.5" fill="#287A50" />
              <path d="M21 22l1.5 1.5 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="login-app-name">Tetso Attendance</div>
          <div className="login-app-subtitle">Smart Attendance Management · Tetso College, Nagaland</div>
        </div>

        {/* Body */}
        <div className="login-card-body">
          {/* Role Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
              Sign in as
            </div>
            <div className="role-tabs">
              <button
                id="role-student"
                className={`role-tab-btn ${role === 'student' ? 'selected' : ''}`}
                onClick={() => { setRole('student'); setEmail(''); setPassword(''); setError(''); }}
                type="button"
              >
                <GraduationCap size={20} style={{ color: role === 'student' ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                <span className="role-name">Student</span>
              </button>
              <button
                id="role-teacher"
                className={`role-tab-btn ${role === 'teacher' ? 'selected' : ''}`}
                onClick={() => { setRole('teacher'); setEmail(''); setPassword(''); setError(''); }}
                type="button"
              >
                <BookOpen size={20} style={{ color: role === 'teacher' ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                <span className="role-name">Teacher</span>
              </button>
            </div>
          </div>

          {/* Demo Accounts */}
          <div className="demo-accounts">
            <div className="demo-accounts-title">
              <Info size={13} />
              <span style={{ color: 'var(--color-primary)' }}>Demo Accounts</span>
              <span className="demo-label" style={{ marginLeft: 'auto' }}>Frontend Demo</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', lineHeight: 1.5 }}>
              This is a demonstration application. Click "Use" to fill credentials automatically.
            </p>
            {accounts.map((acc) => (
              <div className="demo-account-row" key={acc.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{acc.name}</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>{acc.email} · {acc.password}</div>
                </div>
                <button className="demo-fill-btn" onClick={() => fillDemo(acc)} type="button">
                  Use →
                </button>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                {role === 'student' ? 'Email or Student ID' : 'Email Address'}
              </label>
              <input
                id="login-email"
                type="text"
                className="form-input"
                placeholder={role === 'student' ? 'Enter email or roll number' : 'Enter email address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="input-group">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input has-icon-right"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner" style={{ width: 18, height: 18 }} />
                  Signing in...
                </>
              ) : (
                `Sign In as ${role === 'student' ? 'Student' : 'Teacher'}`
              )}
            </button>
          </form>

          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.6 }}>
            This is a BCA group project demonstration. No real college systems are connected.
            Passwords are not securely stored — do not enter real credentials.
          </p>
        </div>
      </div>
    </div>
  );
}