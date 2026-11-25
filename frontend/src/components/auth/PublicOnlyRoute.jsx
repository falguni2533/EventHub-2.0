import { Navigate, Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const getDashboardPathForRole = (role) =>
  role === 'admin' ? '/admin' : '/';

export default function PublicOnlyRoute({ children }) {
  const { user, isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <div className="auth-loading-card card">
          <div className="brand-logo" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="card-title">EventHub</h2>
            <p className="card-subtitle">Checking authentication status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
  }

  return children || <Outlet />;
}
