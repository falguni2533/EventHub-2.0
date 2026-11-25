import { ClipboardCheck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ComingSoonCard from '../components/common/ComingSoonCard';

export default function RegistrationsPage() {
  return (
    <>
      <PageHeader
        badge="Student Panel • Registrations"
        title="My Event Registrations"
        description="Review your submitted registrations, confirmation status, and payment or approval updates."
      />
      <ComingSoonCard
        icon={ClipboardCheck}
        title="Registration Tracker"
        description="Once student authentication is active in Phase 1, your registered solo and team events will appear here."
        targetPhase="Upcoming Feature Phase"
        endpointHint="GET /api/registrations/my"
      />
    </>
  );
}
