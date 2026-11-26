import { Router } from 'express';
import { postAnalyzeFeedback } from '../controllers/analyzeController.js';

const router = Router();

router.post('/', postAnalyzeFeedback);

export default router;
