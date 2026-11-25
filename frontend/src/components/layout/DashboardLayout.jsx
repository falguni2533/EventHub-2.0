import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getNavItemsForRole } from '../../config/navigation';
import { checkBackendHealth } from '../../services/healthService';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_COLLAPSE_KEY = 'eventhub_sidebar_collapsed';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [notifications, setNotifications] = useState([]);
  const [healthState, setHealthState] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const openNotificationsRef = useRef(null);

  const location = useLocation();
  const navItems = getNavItemsForRole(user?.role);
  const activeRoute =
    navItems.find((item) => item.path === location.pathname) || navItems[0];
  const breadcrumbSection =
    user?.role === 'admin' ? 'Admin Portal' : 'Student Portal';

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next));
      } catch {
        // Ignore storage errors in restricted environments
      }
      return next;
    });
  }, []);

  const refreshHealth = useCallback(async () => {
    setHealthState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await checkBackendHealth();
      setHealthState({ loading: false, data, error: null });
    } catch (err) {
      setHealthState({
        loading: false,
        data: null,
        error: err.message || 'Unable to connect to backend API',
      });
    }
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const openNotifications = useCallback(() => {
    openNotificationsRef.current?.();
  }, []);

  const registerNotificationOpener = useCallback((fn) => {
    openNotificationsRef.current = fn;
  }, []);

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="workspace-column">
        <Topbar
          title={activeRoute.label}
          breadcrumbSection={breadcrumbSection}
          isMenuOpen={sidebarOpen}
          onMenuOpen={() => setSidebarOpen(true)}
          healthState={healthState}
          notifications={notifications}
          onNotificationRef={registerNotificationOpener}
        />

        <main className="main-content">
          <Outlet
            context={{
              healthState,
              refreshHealth,
              setNotifications,
              openNotifications,
            }}
          />
        </main>
      </div>
    </div>
  );
}
