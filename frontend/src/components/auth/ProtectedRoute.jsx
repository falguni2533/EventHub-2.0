import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <div className="auth-loading-card card">
          <div className="brand-logo" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="card-title">Restoring Session</h2>
            <p className="card-subtitle">Verifying your EventHub credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ attemptedPath: location.pathname }}
      />
    );
  }

  return children || <Outlet />;
}
