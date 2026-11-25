import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getProfile,
  patchPassword,
  patchProfilePicture,
} from '../controllers/profileController.js';

const router = Router();
router.use(protect);

router.get('/me', getProfile);
router.patch('/picture', patchProfilePicture);
router.patch('/password', patchPassword);

export default router;
