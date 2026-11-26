import { mockEvents } from '../data/mockEvents';
import { getUpcomingEvents } from '../services/eventService';

/**
 * Simple AI‑like recommendation based on a user's profile.
 * The profile object is expected to contain the following (example) fields:
 *   - interests: array of category strings (e.g., ['Technical', 'Workshop'])
 *   - preferredVenues: array of venue substrings
 *   - preferredTimes: array of time-of-day strings (e.g., ['Morning', 'Afternoon'])
 *   - maxPrice: number (maximum price the student is willing to pay)
 * This function scores each event and returns a sorted list (best match first).
 */
export function getRecommendedEvents(events, profile) {
  if (!profile) return [];
  const { interests = [], preferredVenues = [], preferredTimes = [], maxPrice = Infinity } = profile;

  const scoreEvent = (event) => {
    let score = 0;
    // Category match
    if (interests.includes(event.category)) score += 30;
    // Venue substring match
    if (preferredVenues.some((v) => event.venue.toLowerCase().includes(v.toLowerCase()))) score += 20;
    // Time preference – simple check for morning/afternoon/evening keywords
    const timeLower = event.time.toLowerCase();
    if (preferredTimes.some((t) => timeLower.includes(t.toLowerCase()))) score += 15;
    // Price within budget
    if (event.isFree || event.price <= maxPrice) score += 10;
    // Seats availability – more seats left is better
    const seatsLeft = event.seatsTotal - event.seatsFilled;
    score += Math.min(seatsLeft, 10);
    return score;
  };

  const scored = events.map((e) => ({ event: e, score: scoreEvent(e) }));
  // Filter out events with zero score (no relevance)
  const filtered = scored.filter((s) => s.score > 0);
  // Sort descending by score then by nearest date
  filtered.sort((a, b) => b.score - a.score || a.event.date.localeCompare(b.event.date));
  return filtered.map((s) => s.event);
}
