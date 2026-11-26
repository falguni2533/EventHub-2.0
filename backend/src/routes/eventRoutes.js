import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getEventDetails,
  registerForEvent,
  cancelRegistration,
  submitFeedback,
} from '../controllers/eventController.js';

const router = Router();

router.use(protect);

router.get('/:id', getEventDetails);
router.post('/:id/register', registerForEvent);
router.post('/:id/cancel', cancelRegistration);
router.post('/:id/feedback', submitFeedback);

export default router;
