import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createInterviewExperience,
  getAllInterviewExperiences,
  getInterviewExperienceById,
} from "../controllers/interview.controller.js";

const router = express.Router();

// Public route to view the list of experiences
router.get("/", getAllInterviewExperiences);

// Protected routes to post or view full details of a specific experience
router.post("/", authMiddleware, createInterviewExperience);
router.get("/:id", authMiddleware, getInterviewExperienceById);

export default router;
