import { NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from 'lucide-react';
import { getNavItemsForRole } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}) {
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
        className={`sidebar ${isOpen ? 'is-open' : ''} ${
          isCollapsed ? 'is-collapsed' : ''
        }`}
        aria-label={`${sectionLabel} Navigation`}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <div className="brand-logo" aria-hidden="true">
              <Sparkles size={20} />
            </div>
            {!isCollapsed && (
              <div className="brand-text">
                <div className="brand-title font-display">EventHub</div>
                <div className="brand-subtitle">{panelTitle}</div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {!isCollapsed && (
          <div className="sidebar-section-label">{sectionLabel}</div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/' || item.path === '/admin'}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'is-active' : ''}`
                }
              >
                <Icon size={18} aria-hidden="true" className="sidebar-link-icon" />
                {!isCollapsed && <span className="sidebar-link-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!isCollapsed && (
            <>
              <div className="sidebar-footer-title">
                {user?.fullName || 'Authenticated User'}
              </div>
              <p className="sidebar-footer-note">
                {user?.collegeName} •{' '}
                <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
              </p>
            </>
          )}
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            title={isCollapsed ? 'Log Out' : undefined}
            aria-label="Log Out"
          >
            <LogOut size={15} aria-hidden="true" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
