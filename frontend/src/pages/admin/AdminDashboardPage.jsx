import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarCog,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  IdCard,
  ScanLine,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import {
  ActivityFeed,
  DashboardErrorBanner,
  EmptyState,
  QuickActionsCard,
} from '../../components/common/DashboardWidgets';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminDashboard } from '../../services/authService';
import { formatEventDate, getTimeGreeting } from '../../utils/dateFormat';

const ADMIN_QUICK_ACTIONS = [
  {
    label: 'Manage Events',
    hint: 'Schedule & publish events',
    to: '/admin/events',
    icon: CalendarCog,
  },
  {
    label: 'View Registrations',
    hint: 'Review student sign-ups',
    to: '/admin/registrations',
    icon: ClipboardList,
  },
  {
    label: 'Manage Attendance',
    hint: 'Check-ins & verification',
    to: '/admin/attendance',
    icon: ScanLine,
  },
  {
    label: 'View Students',
    hint: 'Registered campus roster',
    to: '/admin/students',
    icon: GraduationCap,
  },
];

const STATUS_BADGE_MAP = {
  confirmed: 'is-ok',
  present: 'is-ok',
  pending: 'is-warn',
  waitlisted: 'is-warn',
  cancelled: 'is-err',
  absent: 'is-err',
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { setNotifications, openNotifications } = useOutletContext();
  const [adminState, setAdminState] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const loadAdminDashboard = useCallback(async () => {
    setAdminState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchAdminDashboard();
      setAdminState({ loading: false, data, error: null });
      setNotifications?.(data.notifications || []);
    } catch (err) {
      setAdminState({
        loading: false,
        data: null,
        error: err.message || 'Failed to load Admin Dashboard data.',
      });
    }
  }, [setNotifications]);

  useEffect(() => {
    loadAdminDashboard();
    return () => setNotifications?.([]);
  }, [loadAdminDashboard, setNotifications]);

  const { loading, data, error } = adminState;
  const stats = data?.stats;
  const recentRegistrations = data?.recentRegistrations || [];
  const recentActivity = data?.recentActivity || [];
  const notificationsCount = data?.notifications?.length || 0;

  const attendanceOverview = stats?.attendanceOverview;
  const attendanceValue =
    attendanceOverview?.rate !== null && attendanceOverview?.rate !== undefined
      ? `${attendanceOverview.rate}%`
      : attendanceOverview?.present ?? 0;
  const attendanceHint =
    attendanceOverview?.totalMarked > 0
      ? `${attendanceOverview.present} present • ${attendanceOverview.totalMarked} marked`
      : 'No check-ins recorded yet';

  return (
    <>
      {/* Admin Welcome Hero */}
      <section className="cosmic-hero" aria-label="Administrator welcome">
        <div className="cosmic-hero-content">
          <div className="cosmic-hero-badge">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Admin Control Center</span>
          </div>

          <h2>
            {getTimeGreeting()}, {user?.fullName || 'Administrator'}
          </h2>
          <p>
            Monitor student enrollment, campus events, registrations, and
            attendance insights from your role-protected Admin Dashboard.
          </p>

          <div className="hero-meta-chips">
            <span className="hero-meta-chip">
              <Building2 size={14} aria-hidden="true" />
              <span>{user?.collegeName || 'Central Administration'}</span>
            </span>
            <span className="hero-meta-chip">
              <IdCard size={14} aria-hidden="true" />
              <span>Staff ID: {user?.studentId || '—'}</span>
            </span>
          </div>
        </div>

        <div className="cosmic-hero-actions">
          <button
            type="button"
            className="btn-hero-ghost"
            onClick={openNotifications}
          >
            <Bell size={16} aria-hidden="true" />
            <span>
              Notifications{notificationsCount > 0 ? ` (${notificationsCount})` : ''}
            </span>
          </button>
          <Link to="/admin/profile" className="btn-hero-solid">
            <UserCircle size={16} aria-hidden="true" />
            <span>My Profile</span>
          </Link>
        </div>
      </section>

      {error && (
        <DashboardErrorBanner message={error} onRetry={loadAdminDashboard} />
      )}

      {/* Admin Statistics Cards */}
      <section className="stats-grid" aria-label="Administrative statistics">
        <StatCard
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          hint="Verified student accounts in MongoDB"
          icon={GraduationCap}
          loading={loading}
        />
        <StatCard
          label="Total Events"
          value={stats?.totalEvents ?? 0}
          hint={
            (stats?.upcomingEvents ?? 0) > 0
              ? `${stats.upcomingEvents} upcoming published`
              : 'Events appear once created'
          }
          icon={CalendarDays}
          loading={loading}
        />
        <StatCard
          label="Total Registrations"
          value={stats?.totalRegistrations ?? 0}
          hint={
            (stats?.totalRegistrations ?? 0) > 0
              ? 'Active student registrations'
              : 'No registrations submitted yet'
          }
          icon={ClipboardCheck}
          loading={loading}
        />
        <StatCard
          label="Attendance Overview"
          value={attendanceValue}
          hint={attendanceHint}
          icon={ScanLine}
          loading={loading}
        />
      </section>

      {/* Recent Registrations + Recent Activity */}
      <div className="dashboard-main-grid">
        <section className="card" aria-labelledby="recent-registrations-heading">
          <div className="card-header">
            <div>
              <h3 id="recent-registrations-heading" className="card-title">
                Recent Registrations
              </h3>
              <p className="card-subtitle">
                Latest student event sign-ups stored in MongoDB
              </p>
            </div>
            <Link to="/admin/registrations" className="btn-secondary">
              <span>View All</span>
            </Link>
          </div>

          {loading ? (
            <div className="activity-skeleton-list" aria-busy="true">
              {[1, 2, 3].map((row) => (
                <div key={row} className="activity-item is-skeleton">
                  <span className="skeleton-line" style={{ inlineSize: '100%' }} />
                </div>
              ))}
            </div>
          ) : recentRegistrations.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No registrations recorded yet"
              description="Student names, event titles, dates, and approval statuses will populate here as soon as students register for events."
              actionLabel="Open Registrations Module"
              actionTo="/admin/registrations"
            />
          ) : (
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="recent-registrations-heading"
              className="table-wrapper"
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Event</th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((reg) => (
                    <tr key={reg.id}>
                      <th scope="row">
                        <div className="table-primary-text">{reg.studentName}</div>
                        <div className="table-secondary-text">{reg.studentId}</div>
                      </th>
                      <td data-label="Event">
                        <div className="table-primary-text">{reg.eventName}</div>
                        <div className="table-secondary-text">{reg.eventCategory}</div>
                      </td>
                      <td data-label="Date">
                        {formatEventDate(reg.registeredAt)}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`pill-badge status-pill ${
                            STATUS_BADGE_MAP[reg.status] || ''
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ActivityFeed
          title="Recent Activity"
          subtitle="Live administrative and student account events"
          items={recentActivity}
          loading={loading}
          emptyTitle="No administrative activity yet"
          emptyDescription="New student sign-ups, event launches, and registration updates will appear here automatically."
        />
      </div>

      <QuickActionsCard
        title="Quick Actions"
        subtitle="Navigate to administrative tools"
        actions={ADMIN_QUICK_ACTIONS}
      />
    </>
  );
}
