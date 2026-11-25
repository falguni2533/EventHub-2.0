import apiClient from './apiClient';
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
