import apiClient from './apiClient';

// All endpoints are under /student/team (protected)
export const fetchTeamOverview = async () => {
  const resp = await apiClient.get('/student/team');
  return resp.data.data; // {teams, looking, incoming, outgoing, meId}
};

export const fetchTeamEvents = async () => {
  const resp = await apiClient.get('/student/team/events');
  // Backend returns { success:true, data:[{_id,title,category,date}] }
  return resp.data?.data ?? [];
};

export const createTeamApi = async (payload) => {
  const resp = await apiClient.post('/student/team', payload);
  return resp.data.data;
};

export const setLookingApi = async (payload) => {
  const resp = await apiClient.post('/student/team/looking', payload);
  return resp.data.data;
};

export const clearLookingApi = async (eventId) => {
  const resp = await apiClient.delete(`/student/team/looking/${eventId}`);
  return resp.data.data;
};

export const fetchRecommendedTeams = async ({ eventId }) => {
  const resp = await apiClient.get('/student/team/recommended-teams', { params: { eventId } });
  return resp.data.data; // ranked list
};

export const respondRequestApi = async (requestId, { action }) => {
  const resp = await apiClient.patch(`/student/team/requests/${requestId}`, { action });
  return resp.data.data;
};

export const fetchTeamRecommendations = async (teamId) => {
  const resp = await apiClient.get(`/student/team/${teamId}/recommendations`);
  return resp.data.data;
};

export const sendInviteApi = async (teamId, { studentId }) => {
  const resp = await apiClient.post(`/student/team/${teamId}/invite`, { studentId });
  return resp.data.data;
};

export const sendJoinRequestApi = async (teamId) => {
  const resp = await apiClient.post(`/student/team/${teamId}/join`);
  return resp.data.data;
};

import { mockUsers } from '../data/mockUsers';

// Mock team for development (when backend is not running)
const mockTeam = {
  members: [mockUsers[0], mockUsers[2]], // pick two sample users
};

/**
 * Get the logged‑in user's current team.
 * If the backend endpoint fails (e.g., 500), fall back to mock data
 * so the UI can still display something.
 */
export const fetchMyTeam = async () => {
  try {
    const response = await apiClient.get('/teams/my');
    return response.data.data.team; // expected shape { members: [] }
  } catch (e) {
    console.error('Failed to fetch team – using mock data', e);
    // Return mock data instead of null so the UI shows a team
    return mockTeam;
  }
};

// Simple AI recommendation based on profile interests/skills
export const getRecommendedTeammates = (profile) => {
  if (!profile) return [];
  const { interests = [], skills = [] } = profile;
  // Score each mock user
  const scored = mockUsers.map((user) => {
    let score = 0;
    if (interests.some((i) => user.interests.includes(i))) score += 30;
    if (skills.some((s) => user.skills.includes(s))) score += 20;
    if (user.available) score += 10;
    return { user, score };
  });
  const filtered = scored.filter((s) => s.score > 0);
  filtered.sort((a, b) => b.score - a.score);
  return filtered.map((s) => s.user);
};
