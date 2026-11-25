import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({
  title,
  subtitle,
  isMenuOpen,
  onMenuOpen,
  healthState,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const getApiBadge = () => {
    if (healthState.loading) {
      return { className: 'is-warn', label: 'Checking API...' };
    }
    if (healthState.error) {
      return { className: 'is-err', label: 'API Offline' };
    }
    if (healthState.data?.database?.connected) {
      return { className: 'is-ok', label: 'API & MongoDB Connected' };
    }
    return { className: 'is-warn', label: 'API Online • DB Pending' };
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const badge = getApiBadge();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-toggle-btn"
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="eventhub-sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="topbar-right">
        <span className={`pill-badge ${badge.className}`}>
          <span className="status-dot" aria-hidden="true" />
          {badge.label}
        </span>

        {user && (
          <span className="pill-badge" style={{ textTransform: 'capitalize' }}>
            {user.fullName} ({user.role})
          </span>
        )}

        <button
          type="button"
          className="btn-secondary"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={15} aria-hidden="true" />
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
}
