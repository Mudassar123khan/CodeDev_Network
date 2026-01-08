import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminOnly from '../middleware/admin.middleware.js';
import { createProblem,getOneProblem,getProblems,updateProblem,deleteProblem } from '../controllers/problems.controller.js';
import { getAllSubmissionsOfaProblem } from '../controllers/submission.controller.js';
const router = express.Router();

router.post('/',authMiddleware,adminOnly,createProblem);
router.get('/',getProblems);
router.get('/:slug',getOneProblem);
router.patch('/:id',authMiddleware,adminOnly,updateProblem);
router.delete('/:id',authMiddleware,adminOnly,deleteProblem);
router.get('/:slug/submissions',authMiddleware,getAllSubmissionsOfaProblem);//route to get submissions of a problem

export default router;