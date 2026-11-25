import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPathForRole } from '../../components/auth/PublicOnlyRoute';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const email = formData.email.trim();
    if (!email || !formData.password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({
        email,
        password: formData.password,
      });

      const targetPath = getDashboardPathForRole(user.role);
      const fromPath = location.state?.from?.pathname;

      // Only redirect back to saved path if it matches the authenticated user's role scope
      if (
        fromPath &&
        ((user.role === 'admin' && fromPath.startsWith('/admin')) ||
          (user.role === 'student' && !fromPath.startsWith('/admin')))
      ) {
        navigate(fromPath, { replace: true });
      } else {
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand-panel" aria-label="EventHub Overview">
          <div className="auth-brand-top">
            <div className="brand-mark">
              <div className="brand-logo" aria-hidden="true">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="brand-title font-display">EventHub</div>
                <div className="brand-subtitle">College Event Platform</div>
              </div>
            </div>

            <div className="cosmic-hero-badge" style={{ marginBlockStart: '1.5rem' }}>
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Phase 1 • Secure Role-Based Access</span>
            </div>

            <h1 className="auth-brand-heading">
              Welcome back to your campus event hub.
            </h1>
            <p className="auth-brand-copy">
              Sign in with your EventHub credentials to access your Student
              Dashboard or Admin control panel.
            </p>
          </div>

          <div className="auth-brand-highlights">
            <div className="auth-highlight-item">
              <strong>Students</strong>
              <span>Discover campus events, track passes, and manage your team.</span>
            </div>
            <div className="auth-highlight-item">
              <strong>Administrators</strong>
              <span>Manage college events, student rosters, and verification tools.</span>
            </div>
          </div>
        </section>

        <section className="auth-form-panel" aria-labelledby="login-heading">
          <div className="auth-form-header">
            <h2 id="login-heading" className="auth-form-title">
              Sign In to EventHub
            </h2>
            <p className="auth-form-subtitle">
              Enter your email and password to continue.
            </p>
          </div>

          {errorMessage && (
            <div className="auth-alert is-error" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="login-email" className="form-label">
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@college.edu"
                autoComplete="username"
                spellCheck={false}
                required
                value={formData.email}
                onChange={handleChange}
                enterKeyHint="next"
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <div className="password-input-wrap">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  enterKeyHint="done"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={submitting}
            >
              <LogIn size={17} aria-hidden="true" />
              <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="auth-switch-copy">
            New to EventHub?{' '}
            <Link to="/signup" className="auth-switch-link">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
