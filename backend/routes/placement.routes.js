import express from "express";
import { getPlacementStats } from "../controllers/placement.controller.js";

const router = express.Router();

// Public route to fetch placement stats from DB
router.get("/", getPlacementStats);

export default router;
