import { Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ComingSoonCard from '../components/common/ComingSoonCard';
import { useEffect, useState } from 'react';
import { fetchMyProfile } from '../services/profileService';

export default function MyTeamPage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchMyProfile();
        setProfile(data);
      } catch (e) {
        console.error('Profile load error', e);
      }
    };
    loadProfile();
  }, []);

  return (
    <>
      <PageHeader
        badge="Student Panel • My Team"
        title="Team Management"
        description="Team formation feature has been removed."
      />
      <div className="eh-events-empty">
        <p>Team functionality has been removed per request.</p>
      </div>
    </>
  );
}
