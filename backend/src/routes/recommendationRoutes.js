import express from 'express';
import { getUserById } from '../services/profileService.js';
import { getTopRecommendations } from '../services/recommendationEngine.js';

const router = express.Router();

// GET /api/recommendations/:userId
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const user = await getUserById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { recommendations, needProfile } = await getTopRecommendations(user.onboarding || {});
    return res.json({ needProfile, recommendations });
  } catch (err) {
    console.error('[Recommendations] error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

export default router;
