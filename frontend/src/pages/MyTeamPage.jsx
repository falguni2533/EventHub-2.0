import { Users } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { useEffect, useState } from 'react';
import { fetchMyProfile } from '../services/profileService';
import {
  fetchTeamOverview,
  fetchTeamEvents,
  createTeamApi,
  setLookingApi,
  clearLookingApi,
  fetchRecommendedTeams,
  respondRequestApi,
  fetchTeamRecommendations,
  sendInviteApi,
  sendJoinRequestApi,
} from '../services/teamService';
import { toast } from '../utils/toast';

export default function MyTeamPage() {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('leader'); // 'leader' or 'solo'
  const [events, setEvents] = useState([]);
  const [overview, setOverview] = useState(null);

  // Load profile (needed for recommendations)
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyProfile();
        setProfile(data);
      } catch (e) {
        console.error('Profile load error', e);
      }
    })();
  }, []);

  // Load common data when tab changes
  useEffect(() => {
    if (tab === 'leader') {
      // leader view – need events for dropdown & overview
      (async () => {
        try {
          const [ev, ov] = await Promise.all([fetchTeamEvents(), fetchTeamOverview()]);
          setEvents(ev);
          setOverview(ov);
        } catch (e) {
          console.error('Team data load error', e);
        }
      })();
    }
  }, [tab]);

  // ---------- Handlers ----------
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const payload = {
      eventId: data.get('eventId'),
      name: data.get('name'),
      skillsNeeded: data.get('skillsNeeded'),
      maxMembers: data.get('maxMembers'),
      description: data.get('description'),
    };
    try {
      await createTeamApi(payload);
      toast.success('Team created');
      // refresh overview
      setOverview(await fetchTeamOverview());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    }
  };

  const handleSetLooking = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const payload = {
      eventId: data.get('eventId'),
      skills: data.get('skills'),
      note: data.get('note'),
    };
    try {
      await setLookingApi(payload);
      toast.success('Marked as looking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleClearLooking = async (eventId) => {
    try {
      await clearLookingApi(eventId);
      toast.success('Stopped looking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleInvite = async (teamId, studentId) => {
    try {
      await sendInviteApi(teamId, { studentId });
      toast.success('Invite sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invite failed');
    }
  };

  const handleJoin = async (teamId) => {
    try {
      await sendJoinRequestApi(teamId);
      toast.success('Request sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    }
  };

  // Render UI – simplified for brevity
  return (
    <>
      <PageHeader
        badge="Student Panel • My Team"
        title="Team Management"
        description="Create teams, find members, or join existing teams."
      />
      <div className="eh-tabs">
        <button onClick={() => setTab('leader')} className={tab === 'leader' ? 'active' : ''}>I have a team, find members</button>
        <button onClick={() => setTab('solo')} className={tab === 'solo' ? 'active' : ''}>I'm solo, find a team</button>
      </div>

      {tab === 'leader' && (
        <div className="leader-tab">
          {/* Event dropdown + create team form */}
          <form onSubmit={handleCreateTeam} className="team-create-form">
            <select name="eventId" required>
              <option value="">Select Event</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.title} – {new Date(ev.date).toLocaleDateString()}</option>
              ))}
            </select>
            <input type="text" name="name" placeholder="Team name" required />
            <input type="text" name="skillsNeeded" placeholder="Skills needed (comma separated)" />
            <input type="number" name="maxMembers" placeholder="Max members" min="2" max="10" defaultValue="4" />
            <textarea name="description" placeholder="Description (optional)" />
            <button type="submit">Create Team</button>
          </form>

          {/* Recommended members */}
          {overview && overview.teams && overview.teams.map((team) => (
            <div key={team._id} className="team-card">
              <h3>{team.name}</h3>
              <p>{team.description}</p>
              {/* button to open recommendations modal – simplified inline */}
              <button onClick={async () => {
                const rec = await fetchTeamRecommendations(team._id);
                // show simple alert list for demo
                alert(JSON.stringify(rec, null, 2));
              }}>Show Recommendations</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'solo' && (
        <div className="solo-tab">
          {/* Looking form */}
          <form onSubmit={handleSetLooking} className="looking-form">
            <select name="eventId" required>
              <option value="">Select Event</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
            <input type="text" name="skills" placeholder="Your skills (comma separated)" />
            <textarea name="note" placeholder="Note (optional)" />
            <button type="submit">Mark as Looking</button>
          </form>
          {/* Recommended teams */}
          {profile && (
            <RecommendedTeams profile={profile} />
          )}
        </div>
      )}

      {/* Requests & My Teams – reuse overview data */}
      {overview && (
        <div className="overview-section">
          <h2>My Teams</h2>
          {overview.teams.map((t) => (
            <div key={t._id} className="team-row">
              <p>{t.name} – {t.event.title}</p>
              <ul>
                {t.members.map((m) => (
                  <li key={m._id}>{m.fullName} – {m.email} – {m.phone}</li>
                ))}
              </ul>
            </div>
          ))}

          <h2>Requests for you</h2>
          {overview.incoming.map((req) => (
            <div key={req._id} className="request-row">
              <p>{req.from.fullName} wants to {req.type === 'join' ? 'join' : 'invite'} your team {req.team.name}</p>
              <button onClick={() => respondRequestApi(req._id, { action: 'accept' })}>Accept</button>
              <button onClick={() => respondRequestApi(req._id, { action: 'decline' })}>Decline</button>
            </div>
          ))}

          <h2>Requests you sent</h2>
          {overview.outgoing.map((req) => (
            <div key={req._id} className="request-sent-row">
              <p>{req.type === 'join' ? 'Join' : 'Invite'} request to {req.type === 'join' ? req.team.name : req.to.fullName}</p>
              <p>Status: {req.status}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// Helper component for solo recommendations
function RecommendedTeams({ profile }) {
  const [teams, setTeams] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const evs = await fetchTeamEvents();
        // pick first event for demo
        if (evs.length) {
          const rec = await fetchRecommendedTeams({ eventId: evs[0]._id });
          setTeams(rec);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="recommended-teams">
      <h3>Recommended Teams</h3>
      {teams.map((t) => (
        <div key={t.team._id} className="team-rec-card">
          <p>{t.team.name} – Match {t.score}%</p>
          <p>{t.reasons.join(', ')}</p>
          <p>Spots left: {t.team.spotsLeft}</p>
          <button disabled={t.requested} onClick={() => sendJoinRequestApi(t.team._id)}>
            {t.requested ? 'Request pending' : 'Request to Join'}
          </button>
        </div>
      ))}
    </div>
  );
}

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
