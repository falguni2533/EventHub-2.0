import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Percent,
  QrCode,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { DashboardErrorBanner, EmptyState } from '../../components/common/DashboardWidgets';
import AttendanceStatusBadge from '../../components/attendance/AttendanceStatusBadge';
import {
  AttendanceLineChart,
  EventAttendanceBarChart,
  PresentAbsentDoughnutChart,
  WeeklyTrendsChart,
} from '../../components/attendance/AttendanceCharts';
import '../../components/attendance/attendance.css';
import { fetchAdminAttendanceAnalytics } from '../../services/attendanceService';
import { formatActivityDateTime, formatEventDate } from '../../utils/dateFormat';

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function AdminAttendancePage() {
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

  // Debounce student name/ID search so typing smoothly refreshes stats, charts, and table
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
    }, 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadAttendance = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchAdminAttendanceAnalytics(filters);
      setState({ loading: false, data, error: null });
    } catch (err) {
      setState({
        loading: false,
        data: null,
        error: err.message || 'Failed to load Admin Attendance Analytics.',
      });
    }
  }, [filters]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const summary = state.data?.summary || {
    totalStudents: 0,
    totalRecords: 0,
    presentStudents: 0,
    absentStudents: 0,
    attendancePercentage: 0,
  };
  const charts = state.data?.charts || {
    attendanceTrend: [],
    presentVsAbsent: { present: 0, absent: 0 },
    eventWiseAttendance: [],
    weeklyTrends: [],
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

  const handleExportCsv = () => {
    if (records.length === 0) return;

    const headers = [
      'Student Name',
      'Student ID',
      'College',
      'Event Name',
      'Event Date',
      'Check-in Time',
      'Attendance Status',
    ];
    const rows = records.map((rec) =>
      [
        escapeCsv(rec.studentName),
        escapeCsv(rec.studentId),
        escapeCsv(rec.collegeName),
        escapeCsv(rec.eventTitle),
        escapeCsv(formatEventDate(rec.eventDate)),
        escapeCsv(rec.checkInTime ? new Date(rec.checkInTime).toLocaleString() : '—'),
        escapeCsv(rec.attendanceStatus),
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'eventhub_attendance_records.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="att-page">
      <PageHeader
        badge="Admin Panel • Attendance Analytics"
        title="Attendance Management & Analytics"
        description="Monitor real-time campus attendance across events, analyze participation trends, filter student check-ins, and export verified logs."
        action={
          <div className="att-toolbar-actions">
            <Link to="/admin/verify" className="btn-hero-solid">
              <QrCode size={15} aria-hidden="true" />
              <span>QR Check-In Desk</span>
            </Link>
            <button
              type="button"
              className="btn-hero-ghost"
              onClick={loadAttendance}
              disabled={state.loading}
            >
              <RefreshCw
                size={15}
                className={state.loading ? 'spin-icon' : ''}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {state.error && (
        <DashboardErrorBanner message={state.error} onRetry={loadAttendance} />
      )}

      {/* Top Statistics Cards */}
      <section className="att-stats-grid" aria-label="Admin attendance statistics">
        <article className="att-stat-card">
          <div>
            <div className="att-stat-label">Total Students</div>
            <div className="att-stat-value">
              {state.loading ? '—' : summary.totalStudents}
            </div>
            <div className="att-stat-hint">
              Across {summary.totalRecords} registration record(s)
            </div>
          </div>
          <div className="att-stat-icon is-indigo" aria-hidden="true">
            <Users size={21} />
          </div>
        </article>

        <article className="att-stat-card">
          <div>
            <div className="att-stat-label">Present Students</div>
            <div className="att-stat-value">
              {state.loading ? '—' : summary.presentStudents}
            </div>
            <div className="att-stat-hint">Verified check-ins recorded</div>
          </div>
          <div className="att-stat-icon is-emerald" aria-hidden="true">
            <CheckCircle2 size={21} />
          </div>
        </article>

        <article className="att-stat-card">
          <div>
            <div className="att-stat-label">Absent Students</div>
            <div className="att-stat-value">
              {state.loading ? '—' : summary.absentStudents}
            </div>
            <div className="att-stat-hint">Unchecked or marked absent</div>
          </div>
          <div className="att-stat-icon is-rose" aria-hidden="true">
            <XCircle size={21} />
          </div>
        </article>

        <article className="att-stat-card">
          <div>
            <div className="att-stat-label">Attendance Percentage</div>
            <div className="att-stat-value">
              {state.loading ? '—' : `${summary.attendancePercentage}%`}
            </div>
            <div className="att-stat-hint">Present out of filtered records</div>
          </div>
          <div className="att-stat-icon is-purple" aria-hidden="true">
            <Percent size={21} />
          </div>
        </article>
      </section>

      {/* Graphs & Analytics */}
      <section className="att-charts-grid" aria-label="Attendance analytics charts">
        <AttendanceLineChart
          title="Attendance Overview"
          subtitle="Present vs absent trend over time"
          points={charts.attendanceTrend}
          mode="admin"
          loading={state.loading}
        />
        <PresentAbsentDoughnutChart
          title="Present vs Absent"
          subtitle="Share of checked-in vs absent records"
          present={charts.presentVsAbsent?.present || 0}
          absent={charts.presentVsAbsent?.absent || 0}
          loading={state.loading}
        />
        <EventAttendanceBarChart
          title="Event-wise Attendance"
          subtitle="Comparison across campus events"
          items={charts.eventWiseAttendance}
          mode="admin"
          loading={state.loading}
        />
        <WeeklyTrendsChart
          title="Weekly Attendance Trends"
          subtitle="Weekly participation percentage"
          weeks={charts.weeklyTrends}
          loading={state.loading}
        />
      </section>

      {/* Attendance Management Table */}
      <section className="att-table-card" aria-labelledby="admin-attendance-table-heading">
        <div className="att-toolbar-header">
          <div>
            <h3 id="admin-attendance-table-heading" className="card-title">
              Attendance Records
            </h3>
            <p className="card-subtitle">
              Showing {records.length} record{records.length === 1 ? '' : 's'} from MongoDB
            </p>
          </div>

          <div className="att-toolbar-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportCsv}
              disabled={records.length === 0 || state.loading}
            >
              <Download size={15} aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="att-filters-bar" role="search" aria-label="Filter attendance records">
          <div className="att-search-wrap">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              className="att-input"
              placeholder="Search student name or student ID..."
              aria-label="Search students by name or ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="att-input"
            aria-label="Filter by event"
            value={filters.eventId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, eventId: e.target.value }))
            }
          >
            <option value="all">All Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="att-input"
            aria-label="Filter by date"
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
            {[1, 2, 3, 4].map((row) => (
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
                ? 'No matching attendance records'
                : 'No attendance records available yet'
            }
            description={
              hasActiveFilters
                ? 'No student check-ins match your selected event, date, status, or search query.'
                : 'Attendance logs and analytics will appear here once students register and check in at events.'
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Student Name</th>
                  <th scope="col">Student ID</th>
                  <th scope="col">Event Name</th>
                  <th scope="col">Date</th>
                  <th scope="col">Check-in Time</th>
                  <th scope="col">Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.registrationId}>
                    <th scope="row">
                      <div className="att-student-cell">
                        <span className="att-student-name">{rec.studentName}</span>
                        <span className="att-student-sub">{rec.collegeName}</span>
                      </div>
                    </th>
                    <td data-label="Student ID">
                      <code className="att-code-chip">{rec.studentId}</code>
                    </td>
                    <td data-label="Event Name">
                      <div className="att-student-cell">
                        <span className="att-student-name">{rec.eventTitle}</span>
                        <span className="att-student-sub">{rec.eventCategory}</span>
                      </div>
                    </td>
                    <td data-label="Date">{formatEventDate(rec.eventDate)}</td>
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
