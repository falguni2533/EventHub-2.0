import { mockEvents } from '../data/mockEvents';

// Simulated async fetch with a small delay. Replace with real API call later.
// Example: return apiClient.get('/events');
export async function getUpcomingEvents() {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 300));
  const today = new Date().toISOString().split('T')[0];
  // Filter events that are today or in the future and sort by nearest date first
  const upcoming = mockEvents
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming;
}
