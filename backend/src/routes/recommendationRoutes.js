import express from 'express';
import { getUserById } from '../services/profileService.js'; // reuse existing service to fetch user
import { suggestSkills } from '../services/recommendationEngine.js';
import Event from '../models/Event.js';

const router = express.Router();

// GET /api/recommendations/:userId
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const user = await getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const suggestions = suggestSkills(user.onboarding || {});
    // Find events whose requiredSkills intersect with suggested skills
    const events = await Event.find({ requiredSkills: { $in: suggestions } }).lean();
    return res.json({ suggestions, events });
  } catch (err) {
    console.error('[Recommendations] error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

export default router;
