import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getNavItemsForRole } from '../../config/navigation';
import { checkBackendHealth } from '../../services/healthService';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [healthState, setHealthState] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const location = useLocation();
  const navItems = getNavItemsForRole(user?.role);
  const activeRoute =
    navItems.find((item) => item.path === location.pathname) || navItems[0];

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

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="workspace-column">
        <Topbar
          title={activeRoute.label}
          subtitle={activeRoute.description}
          isMenuOpen={sidebarOpen}
          onMenuOpen={() => setSidebarOpen(true)}
          healthState={healthState}
        />

        <main className="main-content">
          <Outlet context={{ healthState, refreshHealth }} />
        </main>
      </div>
    </div>
  );
}
