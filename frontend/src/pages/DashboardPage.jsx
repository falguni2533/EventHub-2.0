import { Link, useOutletContext } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Rocket,
  Ticket,
  Users,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import SystemStatusCard from '../components/common/SystemStatusCard';

const PHASE_READINESS = [
  {
    title: 'Modular Backend Architecture',
    detail: 'Express, CORS, JSON parsing, centralized error handler, and Mongoose config.',
  },
  {
    title: 'Student Panel Routing',
    detail: '7 dedicated routes ready for Dashboard, Events, Registrations, Passes, Team, Attendance, and Profile.',
  },
  {
    title: 'Axios API Client',
    detail: 'Configured base URL and interceptors ready for JWT authorization in Phase 1.',
  },
];

export default function DashboardPage() {
  const { healthState, refreshHealth } = useOutletContext();

  return (
    <>
      <PageHeader
        badge="Phase 0 • Project Foundation Ready"
        title="Welcome to EventHub Student Portal"
        description="Your unified college event workspace for discovering campus fests, managing team registrations, accessing entry passes, and tracking attendance."
        action={
          <Link to="/events" className="btn-primary">
            <Rocket size={16} />
            <span>Explore Events</span>
          </Link>
        }
      />

      <section className="stats-grid" aria-label="Student summary metrics">
        <StatCard
          label="Campus Events"
          value="Phase 2+"
          hint="Live event catalog coming soon"
          icon={CalendarDays}
        />
        <StatCard
          label="My Registrations"
          value="0"
          hint="Sign in will unlock in Phase 1"
          icon={ClipboardCheck}
        />
        <StatCard
          label="Active Passes"
          value="0"
          hint="Digital QR passes appear here"
          icon={Ticket}
        />
        <StatCard
          label="Team Invites"
          value="0"
          hint="Collaborate with teammates"
          icon={Users}
        />
      </section>

      <div className="two-col-grid">
        <SystemStatusCard
          healthState={healthState}
          onRefresh={refreshHealth}
        />

        <section className="card" aria-labelledby="readiness-heading">
          <div className="card-header">
            <div>
              <h3 id="readiness-heading" className="card-title">
                Phase 1 Readiness Checklist
              </h3>
              <p className="card-subtitle">
                Prepared for Authentication, Signup, Login &amp; Profile Completion
              </p>
            </div>
          </div>

          <ul className="checklist">
            {PHASE_READINESS.map((item) => (
              <li key={item.title} className="checklist-item">
                <CheckCircle2
                  size={18}
                  color="#6d28d9"
                  style={{ flexShrink: 0, marginTop: 2 }}
                  aria-hidden="true"
                />
                <div>
                  <strong>{item.title}:</strong> {item.detail}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
