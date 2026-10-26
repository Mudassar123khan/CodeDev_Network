import express from 'express';
import { getProfile, updatePlatforms, updateProfileImage } from '../controllers/profile.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.put('/platforms', authMiddleware, updatePlatforms);
router.put('/profile-image', authMiddleware, upload.single('profileImage'), updateProfileImage);
router.post('/profile-image', authMiddleware, upload.single('profileImage'), updateProfileImage);
router.get('/:username', authMiddleware, getProfile);

export default router;