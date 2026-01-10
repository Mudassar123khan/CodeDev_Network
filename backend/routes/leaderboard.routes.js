import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import getleaderBoard from '../controllers/leaderboard.controller.js';
const router = express.Router();

router.get('/',authMiddleware,getleaderBoard);

export default router;