import { ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchTeamOverview } from '../services/teamService';
import PageHeader from '../components/common/PageHeader';
import ComingSoonCard from '../components/common/ComingSoonCard';

export default function RegistrationsPage() {
  const navigate = useNavigate();
  const [teamInfo, setTeamInfo] = useState(null);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const data = await fetchTeamOverview();
        setTeamInfo(data);
      } catch (e) {
        console.error('Failed to load team overview', e);
      }
    };
    loadTeam();
  }, []);

  const goToTeam = () => navigate('/team');
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
