import express from "express";
import { register, login, getUser, adminLogin, adminRegister, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const authRouter = express.Router();

authRouter.post('/register', upload.single('profileImage'), register);
authRouter.post('/login', login);
authRouter.get('/me', authMiddleware, getUser);
authRouter.post('/admin/register', adminRegister);
authRouter.post('/admin/login', adminLogin);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);
authRouter.post('/reset-password', resetPassword);

export default authRouter;