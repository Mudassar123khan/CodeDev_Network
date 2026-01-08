import express from 'express';
import { createSubmission,getSubmissions,getOneSubmission } from '../controllers/submission.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/',authMiddleware,createSubmission);//route to create a submission
router.get('/me',authMiddleware,getSubmissions);// route to get all submissions related to a given user
router.get('/:id',authMiddleware,getOneSubmission);//route to get only one submission with the id

export default router;