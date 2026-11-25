import { CalendarDays } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ComingSoonCard from '../components/common/ComingSoonCard';

export default function EventsPage() {
  return (
    <>
      <PageHeader
        badge="Student Panel • Events"
        title="Campus Events Directory"
        description="Discover upcoming technical fests, workshops, cultural nights, and inter-college competitions."
      />
      <ComingSoonCard
        icon={CalendarDays}
        title="Event Discovery & Filtering"
        description="This module will display live college events fetched from MongoDB with category filters, seat availability, and instant registration."
        targetPhase="Upcoming Feature Phase"
        endpointHint="GET /api/events"
      />
    </>
  );
}
