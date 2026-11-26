import { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  Percent,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { DashboardErrorBanner, EmptyState } from '../components/common/DashboardWidgets';
import AttendanceStatusBadge from '../components/attendance/AttendanceStatusBadge';
import {
  AttendanceLineChart,
  EventAttendanceBarChart,
  PresentAbsentDoughnutChart,
} from '../components/attendance/AttendanceCharts';
import '../components/attendance/attendance.css';
import { fetchStudentAttendanceAnalytics } from '../services/attendanceService';
import { formatActivityDateTime, formatEventDate } from '../utils/dateFormat';

export default function AttendancePage() {
  const [filters, setFilters] = useState({
    eventId: 'all',
    date: '',
    status: 'all',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadMyAttendance = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchStudentAttendanceAnalytics(filters);
      setState({ loading: false, data, error: null });
    } catch (err) {
      setState({
        loading: false,
        data: null,
        error: err.message || 'Unable to load your attendance records.',
      });
    }
  }, [filters]);

  useEffect(() => {
    loadMyAttendance();
  }, [loadMyAttendance]);

  const summary = state.data?.summary || {
    totalRegistered: 0,
    eventsAttended: 0,
    eventsMissed: 0,
    attendancePercentage: 0,
  };
  const charts = state.data?.charts || {
    personalTrend: [],
    presentVsAbsent: { present: 0, absent: 0 },
    eventWiseAttendance: [],
  };
  const events = state.data?.events || [];
  const records = state.data?.records || [];

  const hasActiveFilters =
    filters.eventId !== 'all' ||
    filters.date !== '' ||
    filters.status !== 'all' ||
    searchInput.trim() !== '';

  const handleResetFilters = () => {
    setSearchInput('');
    setFilters({ eventId: 'all', date: '', status: 'all', search: '' });
  };

  return (
    <div className="att-page">
      <PageHeader
        badge="Student Panel • Attendance"
        title="My Attendance Overview"
        description="Track your personal event check-ins, overall participation rate, and timestamped attendance history."
        action={
          <button
            type="button"
            className="btn-hero-ghost"
            onClick={loadMyAttendance}
            disabled={state.loading}
          >
            <RefreshCw
              size={15}
              className={state.loading ? 'spin-icon' : ''}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>
        }
      />

      {state.error && (
        <DashboardErrorBanner message={state.error} onRetry={loadMyAttendance} />
      )}

      {/* Student Statistics Cards */}
      <section className="att-stats-grid" aria-label="Personal attendance statistics">
        <article className="att-stat-card">
          <div>
            <div className="att-stat-label">Total Events Registered</div>
            <div className="att-stat-value">
              {state.loading ? '—' : summary.totalRegistered}
            </div>
            <div className="att-stat-hint">Active registrations in scope</div>
          </div>
          <div className="att-stat-icon is-blue" aria-hidden="true">
            <CalendarDays size={21} />
          </div>
        </article>

        <article className="att-stat-card">
          <div>
            <div className="att-stat-label">Events Attended</div>
            <div className="att-stat-value">
              {state.loading ? '—' : summary.eventsAttended}
            </div>
            <div className="att-stat-hint">Verified present check-ins</div>
          </div>
          <div className="att-stat-icon is-emerald" aria-hidden="true">
            <CalendarCheck2 size={21} />
          </div>
        </article>

        <article className="att-stat-card">
          <div>
            <div className="att-stat-label">Events Missed</div>
            <div className="att-stat-value">
              {state.loading ? '—' : summary.eventsMissed}
            </div>
            <div className="att-stat-hint">Unattended or absent</div>
          </div>
          <div className="att-stat-icon is-rose" aria-hidden="true">
            <CalendarX2 size={21} />
          </div>
        </article>

        <article className="att-stat-card">
          <div>
            <div className="att-stat-label">Overall Attendance Percentage</div>
            <div className="att-stat-value">
              {state.loading ? '—' : `${summary.attendancePercentage}%`}
            </div>
            <div className="att-stat-hint">Personal attendance rate</div>
          </div>
          <div className="att-stat-icon is-purple" aria-hidden="true">
            <Percent size={21} />
          </div>
        </article>
      </section>

      {/* Personal Attendance Graphs */}
      <section className="att-charts-grid is-three" aria-label="Personal attendance charts">
        <AttendanceLineChart
          title="Personal Attendance Overview"
          subtitle="Running attendance percentage across events"
          points={charts.personalTrend}
          mode="student"
          loading={state.loading}
        />
        <PresentAbsentDoughnutChart
          title="Present vs Absent"
          subtitle="Your attended vs missed ratio"
          present={charts.presentVsAbsent?.present || 0}
          absent={charts.presentVsAbsent?.absent || 0}
          loading={state.loading}
        />
        <EventAttendanceBarChart
          title="Event-wise Attendance"
          subtitle="Attendance status by event"
          items={charts.eventWiseAttendance}
          mode="student"
          loading={state.loading}
        />
      </section>

      {/* Attendance History Table */}
      <section className="att-table-card" aria-labelledby="student-attendance-history-heading">
        <div className="att-toolbar-header">
          <div>
            <h3 id="student-attendance-history-heading" className="card-title">
              My Attendance History
            </h3>
            <p className="card-subtitle">
              Showing {records.length} personal event record{records.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="att-filters-bar" role="search" aria-label="Filter my attendance history">
          <div className="att-search-wrap">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              className="att-input"
              placeholder="Search by event name or venue..."
              aria-label="Search attendance history by event"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="att-input"
            aria-label="Filter by registered event"
            value={filters.eventId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, eventId: e.target.value }))
            }
          >
            <option value="all">All Registered Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="att-input"
            aria-label="Filter by event date"
            value={filters.date}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, date: e.target.value }))
            }
          />

          <select
            className="att-input"
            aria-label="Filter by attendance status"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="att-reset-btn"
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {state.loading ? (
          <div className="activity-skeleton-list" aria-busy="true">
            {[1, 2, 3].map((row) => (
              <div key={row} className="activity-item is-skeleton">
                <span className="skeleton-line" style={{ inlineSize: '100%' }} />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={ScanLine}
            title={
              hasActiveFilters
                ? 'No matching attendance entries'
                : 'No attendance records yet'
            }
            description={
              hasActiveFilters
                ? 'Try clearing your event, date, or status filter to view your full attendance history.'
                : 'Once you register for campus events and check in using your event pass, your attendance history will appear here.'
            }
            actionLabel={hasActiveFilters ? undefined : 'View My Passes'}
            actionTo={hasActiveFilters ? undefined : '/passes'}
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Event Name</th>
                  <th scope="col">Event Date</th>
                  <th scope="col">Check-in Time</th>
                  <th scope="col">Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.registrationId}>
                    <th scope="row">
                      <div className="att-student-cell">
                        <span className="att-student-name">{rec.eventTitle}</span>
                        <span className="att-student-sub">
                          {rec.eventCategory} • {rec.eventVenue}
                        </span>
                      </div>
                    </th>
                    <td data-label="Event Date">{formatEventDate(rec.eventDate)}</td>
                    <td data-label="Check-in Time">
                      {rec.checkInTime ? formatActivityDateTime(rec.checkInTime) : '—'}
                    </td>
                    <td data-label="Attendance Status">
                      <AttendanceStatusBadge status={rec.attendanceStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
