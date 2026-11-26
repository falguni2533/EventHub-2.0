import { useEffect, useState } from 'react';
import { getRecommendedTeammates } from '../../services/teamService';
import TeamCard from './TeamCard';
import './team.css';

export default function TeamRecommendations({ profile }) {
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    if (profile) {
      const recs = getRecommendedTeammates(profile);
      setCandidates(recs);
    }
  }, [profile]);

  if (!profile) return null;
  if (candidates.length === 0) {
    return <p>No suitable teammates found.</p>;
  }

  return (
    <section className="team-reco-section">
      <h2>Suggested Teammates</h2>
      <div className="team-reco-grid">
        {candidates.map((u) => (
          <TeamCard key={u.id} member={u} />
        ))}
      </div>
    </section>
  );
}
