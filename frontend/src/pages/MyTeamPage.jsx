import { Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ComingSoonCard from '../components/common/ComingSoonCard';

export default function MyTeamPage() {
  return (
    <>
      <PageHeader
        badge="Student Panel • My Team"
        title="Team Management"
        description="Create squads, invite classmates by college ID, and manage rosters for team competitions."
      />
      <ComingSoonCard
        icon={Users}
        title="Squad & Roster Workspace"
        description="Manage hackathon and group event teams, track invite status, and assign team leaders."
        targetPhase="Upcoming Feature Phase"
        endpointHint="GET /api/teams/my"
      />
    </>
  );
}
