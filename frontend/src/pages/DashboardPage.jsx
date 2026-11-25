
import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Compass,
  IdCard,
  MapPin,
  ScanLine,
  Sparkles,
  Ticket,
  UserCircle,
  Users,
} from 'lucide-react';

import StatCard from '../components/common/StatCard';
import {
  ActivityFeed,
  DashboardErrorBanner,
  EmptyState,
  QuickActionsCard,
} from '../components/common/DashboardWidgets';

import { useAuth } from '../context/AuthContext';
import { fetchStudentDashboard } from '../services/authService';

import {
  formatEventDate,
  formatEventTime,
  getTimeGreeting,
} from '../utils/dateFormat';

const STUDENT_QUICK_ACTIONS = [
  {
    label: 'Explore Events',
    hint: 'Browse fests & workshops',
    to: '/events',
    icon: Compass,
  },
  {
    label: 'My Registrations',
    hint: 'Check sign-up status',
    to: '/registrations',
    icon: ClipboardCheck,
  },
  {
    label: 'My Passes',
    hint: 'Digital QR entry passes',
    to: '/passes',
    icon: Ticket,
  },
  {
    label: 'My Team',
    hint: 'Manage team rosters',
    to: '/team',
    icon: Users,
  },
  {
    label: 'My Profile',
    hint: 'College & student ID',
    to: '/profile',
    icon: UserCircle,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { setNotifications } = useOutletContext();

  const [dashboardState, setDashboardState] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const loadDashboard = useCallback(async () => {
    setDashboardState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const data = await fetchStudentDashboard();

      setDashboardState({
        loading: false,
        data,
        error: null,
      });

      setNotifications?.(data.notifications || []);
    } catch (err) {
      setDashboardState({
        loading: false,
        data: null,
        error:
          err.message ||
          'Could not retrieve student dashboard metrics.',
      });
    }
  }, [setNotifications]);

  useEffect(() => {
    loadDashboard();

    return () => setNotifications?.([]);
  }, [loadDashboard, setNotifications]);

  const { loading, data, error } = dashboardState;

  const stats = data?.stats;
  const upcomingEvents = data?.upcomingEvents || [];
  const recentActivity = data?.recentActivity || [];

  const firstName =
    user?.fullName?.split(/\s+/)[0] || 'Student';

  const attendanceValue =
    stats?.attendance?.rate !== null &&
    stats?.attendance?.rate !== undefined
      ? `${stats.attendance.rate}%`
      : stats?.attendance?.attended ?? 0;

  const attendanceHint =
    stats?.attendance?.totalMarked > 0
      ? `${stats.attendance.attended} of ${stats.attendance.totalMarked} sessions present`
      : 'No check-ins recorded yet';

  return (
    <>
      {/* Welcome Hero Section */}
      <section
        className="cosmic-hero"
        aria-label="Student welcome"
      >
        <div className="cosmic-hero-content">
          <div className="cosmic-hero-badge">
            <Sparkles size={14} aria-hidden="true" />
            <span>Student Portal</span>
          </div>

          <h2>
            {getTimeGreeting()}, {user?.fullName || firstName}
          </h2>

          <p>
            Track upcoming campus events, review your registrations,
            and access your passes from one unified student workspace.
          </p>

          <div className="hero-meta-chips">
            <span className="hero-meta-chip">
              <Building2 size={14} aria-hidden="true" />
              <span>
                {user?.collegeName || 'Campus Member'}
              </span>
            </span>

            <span className="hero-meta-chip">
              <IdCard size={14} aria-hidden="true" />
              <span>
                ID: {user?.studentId || '—'}
              </span>
            </span>
          </div>
        </div>

        <div className="cosmic-hero-actions">
          <Link to="/profile" className="btn-hero-ghost">
            <UserCircle size={16} aria-hidden="true" />
            <span>My Profile</span>
          </Link>

          <Link to="/events" className="btn-hero-solid">
            <Compass size={16} aria-hidden="true" />
            <span>Explore Events</span>
          </Link>
        </div>
      </section>

      {/* Dashboard Error */}
      {error && (
        <DashboardErrorBanner
          message={error}
          onRetry={loadDashboard}
        />
      )}

      {/* Student Summary Metrics */}
      <section
        className="stats-grid"
        aria-label="Student summary metrics"
      >
        <StatCard
          label="Upcoming Events"
          value={stats?.upcomingEvents ?? 0}
          hint={
            (stats?.upcomingEvents ?? 0) > 0
              ? 'Published campus events open ahead'
              : 'No published events scheduled yet'
          }
          icon={CalendarDays}
          loading={loading}
        />

        <StatCard
          label="My Registrations"
          value={stats?.myRegistrations ?? 0}
          hint={
            (stats?.myRegistrations ?? 0) > 0
              ? 'Active event registrations'
              : 'Join an event to see registrations'
          }
          icon={ClipboardCheck}
          loading={loading}
        />

        <StatCard
          label="My Passes"
          value={stats?.myPasses ?? 0}
          hint={
            (stats?.myPasses ?? 0) > 0
              ? 'Issued digital QR passes'
              : 'Passes appear after confirmation'
          }
          icon={Ticket}
          loading={loading}
        />

        <StatCard
          label="Attendance"
          value={attendanceValue}
          hint={attendanceHint}
          icon={ScanLine}
          loading={loading}
        />
      </section>

      {/* Upcoming Events + Recent Activity */}
      <div className="dashboard-main-grid">
        <section
          className="card"
          aria-labelledby="upcoming-events-heading"
        >
          <div className="card-header">
            <div>
              <h3
                id="upcoming-events-heading"
                className="card-title"
              >
                Upcoming Events
              </h3>

              <p className="card-subtitle">
                Live published events fetched from MongoDB
              </p>
            </div>

            <Link to="/events" className="btn-secondary">
              <span>View All Events</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="events-grid" aria-busy="true">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="event-card is-skeleton"
                >
                  <span
                    className="skeleton-line"
                    style={{ inlineSize: '36%' }}
                  />

                  <span
                    className="skeleton-line"
                    style={{ inlineSize: '75%' }}
                  />

                  <span
                    className="skeleton-line"
                    style={{ inlineSize: '55%' }}
                  />
                </div>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming events yet"
              description="Campus events published by organizers will appear here with dates, categories, and venue details."
              actionLabel="Go to Explore Events"
              actionTo="/events"
            />
          ) : (
            <div className="events-grid">
              {upcomingEvents.map((event) => (
                <article
                  key={event.id}
                  className="event-card"
                >
                  <div className="event-card-top">
                    <span className="event-category-pill">
                      {event.category}
                    </span>

                    <span className="event-date-tag">
                      {formatEventDate(event.date)}
                    </span>
                  </div>

                  <h4 className="event-card-title">
                    {event.title}
                  </h4>

                  {event.description && (
                    <p className="event-card-desc">
                      {event.description}
                    </p>
                  )}

                  <div className="event-card-meta">
                    <span>
                      <MapPin size={13} aria-hidden="true" />
                      <span>
                        {event.venue || 'Campus Venue'}
                      </span>
                    </span>

                    {event.date && (
                      <span>
                        <CalendarDays
                          size={13}
                          aria-hidden="true"
                        />
                        <span>
                          {formatEventTime(event.date)}
                        </span>
                      </span>
                    )}

                    {event.capacity ? (
                      <span>
                        <Users size={13} aria-hidden="true" />
                        <span>
                          {event.capacity} seats
                        </span>
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <ActivityFeed
          title="Recent Activity"
          subtitle="Your latest registrations, passes, and check-ins"
          items={recentActivity}
          loading={loading}
          emptyTitle="No student activity recorded yet"
          emptyDescription="Once you register for events, receive passes, or check in at venues, your timeline will appear here."
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsCard
        title="Quick Actions"
        subtitle="Jump directly to key student modules"
        actions={STUDENT_QUICK_ACTIONS}
      />
    </>
  );
}
