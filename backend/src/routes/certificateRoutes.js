import { Router } from 'express';
import {
  downloadCertificate,
  verifyCertificate,
} from '../controllers/certificateController.js';

const router = Router();

// Public certificate verification & PDF download
router.get('/verify/:certificateId', verifyCertificate);
router.get('/download/:certificateId', downloadCertificate);

export default router;
