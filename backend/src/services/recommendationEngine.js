// src/services/recommendationEngine.js
/**
 * Recommendation Engine – AI or heuristic based skill suggestions.
 * If the Gemini API plugin is installed, we can call `gemini generate`.
 * In this sandbox we provide a simple heuristic fallback.
 */

// Heuristic mapping from onboarding fields to skill suggestions
const TECH_MAP = {
  javascript: ['React', 'Node.js', 'Vue', 'TypeScript'],
  python: ['Django', 'Flask', 'Pandas', 'TensorFlow'],
  java: ['Spring', 'Android', 'Hibernate'],
  c: ['Embedded C', 'Linux Kernel'],
  cpp: ['Qt', 'Boost', 'Game Development'],
  golang: ['Go microservices', 'Docker', 'Kubernetes'],
};

/**
 * Generate skill suggestions based on a user's onboarding data.
 * @param {object} onboarding - the onboarding sub‑document from User.
 * @returns {string[]} array of suggested skill names (max 5).
 */
export function suggestSkills(onboarding) {
  const suggestions = new Set();
  // languages
  (onboarding.programmingLanguages || []).forEach((lang) => {
    const key = lang.toLowerCase();
    const mapped = TECH_MAP[key];
    if (mapped) mapped.forEach((s) => suggestions.add(s));
  });
  // frameworks / tools
  (onboarding.frameworksAndTools || []).forEach((tool) => {
    const t = tool.toLowerCase();
    if (t.includes('react')) suggestions.add('React');
    if (t.includes('node')) suggestions.add('Node.js');
    if (t.includes('aws') || t.includes('cloud')) suggestions.add('AWS');
    if (t.includes('docker')) suggestions.add('Docker');
    if (t.includes('kubernetes')) suggestions.add('Kubernetes');
    if (t.includes('ml') || t.includes('ai')) suggestions.add('Machine Learning');
  });
  // tech interests (free‑form strings)
  (onboarding.techInterests || []).forEach((interest) => {
    const i = interest.toLowerCase();
    if (i.includes('mobile')) suggestions.add('React Native');
    if (i.includes('frontend')) suggestions.add('React');
    if (i.includes('backend')) suggestions.add('Node.js');
    if (i.includes('data')) suggestions.add('Data Science');
  });
  return Array.from(suggestions).slice(0, 5);
}

// ---------------------------------------------------------------
// Event recommendation scoring based on profile/onboarding data
// ---------------------------------------------------------------
import Event from '../models/Event.js';

/**
 * Compute a recommendation score for a single event.
 * Returns null for sold‑out events (they are excluded).
 */
export const scoreEvent = (event, profile) => {
  if (!profile) return null;
  const { interests = [], department = '', year = '', maxBudget = Infinity } = profile;
  let score = 0;
  const reasons = [];
  // Category interest match (+50)
  if (interests.includes(event.category)) { score += 50; reasons.push('Category match'); }
  // Department / year match (+20)
  if (department && event.createdBy && event.createdBy.department === department) { score += 20; reasons.push('Department match'); }
  // Free or within budget (+15)
  if (event.isFree || (event.price ?? 0) <= maxBudget) { score += 15; reasons.push('Within budget'); }
  // Seats available (+10) – exclude sold out
  const seatsLeft = (event.capacity ?? 0) - (event.seatsFilled ?? 0);
  if (seatsLeft <= 0) return null;
  score += 10; reasons.push('Seats available');
  // Upcoming date (+5)
  if (new Date(event.date) > new Date()) { score += 5; reasons.push('Upcoming'); }
  return { event, score, reason: reasons.join(', ') };
};

/**
 * Get top 3‑5 recommended events for a user.
 * Returns { recommendations: [{event,score,reason}], needProfile: boolean }
 */
export const getTopRecommendations = async (user) => {
  if (!user || !user.onboarding) {
    return { recommendations: [], needProfile: true };
  }
  const profile = {
    interests: user.onboarding.techInterests || [],
    department: user.department || '',
    year: user.year || '',
    maxBudget: Infinity,
  };
  const allEvents = await Event.find({}).lean();
  const scored = allEvents
    .map((e) => scoreEvent(e, profile))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || new Date(a.event.date) - new Date(b.event.date));
  const top = scored.slice(0, 5);
  return { recommendations: top, needProfile: false };
};
