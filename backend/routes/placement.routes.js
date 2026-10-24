import express from "express";
import { getPlacementStats, seedPlacementStats } from "../controllers/placement.controller.js";

const router = express.Router();

// Public route to fetch placement stats from DB
router.get("/", getPlacementStats);

// Route to re-seed or initialize collection
router.post("/seed", seedPlacementStats);

export default router;
