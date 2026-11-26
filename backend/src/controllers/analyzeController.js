import { analyzeAndSaveFeedback } from '../services/analyzeService.js';
import { verifyToken } from '../services/authService.js';

/**
 * POST /api/analyze
 * Analyzes student feedback and persists the analyzed record in MongoDB.
 */
export const postAnalyzeFeedback = async (req, res, next) => {
  try {
    let userId = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const decoded = verifyToken(authHeader.slice(7).trim());
        userId = decoded?.sub || null;
      } catch {
        // Optional auth context; allow direct analyzer submissions
      }
    }

    const result = await analyzeAndSaveFeedback({
      payload: req.body,
      userId,
    });

    res.status(200).json({
      success: true,
      provider: result.provider,
      ...(result.warning ? { warning: result.warning } : {}),
      analysis: result.analysis,
      data: result.feedbackRecord,
    });
  } catch (error) {
    next(error);
  }
};
