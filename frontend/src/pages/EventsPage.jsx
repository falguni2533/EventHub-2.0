import { getUpcomingEvents } from '../services/eventService';
import { fetchMyProfile } from '../services/profileService';
import { getRecommendedEvents } from '../services/recommendationService';
import { useEffect, useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import EventFilters from '../components/events/EventFilters';
import EventCard from '../components/events/EventCard';
import EventSkeleton from '../components/events/EventSkeleton';
import EventDetailsModal from '../components/events/EventDetailsModal';
import '../components/events/events.css';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommended, setRecommended] = useState([]);

  const fetchEvents = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getUpcomingEvents();
      setEvents(data);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Load events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchMyProfile();
        setProfile(data);
      } catch (e) {
        console.error('Failed to fetch profile', e);
      }
    };
    loadProfile();
  }, []);

  // Compute recommended events when both events and profile are available
  useEffect(() => {
    if (profile && events.length) {
      const recs = getRecommendedEvents(events, profile);
      setRecommended(recs);
    }
  }, [profile, events]);

  // Apply filters for search/category
  useEffect(() => {
    let list = events;
    if (category !== 'All') {
      list = list.filter((e) => e.category === category);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (e) => e.title.toLowerCase().includes(term) || e.venue.toLowerCase().includes(term)
      );
    }
    setFiltered(list);
  }, [events, search, category]);

  const handleRetry = () => {
    fetchEvents();
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
  };

  return (
    <>
      <PageHeader
        badge="Student Panel • Events"
        title="Campus Events Directory"
        description="Discover upcoming technical fests, workshops, cultural nights, and inter-college competitions."
      />
      {/* Recommended Section */}
      {profile && recommended.length > 0 && (
        <section className="recommended-section">
          <h2>Recommended for You</h2>
          <div className="eh-events-grid">
            {recommended.map((event) => (
              <EventCard key={event.id} event={event} onViewDetails={() => setSelected(event)} />
            ))}
          </div>
        </section>
      )}
      {/* Prompt to complete profile if missing */}
      {profile === null && (
        <div className="eh-events-empty">
          <p>Please complete your profile to see personalized event recommendations.</p>
        </div>
      )}
      <section className="main-content">
        <EventFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
        />
        <div className="eh-events-count">Showing {filtered.length} events</div>
        {loading && (
          <div className="eh-events-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventSkeleton key={i} />
            ))}
          </div>
        )}
        {error && (
          <div className="eh-events-error">
            <p>Failed to load events.</p>
            <button className="btn-primary" onClick={handleRetry}>Retry</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="eh-events-empty">
            <p>No upcoming events found.</p>
            {(search || category !== 'All') && (
              <button className="btn-secondary" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="eh-events-grid">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} onViewDetails={() => setSelected(event)} />
            ))}
          </div>
        )}
      </section>
      {selected && (
        <EventDetailsModal event={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
