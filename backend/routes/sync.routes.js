import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { syncUser,getSyncStatus } from '../controllers/sync.controller.js';

const router = express.Router();

router.post('/platforms',authMiddleware,syncUser);
router.get("/status/:userId", getSyncStatus);  //route to get the sync status

export default router;