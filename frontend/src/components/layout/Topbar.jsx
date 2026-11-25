import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const getInitials = (name) => {
  if (!name) return 'EH';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatNotificationDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return '';
  }
};

export default function Topbar({
  title,
  breadcrumbSection,
  isMenuOpen,
  onMenuOpen,
  healthState,
  notifications = [],
  onNotificationRef,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifTriggerRef = useRef(null);
  const notifPanelRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const profilePanelRef = useRef(null);

  const notifId = useId();
  const profileId = useId();

  const isAdmin = user?.role === 'admin';
  const dashboardPath = isAdmin ? '/admin' : '/';
  const profilePath = isAdmin ? '/admin/profile' : '/profile';

  const supportsPopover =
    typeof HTMLElement !== 'undefined' &&
    Object.hasOwn(HTMLElement.prototype, 'popover');

  useEffect(() => {
    if (typeof onNotificationRef === 'function') {
      onNotificationRef(() => {
        const panel = notifPanelRef.current;
        if (!panel) return;
        if (supportsPopover && typeof panel.showPopover === 'function') {
          try {
            panel.showPopover({ source: notifTriggerRef.current });
          } catch {
            panel.showPopover();
          }
        } else {
          setNotifOpen(true);
        }
      });
    }
  }, [onNotificationRef, supportsPopover]);

  useEffect(() => {
    const notifEl = notifPanelRef.current;
    const profileEl = profilePanelRef.current;

    const onNotifToggle = (e) => setNotifOpen(e.newState === 'open');
    const onProfileToggle = (e) => setProfileOpen(e.newState === 'open');

    notifEl?.addEventListener('toggle', onNotifToggle);
    profileEl?.addEventListener('toggle', onProfileToggle);

    return () => {
      notifEl?.removeEventListener('toggle', onNotifToggle);
      profileEl?.removeEventListener('toggle', onProfileToggle);
    };
  }, []);

  // Fallback outside-click & Escape handling when native Popover API is unavailable
  useEffect(() => {
    if (supportsPopover || (!notifOpen && !profileOpen)) return undefined;

    const handleClickOutside = (event) => {
      if (
        notifOpen &&
        !notifPanelRef.current?.contains(event.target) &&
        !notifTriggerRef.current?.contains(event.target)
      ) {
        setNotifOpen(false);
      }
      if (
        profileOpen &&
        !profilePanelRef.current?.contains(event.target) &&
        !profileTriggerRef.current?.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [supportsPopover, notifOpen, profileOpen]);

  const togglePanel = (panelRef, triggerRef, isOpenState, setOpenState) => {
    const panel = panelRef.current;
    if (!panel) return;
    if (supportsPopover && typeof panel.togglePopover === 'function') {
      if (panel.matches(':popover-open')) {
        panel.hidePopover();
      } else {
        try {
          panel.showPopover({ source: triggerRef.current });
        } catch {
          panel.showPopover();
        }
      }
    } else {
      setOpenState(!isOpenState);
    }
  };

  const closePanel = (panelRef, setOpenState) => {
    const panel = panelRef.current;
    if (supportsPopover && panel?.matches(':popover-open')) {
      panel.hidePopover();
    } else {
      setOpenState(false);
    }
  };

  const getApiBadge = () => {
    if (healthState.loading) {
      return { className: 'is-warn', label: 'Checking API...' };
    }
    if (healthState.error) {
      return { className: 'is-err', label: 'API Offline' };
    }
    if (healthState.data?.database?.connected) {
      return { className: 'is-ok', label: 'MongoDB Live' };
    }
    return { className: 'is-warn', label: 'DB Pending' };
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    closePanel(profilePanelRef, setProfileOpen);
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

        <div className="topbar-heading-group">
          <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
            <span>{breadcrumbSection}</span>
            <ChevronRight size={13} aria-hidden="true" />
            <span className="topbar-breadcrumb-current">{title}</span>
          </nav>
          <h1 className="topbar-title">{title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        <span className={`pill-badge topbar-status-pill ${badge.className}`}>
          <span className="status-dot" aria-hidden="true" />
          <span className="topbar-status-text">{badge.label}</span>
        </span>

        {/* Notification Bell & Popover */}
        <div className="topbar-popover-wrap">
          <button
            ref={notifTriggerRef}
            type="button"
            className="topbar-icon-btn topbar-notif-trigger"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            aria-controls={notifId}
            onClick={() =>
              togglePanel(notifPanelRef, notifTriggerRef, notifOpen, setNotifOpen)
            }
          >
            <Bell size={18} aria-hidden="true" />
            {notifications.length > 0 && (
              <span className="topbar-notif-dot" aria-hidden="true" />
            )}
          </button>

          <div
            ref={notifPanelRef}
            id={notifId}
            popover={supportsPopover ? 'auto' : undefined}
            className={`topbar-popover topbar-notif-panel anchored-overlay ${
              !supportsPopover && notifOpen ? 'is-fallback-open' : ''
            }`}
          >
            <div className="topbar-popover-header">
              <span className="topbar-popover-title">Notifications</span>
              <span className="pill-badge">
                {notifications.length > 0 ? `${notifications.length} active` : 'Up to date'}
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="topbar-popover-empty">
                <Bell size={20} aria-hidden="true" />
                <p>No new notifications right now.</p>
                <span>Event reminders and registration updates will appear here.</span>
              </div>
            ) : (
              <ul className="topbar-notif-list">
                {notifications.map((item) => (
                  <li key={item.id} className="topbar-notif-item">
                    <div className="topbar-notif-item-top">
                      <strong>{item.title}</strong>
                      {item.timestamp && (
                        <span>{formatNotificationDate(item.timestamp)}</span>
                      )}
                    </div>
                    <p>{item.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* User Avatar & Profile Dropdown Popover */}
        <div className="topbar-popover-wrap">
          <button
            ref={profileTriggerRef}
            type="button"
            className="topbar-profile-trigger"
            aria-expanded={profileOpen}
            aria-controls={profileId}
            onClick={() =>
              togglePanel(profilePanelRef, profileTriggerRef, profileOpen, setProfileOpen)
            }
          >
            <span className="topbar-avatar" aria-hidden="true">
              {getInitials(user?.fullName)}
            </span>
            <span className="topbar-user-meta">
              <span className="topbar-user-name">{user?.fullName || 'User'}</span>
              <span className="topbar-user-role">{user?.role || 'member'}</span>
            </span>
            <ChevronDown size={15} className="topbar-chevron" aria-hidden="true" />
          </button>

          <div
            ref={profilePanelRef}
            id={profileId}
            popover={supportsPopover ? 'auto' : undefined}
            className={`topbar-popover topbar-profile-panel anchored-overlay ${
              !supportsPopover && profileOpen ? 'is-fallback-open' : ''
            }`}
          >
            <div className="topbar-profile-summary">
              <div className="topbar-avatar topbar-avatar-lg" aria-hidden="true">
                {getInitials(user?.fullName)}
              </div>
              <div className="topbar-profile-summary-text">
                <strong>{user?.fullName}</strong>
                <span>{user?.email}</span>
                <span className="topbar-role-chip">{user?.role}</span>
              </div>
            </div>

            <div className="topbar-popover-divider" />

            <div className="topbar-popover-actions">
              <Link
                to={dashboardPath}
                className="topbar-popover-item"
                onClick={() => closePanel(profilePanelRef, setProfileOpen)}
              >
                <LayoutDashboard size={16} aria-hidden="true" />
                <span>{isAdmin ? 'Admin Dashboard' : 'Student Dashboard'}</span>
              </Link>

              <Link
                to={profilePath}
                className="topbar-popover-item"
                onClick={() => closePanel(profilePanelRef, setProfileOpen)}
              >
                <UserCircle size={16} aria-hidden="true" />
                <span>My Profile</span>
              </Link>

              <button
                type="button"
                className="topbar-popover-item is-danger"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={16} aria-hidden="true" />
                <span>{loggingOut ? 'Logging out...' : 'Log Out'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
