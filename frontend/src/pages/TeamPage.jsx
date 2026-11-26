import { useEffect, useState, useCallback } from 'react';
import PageHeader from '../components/common/PageHeader';
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

// Works whether the service returns the axios response, { success, data } or the data itself
const unwrap = (r) => r?.data?.data ?? r?.data ?? r;
const asList = (r) => {
  const x = unwrap(r);
  return Array.isArray(x) ? x : [];
};
const errMsg = (e, fallback) => e?.response?.data?.message || e?.message || fallback;

const EMPTY_OVERVIEW = { meId: null, teams: [], looking: [], incoming: [], outgoing: [] };

export default function TeamPage() {
  const [tab, setTab] = useState('leader'); // 'leader' | 'solo'
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [memberRecs, setMemberRecs] = useState([]);
  const [teamRecs, setTeamRecs] = useState([]);
  const [form, setForm] = useState({ name: '', skillsNeeded: '', maxMembers: 4, description: '' });
  const [look, setLook] = useState({ skills: '', note: '' });

  const loadOverview = useCallback(async () => {
    try {
      const ov = unwrap(await fetchTeamOverview());
      setOverview({ ...EMPTY_OVERVIEW, ...(ov || {}) });
    } catch (e) {
      toast.error(errMsg(e, 'Could not load your team data'));
    }
  }, []);

  // Events and overview load separately, so one failing never blocks the other
  useEffect(() => {
    (async () => {
      try {
        const list = asList(await fetchTeamEvents());
        setEvents(list);
        if (list[0]) setEventId((cur) => cur || list[0]._id);
      } catch (e) {
        toast.error(errMsg(e, 'Could not load events'));
      }
    })();
    loadOverview();
  }, [loadOverview]);

  const teams = overview.teams || [];
  const myTeam =
    teams.find(
      (t) =>
        String(t.event?._id) === String(eventId) &&
        String(t.leader?._id) === String(overview.meId)
    ) || null;
  const myLooking = (overview.looking || []).find((p) => String(p.event?._id) === String(eventId));

  // Recommendations (members for leaders, teams for solo players)
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        if (tab === 'leader') {
          const r = myTeam ? asList(await fetchTeamRecommendations(myTeam._id)) : [];
          if (!cancelled) setMemberRecs(r);
        } else {
          const r = asList(await fetchRecommendedTeams({ eventId }));
          if (!cancelled) setTeamRecs(r);
        }
      } catch (e) {
        if (!cancelled) {
          setMemberRecs([]);
          setTeamRecs([]);
        }
        if (!/already in a team/i.test(errMsg(e, ''))) toast.error(errMsg(e, 'Could not load recommendations'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, eventId, myTeam?._id, overview]);

  const act = async (fn, okText) => {
    try {
      await fn();
      toast.success(okText);
      await loadOverview();
    } catch (e) {
      toast.error(errMsg(e, 'Something went wrong'));
    }
  };

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!eventId) return toast.error('Select an event first');
    act(async () => {
      await createTeamApi({ eventId, ...form });
      setForm({ name: '', skillsNeeded: '', maxMembers: 4, description: '' });
    }, 'Team created');
  };

  const handleSetLooking = (e) => {
    e.preventDefault();
    if (!eventId) return toast.error('Select an event first');
    act(() => setLookingApi({ eventId, ...look }), 'You are now visible to team leaders');
  };

  return (
    <>
      <style>{css}</style>
      <PageHeader
        badge="Student Panel • My Team"
        title="Team Management"
        description="Create teams, find members, or join existing teams."
      />

      <div className="tp">
        <div className="tp-tabs">
          <button className={tab === 'leader' ? 'on' : ''} onClick={() => setTab('leader')}>
            I have a team, find members
          </button>
          <button className={tab === 'solo' ? 'on' : ''} onClick={() => setTab('solo')}>
            I'm solo, find a team
          </button>
        </div>

        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="tp-input">
          {events.length === 0 && <option value="">No upcoming events available</option>}
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title} – {new Date(ev.date).toLocaleDateString()}
            </option>
          ))}
        </select>

        {/* ---------- LEADER TAB ---------- */}
        {tab === 'leader' && !myTeam && (
          <form onSubmit={handleCreateTeam} className="tp-card">
            <h3>Create your team</h3>
            <input className="tp-input" required placeholder="Team name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="tp-input" placeholder="Skills needed (comma separated, e.g. react, python)"
              value={form.skillsNeeded} onChange={(e) => setForm({ ...form, skillsNeeded: e.target.value })} />
            <input className="tp-input" type="number" min="2" max="10" placeholder="Max members"
              value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: e.target.value })} />
            <textarea className="tp-input" placeholder="Description (optional)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <button className="tp-btn" type="submit">Create Team</button>
          </form>
        )}

        {tab === 'leader' && myTeam && (
          <>
            <h2>Recommended members for “{myTeam.name}”</h2>
            <p className="tp-sub">{myTeam.members?.length}/{myTeam.maxMembers} members</p>
            {memberRecs.length === 0 && <p className="tp-sub">No matching students right now.</p>}
            <div className="tp-grid">
              {memberRecs.map((r) => (
                <div className="tp-card" key={r.student._id}>
                  {/* Gradient header strip */}
                  <div className="tp-card-header blue" />

                  {/* Avatar + name */}
                  <div className="tp-card-identity">
                    <div className="tp-avatar">
                      {(r.student.fullName || '??').split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3>{r.student.fullName}</h3>
                      <p className="tp-sub">{r.student.collegeName}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="tp-badges-row">
                    <span className="tp-badge">Match {r.score}%</span>
                    {r.lookingForTeam && <span className="tp-badge green">Looking for a team</span>}
                    {r.profileDetails?.codingProficiency && (
                      <span className="tp-badge">{r.profileDetails.codingProficiency}</span>
                    )}
                  </div>

                  {/* Profile details */}
                  {r.profileDetails && (
                    <div className="tp-profile-details">
                      {r.profileDetails.department && (
                        <div className="tp-detail-row">
                          <span className="tp-detail-label">Dept:</span>
                          <span className="tp-detail-value">{r.profileDetails.department}</span>
                        </div>
                      )}
                      {r.profileDetails.year && (
                        <div className="tp-detail-row">
                          <span className="tp-detail-label">Year:</span>
                          <span className="tp-detail-value">{r.profileDetails.year}</span>
                        </div>
                      )}
                      {r.profileDetails.course && (
                        <div className="tp-detail-row">
                          <span className="tp-detail-label">Course:</span>
                          <span className="tp-detail-value">{r.profileDetails.course}</span>
                        </div>
                      )}
                      {r.profileDetails.projectExperience && (
                        <div className="tp-detail-row">
                          <span className="tp-detail-label">Experience:</span>
                          <span className="tp-detail-value">{r.profileDetails.projectExperience}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skills chips */}
                  {r.profileDetails?.skills?.length > 0 && (
                    <div className="tp-chips-section">
                      <span className="tp-chips-label">Skills</span>
                      <div className="tp-chips">
                        {r.profileDetails.skills.map((s, i) => (
                          <span key={i} className="tp-chip">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests chips */}
                  {r.profileDetails?.interests?.length > 0 && (
                    <div className="tp-chips-section">
                      <span className="tp-chips-label">Interests</span>
                      <div className="tp-chips">
                        {r.profileDetails.interests.map((s, i) => (
                          <span key={i} className="tp-chip interest">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred roles */}
                  {r.profileDetails?.preferredRoles?.length > 0 && (
                    <div className="tp-chips-section">
                      <span className="tp-chips-label">Preferred Roles</span>
                      <div className="tp-chips">
                        {r.profileDetails.preferredRoles.map((s, i) => (
                          <span key={i} className="tp-chip role">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Soft skills */}
                  {r.profileDetails?.softSkills?.length > 0 && (
                    <div className="tp-chips-section">
                      <span className="tp-chips-label">Soft Skills</span>
                      <div className="tp-chips">
                        {r.profileDetails.softSkills.map((s, i) => (
                          <span key={i} className="tp-chip soft">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Why matched */}
                  {r.reasons?.length > 0 && <p className="tp-why">Why matched: {r.reasons.join(' • ')}</p>}

                  {/* Note from the student */}
                  {r.note && <p className="tp-note">💬 "{r.note}"</p>}

                  <button className="tp-btn full"
                    onClick={() => act(() => sendInviteApi(myTeam._id, { studentId: r.student._id }), 'Invite sent')}>
                    Send invite
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- SOLO TAB ---------- */}
        {tab === 'solo' && (
          <>
            <form onSubmit={handleSetLooking} className="tp-card">
              <h3>{myLooking ? 'You are listed as looking for a team ✓' : 'List yourself as looking for a team'}</h3>
              {!myLooking && (
                <>
                  <input className="tp-input" placeholder="Your skills (comma separated)" value={look.skills}
                    onChange={(e) => setLook({ ...look, skills: e.target.value })} />
                  <textarea className="tp-input" placeholder="Short note (optional)" value={look.note}
                    onChange={(e) => setLook({ ...look, note: e.target.value })} />
                  <button className="tp-btn" type="submit">I'm looking for a team</button>
                </>
              )}
              {myLooking && (
                <button type="button" className="tp-btn ghost"
                  onClick={() => act(() => clearLookingApi(eventId), 'Stopped looking')}>
                  Stop looking
                </button>
              )}
            </form>

            <h2>Recommended teams</h2>
            {teamRecs.length === 0 && <p className="tp-sub">No open teams for this event yet.</p>}
            <div className="tp-grid">
              {teamRecs.map((r) => (
                <div className="tp-card" key={r.team._id}>
                  <span className="tp-badge">Match {r.score}%</span>
                  <h3>{r.team.name}</h3>
                  <p className="tp-sub">Leader: {r.team.leaderName} • {r.team.spotsLeft} spot(s) left</p>
                  {r.team.skillsNeeded?.length > 0 && <p className="tp-sub">Needs: {r.team.skillsNeeded.join(', ')}</p>}
                  {r.reasons?.length > 0 && <p className="tp-why">Why matched: {r.reasons.join(' • ')}</p>}
                  <button className="tp-btn" disabled={r.requested}
                    onClick={() => act(() => sendJoinRequestApi(r.team._id), 'Request sent')}>
                    {r.requested ? 'Request pending' : 'Request to join'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---------- MY TEAMS ---------- */}
        <h2>My Teams</h2>
        {teams.length === 0 ? (
          <p className="tp-sub">No teams yet.</p>
        ) : (
          <div className="tp-grid">
            {teams.map((t) => (
              <div className="tp-card" key={t._id}>
                <h3>{t.name}</h3>
                <p className="tp-sub">{t.event?.title} • {t.members?.length}/{t.maxMembers} members • {t.status}</p>
                {t.members?.map((m) => (
                  <div className="tp-member" key={m._id}>
                    <b>{m.fullName}</b>
                    {String(m._id) === String(t.leader?._id) && <span className="tp-badge">Leader</span>}
                    <div className="tp-sub">{m.email} {m.phone ? `• ${m.phone}` : ''}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ---------- REQUESTS ---------- */}
        <h2>Requests for you</h2>
        {(overview.incoming || []).length === 0 ? (
          <p className="tp-sub">No incoming requests.</p>
        ) : (
          overview.incoming.map((r) => (
            <div className="tp-card tp-row" key={r._id}>
              <div>
                <b>{r.from?.fullName}</b>{' '}
                {r.type === 'invite' ? 'invited you to join' : 'wants to join'} <b>{r.team?.name}</b>
                <div className="tp-sub">{r.team?.event?.title}</div>
              </div>
              <div>
                <button className="tp-btn"
                  onClick={() => act(() => respondRequestApi(r._id, { action: 'accept' }), 'Accepted')}>Accept</button>{' '}
                <button className="tp-btn ghost"
                  onClick={() => act(() => respondRequestApi(r._id, { action: 'decline' }), 'Declined')}>Decline</button>
              </div>
            </div>
          ))
        )}

        <h2>Requests you sent</h2>
        {(overview.outgoing || []).length === 0 ? (
          <p className="tp-sub">No sent requests.</p>
        ) : (
          overview.outgoing.map((r) => (
            <div className="tp-card tp-row" key={r._id}>
              <span>
                {r.type === 'invite' ? `Invite to ${r.to?.fullName || 'student'}` : `Join request to ${r.team?.name}`}
              </span>
              <span className={`tp-badge ${r.status === 'accepted' ? 'green' : ''}`}>{r.status}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

const css = `
.tp{max-width:1100px;margin:0 auto;padding:8px 4px 40px}
.tp h2{margin:28px 0 10px}.tp h3{margin:8px 0 4px}
.tp-sub{color:#6b6b80;font-size:.9rem;margin:2px 0}
.tp-why{color:#5b21b6;font-size:.88rem;margin:6px 0 10px}
.tp-tabs{display:flex;gap:8px;margin:16px 0}
.tp-tabs button{flex:1;padding:12px;border-radius:12px;border:1px solid #ddd6fe;background:#fff;cursor:pointer;font-weight:600}
.tp-tabs button.on{background:#7c3aed;color:#fff;border-color:#7c3aed}
.tp-input{width:100%;padding:10px 12px;margin:6px 0;border:1px solid #ddd6fe;border-radius:10px;box-sizing:border-box;font:inherit}
.tp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.tp-card{background:#fff;border:1px solid #ede9fe;border-radius:16px;padding:16px;margin:10px 0;box-shadow:0 2px 8px rgba(124,58,237,.06);transition:transform .2s,box-shadow .2s}
.tp-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(124,58,237,.12)}
.tp-grid .tp-card{margin:0}
.tp-row{display:flex;justify-content:space-between;align-items:center;gap:12px}
.tp-badge{display:inline-block;background:#ede9fe;color:#6d28d9;border-radius:999px;padding:3px 10px;font-size:.78rem;font-weight:700;margin-right:6px}
.tp-badge.green{background:#dcfce7;color:#15803d}
.tp-btn{background:#7c3aed;color:#fff;border:0;border-radius:10px;padding:9px 16px;font-weight:600;cursor:pointer}
.tp-btn:disabled{opacity:.5;cursor:not-allowed}
.tp-btn.ghost{background:#fff;color:#7c3aed;border:1px solid #ddd6fe}
.tp-btn.full{width:100%;margin-top:8px}
.tp-member{padding:6px 0;border-top:1px solid #f3f0ff}

/* Card gradient header strip */
.tp-card-header{height:6px;border-radius:8px 8px 0 0;margin:-16px -16px 12px}
.tp-card-header.blue{background:linear-gradient(135deg,#2563eb,#1e40af)}
.tp-card-header.purple{background:linear-gradient(135deg,#7c3aed,#6d28d9)}

/* Identity row */
.tp-card-identity{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.tp-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#ede9fe,#ddd6fe);color:#6d28d9;display:grid;place-items:center;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:.9rem;flex-shrink:0}

/* Badges row */
.tp-badges-row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}

/* Profile details */
.tp-profile-details{background:#faf8ff;border:1px solid #ede9fe;border-radius:10px;padding:8px 10px;margin:8px 0;display:grid;grid-template-columns:1fr 1fr;gap:4px 12px}
.tp-detail-row{display:flex;gap:4px;font-size:.82rem}
.tp-detail-label{color:#766e8f;font-weight:600;white-space:nowrap}
.tp-detail-value{color:#1a1230;text-transform:capitalize}

/* Chips */
.tp-chips-section{margin:6px 0}
.tp-chips-label{font-size:.72rem;font-weight:700;color:#766e8f;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:4px}
.tp-chips{display:flex;flex-wrap:wrap;gap:4px}
.tp-chip{padding:2px 8px;border-radius:999px;font-size:.74rem;font-weight:600;background:#ede9fe;color:#6d28d9}
.tp-chip.interest{background:#dbeafe;color:#1e40af}
.tp-chip.role{background:#fef3c7;color:#92400e}
.tp-chip.soft{background:#dcfce7;color:#166534}

/* Note */
.tp-note{background:#faf8ff;border-left:3px solid #7c3aed;padding:6px 10px;border-radius:0 8px 8px 0;font-size:.84rem;color:#544b6e;margin:6px 0;font-style:italic}
`;