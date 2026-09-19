import express from "express";
import {
  submitContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
} from "../controllers/contact.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";
import jwt from "jsonwebtoken";

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        role: decoded.role,
      };
    } catch (err) {
      // Proceed without user if token is invalid or expired
    }
  }
  next();
};

const router = express.Router();

// Public: Submit query or suggestion
router.post("/", optionalAuth, submitContact);

// Admin: Get all messages
router.get("/", authMiddleware, adminMiddleware, getAllContacts);

// Admin: Update status (pending, in_review, resolved)
router.patch("/:id/status", authMiddleware, adminMiddleware, updateContactStatus);

// Admin: Delete message
router.delete("/:id", authMiddleware, adminMiddleware, deleteContact);

export default router;
