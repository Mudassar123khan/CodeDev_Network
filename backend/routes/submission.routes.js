import express from 'express';
import { createSubmission,getSubmissions,getOneSubmission } from '../controllers/submission.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/',authMiddleware,createSubmission);
router.get('/me',authMiddleware,getSubmissions);
router.get('/:id',authMiddleware,getOneSubmission);

export default router;