import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { syncUser } from '../controllers/sync.controller.js';
const router = express.Router();

router.post('/platforms',authMiddleware,syncUser);

export default router;