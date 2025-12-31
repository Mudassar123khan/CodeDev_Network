import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminOnly from '../middleware/admin.middleware.js';
import { createProblem,getOneProblem,getProblems,updateProblem,deleteProblem } from '../controllers/problems.controller.js';
const router = express.Router();

router.post('/',authMiddleware,adminOnly,createProblem);
router.get('/',getProblems);
router.get('/:id',getOneProblem);
router.patch('/:id',updateProblem);
router.delete('/:id',deleteProblem);

export default router;