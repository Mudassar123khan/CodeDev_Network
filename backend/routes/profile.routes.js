import express from 'express';
import { getProfile, updatePlatforms } from '../controllers/profile.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.put('/platforms', authMiddleware, updatePlatforms);
router.get('/:username', authMiddleware, getProfile);

export default router;