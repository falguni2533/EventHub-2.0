import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CalendarCog,
  ClipboardList,
  ScanLine,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import SystemStatusCard from '../../components/common/SystemStatusCard';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminDashboard } from '../../services/authService';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { healthState, refreshHealth } = useOutletContext();
  const [adminStatus, setAdminStatus] = useState({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const loadAdminOverview = async () => {
      try {
        const data = await fetchAdminDashboard();
        if (active) setAdminStatus({ loading: false, data, error: null });
      } catch (err) {
        if (active) {
          setAdminStatus({
            loading: false,
            data: null,
            error: err.message || 'Failed to verify admin access',
          });
        }
      }
    };
    loadAdminOverview();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        badge="Admin Panel • Role-Protected Workspace"
        title={`Welcome, ${user?.fullName || 'Administrator'}`}
        description="Manage EventHub campus operations from your dedicated Admin Dashboard. Administrative endpoints are protected by JWT verification and strict role checks."
      />

      <section className="stats-grid" aria-label="Administrative module readiness">
        <StatCard
          label="Event Management"
          value="Phase 2+"
          hint="Create and publish campus events"
          icon={CalendarCog}
        />
        <StatCard
          label="Student Registrations"
          value="Phase 2+"
          hint="Review approvals and waitlists"
          icon={ClipboardList}
        />
        <StatCard
          label="Attendance Desk"
          value="Phase 3+"
          hint="QR check-in verification"
          icon={ScanLine}
        />
        <StatCard
          label="RBAC Verification"
          value={adminStatus.loading ? 'Checking...' : adminStatus.error ? 'Blocked' : 'Verified'}
          hint="Protected /api/admin/dashboard"
          icon={ShieldCheck}
        />
      </section>

      <div className="two-col-grid">
        <SystemStatusCard
          healthState={healthState}
          onRefresh={refreshHealth}
        />

        <section className="card" aria-labelledby="admin-rbac-heading">
          <div className="card-header">
            <div>
              <h3 id="admin-rbac-heading" className="card-title">
                Admin Security &amp; Capabilities
              </h3>
              <p className="card-subtitle">
                Live authorization status from <code>GET /api/admin/dashboard</code>
              </p>
            </div>
          </div>

          {adminStatus.error ? (
            <div className="pill-badge is-err">{adminStatus.error}</div>
          ) : (
            <ul className="checklist">
              {(adminStatus.data?.capabilities || []).map((capability) => (
                <li key={capability} className="checklist-item">
                  <UserCheck
                    size={18}
                    color="#6d28d9"
                    style={{ flexShrink: 0, marginTop: 2 }}
                    aria-hidden="true"
                  />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
