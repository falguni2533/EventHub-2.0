import { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  History,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { DashboardErrorBanner, EmptyState } from '../components/common/DashboardWidgets';
import PassCard from '../components/passes/PassCard';
import PassPreviewModal from '../components/passes/PassPreviewModal';
import { fetchMyPasses } from '../services/passService';

export default function MyPassesPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });
  const [selectedPass, setSelectedPass] = useState(null);

  const loadPasses = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchMyPasses();
      setState({ loading: false, data, error: null });
    } catch (err) {
      setState({
        loading: false,
        data: null,
        error: err.message || 'Unable to load your digital event passes.',
      });
    }
  }, []);

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  const { loading, data, error } = state;
  const upcomingPasses = data?.upcoming || [];
  const pastPasses = data?.past || [];
  const counts = data?.counts || {
    total: 0,
    upcoming: 0,
    past: 0,
    valid: 0,
    checkedIn: 0,
    attended: 0,
  };

  const displayedPasses = activeTab === 'upcoming' ? upcomingPasses : pastPasses;

  return (
    <>
      <PageHeader
        badge="Student Panel • My Passes"
        title="Digital Event Passes"
        description="Access your unique QR-based entry passes for upcoming registered events and review historical event passes."
        action={
          <button
            type="button"
            className="btn-hero-ghost"
            onClick={loadPasses}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} aria-hidden="true" />
            <span>Refresh Passes</span>
          </button>
        }
      />

      {error && <DashboardErrorBanner message={error} onRetry={loadPasses} />}

      <section className="stats-grid" aria-label="Pass summary">
        <StatCard
          label="Total Registrations"
          value={counts.total}
          hint="All registered events with pass records"
          icon={Ticket}
          loading={loading}
        />
        <StatCard
          label="Upcoming Active"
          value={counts.valid}
          hint="Valid QR passes ready for entry"
          icon={CalendarClock}
          loading={loading}
        />
        <StatCard
          label="Checked In"
          value={counts.checkedIn}
          hint="Live venue check-ins recorded"
          icon={CalendarCheck2}
          loading={loading}
        />
        <StatCard
          label="Completed Attended"
          value={counts.attended}
          hint="Past events with verified attendance"
          icon={CheckCircle2}
          loading={loading}
        />
      </section>

      <section className="card" aria-label="Event pass tabs">
        <div className="card-header">
          <div className="eh-tabs" role="tablist" aria-label="Filter passes by event timeline">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'upcoming'}
              className={`eh-tab-btn ${activeTab === 'upcoming' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              <CalendarClock size={15} aria-hidden="true" />
              <span>Upcoming Events ({upcomingPasses.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'past'}
              className={`eh-tab-btn ${activeTab === 'past' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              <History size={15} aria-hidden="true" />
              <span>Past Events ({pastPasses.length})</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="pass-grid" aria-busy="true">
            {[1, 2, 3].map((item) => (
              <div key={item} className="card pass-card">
                <span className="skeleton-line" style={{ inlineSize: '40%' }} />
                <span className="skeleton-line" style={{ inlineSize: '78%', marginBlockStart: '0.75rem' }} />
                <span className="skeleton-line" style={{ inlineSize: '60%', marginBlockStart: '0.5rem' }} />
              </div>
            ))}
          </div>
        ) : displayedPasses.length === 0 ? (
          <EmptyState
            icon={activeTab === 'upcoming' ? Ticket : History}
            title={
              activeTab === 'upcoming'
                ? 'No upcoming event passes'
                : 'No past event passes yet'
            }
            description={
              activeTab === 'upcoming'
                ? 'When you register for upcoming campus events, your QR-based digital passes will appear here.'
                : 'Completed, attended, missed, and past event passes are retained here as historical records.'
            }
            actionLabel={activeTab === 'upcoming' ? 'Explore Events' : undefined}
            actionTo={activeTab === 'upcoming' ? '/events' : undefined}
          />
        ) : (
          <div className="pass-grid">
            {displayedPasses.map((pass) => (
              <PassCard
                key={pass.registrationId}
                pass={pass}
                onViewPass={(item) => setSelectedPass(item)}
              />
            ))}
          </div>
        )}
      </section>

      {selectedPass && (
        <PassPreviewModal pass={selectedPass} onClose={() => setSelectedPass(null)} />
      )}
    </>
  );
}
