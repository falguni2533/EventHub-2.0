import mongoose from 'mongoose';
import User from '../models/User.js';
import AppEvent from '../models/Event.js';
import Registration from '../models/Registration.js';
import Team from '../models/Team.js';
import TeamRequest from '../models/TeamRequest.js';
import LookingPost from '../models/LookingPost.js';
import {
    scoreStudentForTeam,
    scoreTeamForStudent,
} from '../services/teamMatchService.js';

const ok = (res, data, code = 200) => res.status(code).json({ success: true, data });
const fail = (res, code, message) => res.status(code).json({ success: false, message });
const isId = (v) => mongoose.isValidObjectId(v);
const cleanList = (v) =>
    (Array.isArray(v) ? v : String(v || '').split(','))
        .map((s) => String(s).trim())
        .filter(Boolean);

// 👉 Add/remove fields here to match your User model
const PUBLIC = 'fullName collegeName studentId department branch year course skills interests onboarding';
const CONTACT = `${PUBLIC} email phone`; // shown only to people inside the same team

const spotsLeft = (t) => t.maxMembers - t.members.length;

/* Upcoming events for the dropdown */
export const getTeamEvents = async (req, res, next) => {
    try {
        const events = await AppEvent.find({ status: 'published', date: { $gte: new Date() } })
            .sort({ date: 1 })
            .select('title category date')
            .lean();
        ok(res, events);
    } catch (e) {
        next(e);
    }
};

/* My teams, my "looking" posts, requests in and out */
export const getTeamOverview = async (req, res, next) => {
    try {
        const me = req.user.id;
        const [teams, looking, incoming, outgoing] = await Promise.all([
            Team.find({ members: me })
                .populate('event', 'title category date')
                .populate('leader', PUBLIC)
                .populate('members', CONTACT)
                .sort({ createdAt: -1 })
                .lean(),
            LookingPost.find({ student: me, active: true }).populate('event', 'title date').lean(),
            TeamRequest.find({ to: me, status: 'pending' })
                .populate({ path: 'team', select: 'name event', populate: { path: 'event', select: 'title' } })
                .populate('from', PUBLIC)
                .sort({ createdAt: -1 })
                .lean(),
            TeamRequest.find({ from: me })
                .populate('team', 'name')
                .populate('to', 'fullName')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),
        ]);
        ok(res, { meId: me, teams, looking, incoming, outgoing });
    } catch (e) {
        next(e);
    }
};

/* OPTION 1: create a team */
export const createTeam = async (req, res, next) => {
    try {
        const me = req.user.id;
        const { eventId, name, skillsNeeded, maxMembers = 4, description = '' } = req.body;
        if (!isId(eventId) || !name?.trim()) return fail(res, 400, 'Event and team name are required');

        const event = await AppEvent.findById(eventId).lean();
        if (!event || event.status !== 'published') return fail(res, 404, 'Event not found');
        if (new Date(event.date) < new Date()) return fail(res, 400, 'This event is already over');
        if (await Team.exists({ event: eventId, members: me }))
            return fail(res, 409, 'You are already in a team for this event');

        const team = await Team.create({
            name: name.trim(),
            event: eventId,
            leader: me,
            members: [me],
            maxMembers: Math.min(Math.max(Number(maxMembers) || 4, 2), 10),
            skillsNeeded: cleanList(skillsNeeded),
            description,
        });
        await LookingPost.updateMany({ student: me, event: eventId }, { active: false });
        ok(res, team, 201);
    } catch (e) {
        next(e);
    }
};

/* Recommended students for my team (leader only) */
export const recommendMembers = async (req, res, next) => {
    try {
        const me = req.user.id;
        const { teamId } = req.params;
        if (!isId(teamId)) return fail(res, 400, 'Invalid team');

        const team = await Team.findById(teamId)
            .populate('event', 'category title')
            .populate('leader', PUBLIC)
            .lean();
        if (!team) return fail(res, 404, 'Team not found');
        if (String(team.leader._id) !== me) return fail(res, 403, 'Only the team leader can do this');
        if (spotsLeft(team) <= 0) return ok(res, []);

        const eventId = team.event._id;
        const [registered, posts, takenIds, pendingIds] = await Promise.all([
            Registration.find({ event: eventId, status: { $ne: 'cancelled' } }).distinct('student'),
            LookingPost.find({ event: eventId, active: true }).lean(),
            Team.find({ event: eventId }).distinct('members'),
            TeamRequest.find({ team: team._id, type: 'invite', status: 'pending' }).distinct('to'),
        ]);

        const postMap = new Map(posts.map((p) => [String(p.student), p]));
        const taken = new Set([...takenIds, ...pendingIds].map(String));
        const candidateIds = [
            ...new Set([...registered.map(String), ...posts.map((p) => String(p.student))]),
        ].filter((id) => id !== me && !taken.has(id));

        const students = await User.find({ _id: { $in: candidateIds }, role: 'student' })
            .select(PUBLIC)
            .lean();

        const ranked = students
            .map((s) => {
                const post = postMap.get(String(s._id));
                const { score, reasons, profileDetails } = scoreStudentForTeam(s, team, post);
                return { student: s, score, reasons, profileDetails, lookingForTeam: !!post, note: post?.note || '' };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        ok(res, ranked);
    } catch (e) {
        next(e);
    }
};

/* Leader invites a student */
export const sendInvite = async (req, res, next) => {
    try {
        const me = req.user.id;
        const { teamId } = req.params;
        const { studentId } = req.body;
        if (!isId(teamId) || !isId(studentId)) return fail(res, 400, 'Invalid request');

        const team = await Team.findById(teamId);
        if (!team) return fail(res, 404, 'Team not found');
        if (String(team.leader) !== me) return fail(res, 403, 'Only the team leader can invite');
        if (team.members.length >= team.maxMembers) return fail(res, 409, 'Team is full');
        if (!(await User.exists({ _id: studentId, role: 'student' })))
            return fail(res, 404, 'Student not found');
        if (await Team.exists({ event: team.event, members: studentId }))
            return fail(res, 409, 'That student is already in a team for this event');
        if (await TeamRequest.exists({ team: team._id, to: studentId, type: 'invite', status: 'pending' }))
            return fail(res, 409, 'Invite already sent');

        const reqDoc = await TeamRequest.create({ type: 'invite', team: team._id, from: me, to: studentId });
        ok(res, reqDoc, 201);
    } catch (e) {
        next(e);
    }
};

/* OPTION 2: mark myself as looking */
export const setLooking = async (req, res, next) => {
    try {
        const me = req.user.id;
        const { eventId, skills, note = '' } = req.body;
        if (!isId(eventId)) return fail(res, 400, 'Choose an event');
        const event = await AppEvent.findById(eventId).lean();
        if (!event || event.status !== 'published') return fail(res, 404, 'Event not found');
        if (await Team.exists({ event: eventId, members: me }))
            return fail(res, 409, 'You are already in a team for this event');

        const post = await LookingPost.findOneAndUpdate(
            { student: me, event: eventId },
            { skills: cleanList(skills), note, active: true },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        ok(res, post);
    } catch (e) {
        next(e);
    }
};

export const clearLooking = async (req, res, next) => {
    try {
        await LookingPost.updateOne(
            { student: req.user.id, event: req.params.eventId },
            { active: false }
        );
        ok(res, { stopped: true });
    } catch (e) {
        next(e);
    }
};

/* Recommended teams for me */
export const recommendTeams = async (req, res, next) => {
    try {
        const me = req.user.id;
        const { eventId } = req.query;
        if (!isId(eventId)) return fail(res, 400, 'Choose an event');
        if (await Team.exists({ event: eventId, members: me }))
            return fail(res, 409, 'You are already in a team for this event');

        const [meUser, teams, requestedIds] = await Promise.all([
            User.findById(me).select(PUBLIC).lean(),
            Team.find({ event: eventId, status: 'open' })
                .populate('event', 'category title')
                .populate('leader', PUBLIC)
                .lean(),
            TeamRequest.find({ from: me, type: 'join', status: 'pending' }).distinct('team'),
        ]);
        const requested = new Set(requestedIds.map(String));

        const ranked = teams
            .filter((t) => spotsLeft(t) > 0)
            .map((t) => {
                const { score, reasons } = scoreTeamForStudent(meUser, t);
                return {
                    team: {
                        _id: t._id,
                        name: t.name,
                        description: t.description,
                        skillsNeeded: t.skillsNeeded,
                        spotsLeft: spotsLeft(t),
                        leaderName: t.leader?.fullName,
                    },
                    score,
                    reasons,
                    requested: requested.has(String(t._id)),
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        ok(res, ranked);
    } catch (e) {
        next(e);
    }
};

/* Solo student asks to join */
export const sendJoinRequest = async (req, res, next) => {
    try {
        const me = req.user.id;
        const { teamId } = req.params;
        if (!isId(teamId)) return fail(res, 400, 'Invalid team');

        const team = await Team.findById(teamId);
        if (!team) return fail(res, 404, 'Team not found');
        if (team.members.length >= team.maxMembers) return fail(res, 409, 'Team is full');
        if (await Team.exists({ event: team.event, members: me }))
            return fail(res, 409, 'You are already in a team for this event');
        if (await TeamRequest.exists({ team: team._id, from: me, type: 'join', status: 'pending' }))
            return fail(res, 409, 'Request already sent');

        const reqDoc = await TeamRequest.create({ type: 'join', team: team._id, from: me, to: team.leader });
        ok(res, reqDoc, 201);
    } catch (e) {
        next(e);
    }
};

/* Accept or decline (the person in `to` decides) */
export const respondRequest = async (req, res, next) => {
    try {
        const me = req.user.id;
        const { requestId } = req.params;
        const { action } = req.body;
        if (!isId(requestId)) return fail(res, 400, 'Invalid request');
        if (!['accept', 'decline'].includes(action)) return fail(res, 400, 'Action must be accept or decline');

        const reqDoc = await TeamRequest.findById(requestId);
        if (!reqDoc || String(reqDoc.to) !== me) return fail(res, 404, 'Request not found');
        if (reqDoc.status !== 'pending') return fail(res, 409, 'Already answered');

        if (action === 'decline') {
            reqDoc.status = 'declined';
            await reqDoc.save();
            return ok(res, reqDoc);
        }

        const team = await Team.findById(reqDoc.team);
        if (!team) return fail(res, 404, 'Team no longer exists');

        const joinerId = reqDoc.type === 'invite' ? reqDoc.to : reqDoc.from;
        if (team.members.length >= team.maxMembers) return fail(res, 409, 'Team is full');
        if (await Team.exists({ event: team.event, members: joinerId }))
            return fail(res, 409, 'Already in a team for this event');

        team.members.push(joinerId);
        if (team.members.length >= team.maxMembers) team.status = 'full';
        await team.save();

        reqDoc.status = 'accepted';
        await reqDoc.save();

        await LookingPost.updateOne({ student: joinerId, event: team.event }, { active: false });

        // clean up: joiner's other pending requests for this event
        const eventTeamIds = await Team.find({ event: team.event }).distinct('_id');
        await TeamRequest.updateMany(
            {
                _id: { $ne: reqDoc._id },
                status: 'pending',
                team: { $in: eventTeamIds },
                $or: [
                    { from: joinerId, type: 'join' },
                    { to: joinerId, type: 'invite' },
                ],
            },
            { status: 'cancelled' }
        );
        // team full: cancel leftover pending requests to it
        if (team.status === 'full') {
            await TeamRequest.updateMany({ team: team._id, status: 'pending' }, { status: 'cancelled' });
        }

        ok(res, reqDoc);
    } catch (e) {
        next(e);
    }
};