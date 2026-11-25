import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Sparkles, X } from 'lucide-react';
import { getNavItemsForRole } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = getNavItemsForRole(user?.role);
  const panelTitle = user?.role === 'admin' ? 'Admin Portal' : 'Student Portal';
  const sectionLabel = user?.role === 'admin' ? 'Admin Panel' : 'Student Panel';

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="eventhub-sidebar"
        className={`sidebar ${isOpen ? 'is-open' : ''}`}
        aria-label={`${sectionLabel} Navigation`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <div className="brand-logo" aria-hidden="true">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="brand-title font-display">EventHub</div>
              <div className="brand-subtitle">{panelTitle}</div>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-section-label">{sectionLabel}</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/' || item.path === '/admin'}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'is-active' : ''}`
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-title">{user?.fullName || 'Authenticated User'}</div>
          <p className="sidebar-footer-note">
            {user?.collegeName} • <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          </p>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={15} aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
