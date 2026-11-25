import { ClipboardCheck } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ComingSoonCard from '../components/common/ComingSoonCard';

export default function RegistrationsPage() {
  return (
    <>
      <PageHeader
        badge="Student Panel • My Registrations"
        title="My Event Registrations"
        description="Review your submitted registrations, confirmation status, and approval updates."
      />
      <ComingSoonCard
        icon={ClipboardCheck}
        title="Registration Tracker"
        description="Your registered solo and team events, waitlists, and confirmation updates will appear here once event registration opens in an upcoming phase."
        targetPhase="Upcoming Feature Phase"
        endpointHint="GET /api/registrations/my"
      />
    </>
  );
}
