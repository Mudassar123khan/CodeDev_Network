import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminOnly from '../middleware/admin.middleware.js';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  syncSpecificUser, 
  syncAllUsers,
  getAllInterviewsAdmin,
  deleteInterviewAdmin,
  updateInterviewOutcomeAdmin
} from '../controllers/admin.controller.js';
import {
  getAllPlacementStatsAdmin,
  createPlacementStat,
  updatePlacementStat,
  deletePlacementStat,
  updatePlacementMeta,
  recalculateOverallStats
} from '../controllers/placement.controller.js';

const router = express.Router();

// All routes are protected by authMiddleware and adminOnly
router.use(authMiddleware, adminOnly);

// User Management Routes
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Interview Experience Management Routes
router.get('/interviews', getAllInterviewsAdmin);
router.delete('/interviews/:id', deleteInterviewAdmin);
router.patch('/interviews/:id/outcome', updateInterviewOutcomeAdmin);

// Placement Data Management Routes
router.get('/placements', getAllPlacementStatsAdmin);
router.post('/placements', createPlacementStat);
router.put('/placements/meta', updatePlacementMeta);
router.post('/placements/recalculate', recalculateOverallStats);
router.put('/placements/:id', updatePlacementStat);
router.delete('/placements/:id', deletePlacementStat);

// Sync Routes
router.post('/users/sync-all', syncAllUsers);
router.post('/users/:id/sync', syncSpecificUser);

export default router;
