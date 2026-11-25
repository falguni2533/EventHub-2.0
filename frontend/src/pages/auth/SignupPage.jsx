import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPathForRole } from '../../components/auth/PublicOnlyRoute';

const PASSWORD_PATTERN = '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    collegeName: '',
    studentId: '',
    role: 'student',
    adminSetupKey: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Password and confirm password do not match.');
      return;
    }

    if (formData.role === 'admin' && !formData.adminSetupKey.trim()) {
      setErrorMessage(
        'An Admin Setup Key is required to create an administrator account.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        collegeName: formData.collegeName.trim(),
        studentId: formData.studentId.trim(),
        role: formData.role,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        ...(formData.role === 'admin' && {
          adminSetupKey: formData.adminSetupKey.trim(),
        }),
      };

      const user = await register(payload);
      navigate(getDashboardPathForRole(user.role), { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Unable to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-brand-panel" aria-label="EventHub Registration">
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
              <Sparkles size={14} aria-hidden="true" />
              <span>Join Your Campus Community</span>
            </div>

            <h1 className="auth-brand-heading">
              Create your EventHub student account.
            </h1>
            <p className="auth-brand-copy">
              One verified account for registering in technical fests, forming
              hackathon teams, and carrying digital QR passes.
            </p>
          </div>

          <div className="auth-brand-highlights">
            <div className="auth-highlight-item">
              <strong>Role Protection</strong>
              <span>
                Public signups create Student accounts by default. Admin accounts
                require a verified server setup key.
              </span>
            </div>
            <div className="auth-highlight-item">
              <strong>Encrypted Security</strong>
              <span>
                Passwords are salted and hashed with bcrypt, and sessions use signed
                JWT tokens.
              </span>
            </div>
          </div>
        </section>

        <section className="auth-form-panel" aria-labelledby="signup-heading">
          <div className="auth-form-header">
            <h2 id="signup-heading" className="auth-form-title">
              Create Account
            </h2>
            <p className="auth-form-subtitle">
              Fill in your academic details to get started.
            </p>
          </div>

          {errorMessage && (
            <div className="auth-alert is-error" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-grid">
              <div className="form-field">
                <label htmlFor="signup-fullname" className="form-label">
                  Full Name
                </label>
                <input
                  id="signup-fullname"
                  name="fullName"
                  type="text"
                  className="form-input"
                  placeholder="Aarav Sharma"
                  autoComplete="name"
                  minLength={2}
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="signup-email" className="form-label">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="aarav@college.edu"
                  autoComplete="username"
                  spellCheck={false}
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="auth-form-grid">
              <div className="form-field">
                <label htmlFor="signup-college" className="form-label">
                  College Name
                </label>
                <input
                  id="signup-college"
                  name="collegeName"
                  type="text"
                  className="form-input"
                  placeholder="National Institute of Technology"
                  autoComplete="organization"
                  minLength={2}
                  required
                  value={formData.collegeName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="signup-student-id" className="form-label">
                  Student ID / Enrollment No.
                </label>
                <input
                  id="signup-student-id"
                  name="studentId"
                  type="text"
                  className="form-input"
                  placeholder="CS2026-042"
                  minLength={2}
                  required
                  value={formData.studentId}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="signup-role" className="form-label">
                Account Role
              </label>
              <select
                id="signup-role"
                name="role"
                className="form-input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="student">Student</option>
                <option value="admin">Admin (Requires Setup Key)</option>
              </select>
            </div>

            {formData.role === 'admin' && (
              <div className="form-field">
                <label htmlFor="signup-admin-key" className="form-label">
                  <KeyRound
                    size={14}
                    style={{ verticalAlign: 'middle', marginInlineEnd: 6 }}
                    aria-hidden="true"
                  />
                  Admin Setup Key
                </label>
                <span className="form-hint">
                  Enter the server&apos;s <code>ADMIN_SETUP_KEY</code> to verify
                  initial admin creation.
                </span>
                <input
                  id="signup-admin-key"
                  name="adminSetupKey"
                  type="password"
                  className="form-input"
                  placeholder="Enter admin setup key"
                  required
                  value={formData.adminSetupKey}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-field">
              <label htmlFor="signup-password" className="form-label">
                Password
              </label>
              <span id="signup-password-rules" className="form-hint">
                At least 8 characters with 1 uppercase letter, 1 lowercase letter,
                and 1 number.
              </span>
              <div className="password-input-wrap">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  minLength={8}
                  pattern={PASSWORD_PATTERN}
                  aria-describedby="signup-password-rules"
                  required
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="form-field">
              <label htmlFor="signup-confirm-password" className="form-label">
                Confirm Password
              </label>
              <div className="password-input-wrap">
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  enterKeyHint="done"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirm password'
                      : 'Show confirm password'
                  }
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={submitting}
            >
              <UserPlus size={17} aria-hidden="true" />
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
            </button>
          </form>

          <p className="auth-switch-copy">
            Already have an EventHub account?{' '}
            <Link to="/login" className="auth-switch-link">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
