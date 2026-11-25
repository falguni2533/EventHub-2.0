import { Ticket } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ComingSoonCard from '../components/common/ComingSoonCard';

export default function MyPassesPage() {
  return (
    <>
      <PageHeader
        badge="Student Panel • My Passes"
        title="Digital Event Passes"
        description="Access verified QR passes for rapid check-in at auditoriums, labs, and fest venues."
      />
      <ComingSoonCard
        icon={Ticket}
        title="QR Entry Passes"
        description="Your personalized event passes and venue details will be generated automatically after event registration."
        targetPhase="Upcoming Feature Phase"
        endpointHint="GET /api/passes/my"
      />
    </>
  );
}
