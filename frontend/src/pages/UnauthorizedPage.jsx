import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForRole } from '../components/auth/PublicOnlyRoute';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const location = useLocation();
  const homePath = getDashboardPathForRole(user?.role);

  return (
    <div className="auth-page">
      <section className="card placeholder-panel" style={{ maxWidth: 520, margin: 'auto' }}>
        <div className="placeholder-icon" aria-hidden="true">
          <ShieldAlert size={28} />
        </div>

        <div>
          <h1 className="card-title">Access Restricted (403)</h1>
          <p className="card-subtitle" style={{ marginBlockStart: '0.45rem' }}>
            Your current role (<strong>{user?.role || 'guest'}</strong>) does not
            have permission to open{' '}
            <code>{location.state?.attemptedPath || 'this route'}</code>.
          </p>
        </div>

        <Link to={homePath} className="btn-primary">
          <ArrowLeft size={16} />
          <span>
            Go to {user?.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}
          </span>
        </Link>
      </section>
    </div>
  );
}
