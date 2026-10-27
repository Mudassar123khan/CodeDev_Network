import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/mail.service.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

//login controller
const login = async(req,res)=>{
    try{
         const {email,password} = req.body;

        //checking if email and password is received or not
        if(!email || !password){
            console.log("email and password both required");
            return res.status(400).json({
                success:false,
                message:"Both email and password required",
            });
        }

        //fetching the user
        const user = await User.findOne({email}).select("+password");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"Invalid email or passwrod"
            });
        }


        const compare = await bcrypt.compare(password,user.password);

        if(!compare){
            return res.status(401).json({
                success:false,
                message:"Invalid email or password",
            });
        }

        //generating jwt
        const token = jwt.sign(
            {id:user._id,role:user.role},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );
        //sending response
        res.status(200).json({
            success:true,
            message:"LoggedIn succesfully",
            token,
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
                role:user.role,
                branch:user.branch,
                graduationYear:user.graduationYear,
                profileImage:user.profileImage || ""
            }
        });
    }catch(err){
        console.log(`An error occured ${err.message}`);
        return res.status(500).json({
            success:false,
            message:"Internal Server error",
        });
    }
};

//register controller
const register = async(req,res)=>{
    try{
        const {username,email, password, branch, platforms, graduationYear}= req.body;

        if(!username || !email || !password || !branch || !graduationYear){
            console.log("All fields are required");
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }

        //checking if the user already registered or not
        const exists =await User.findOne({$or:[{email},{username}]});
        if(exists){
            console.log("User already exists");
            return res.status(409).json({success:false, message:"User already registered"});
        }

        // Parse platforms if passed as string via FormData
        let parsedPlatforms = {};
        if (typeof platforms === "string") {
            try {
                parsedPlatforms = JSON.parse(platforms);
            } catch {
                parsedPlatforms = {};
            }
        } else if (typeof platforms === "object" && platforms !== null) {
            parsedPlatforms = platforms;
        }

        // Optional profile image upload to Cloudinary
        let profileImageUrl = "";
        if (req.file && req.file.buffer) {
            try {
                const uploadRes = await uploadToCloudinary(req.file.buffer, "codedev/profiles");
                if (uploadRes?.secure_url) {
                    profileImageUrl = uploadRes.secure_url;
                }
            } catch (uploadErr) {
                console.error("Cloudinary upload error during register:", uploadErr.message);
            }
        }

        //hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        //creating user in db
        const newUser =await User.create({
            username,
            email,
            password:hashedPassword,
            branch,
            graduationYear,
            profileImage: profileImageUrl,
            platforms:{
                ...parsedPlatforms
            }
        });

        //creating jwt token
        const token = jwt.sign(
            {id:newUser._id,role:newUser.role},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );

        console.log("User saved");

        // Send a warm welcome email in the background
        sendWelcomeEmail({
            to: newUser.email,
            username: newUser.username,
        }).catch((err) => {
            console.error("[Auth:Register] Error sending welcome email:", err?.message || err);
        });

        //sending response
        res.status(201).json({
            success:true,
            message:"User registered successfully",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                branch: newUser.branch,
                graduationYear: newUser.graduationYear,
                profileImage: newUser.profileImage || ""
            },
        });

    }catch(err){
        console.log(`An error occured ${err.message}`);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        });
    }
};

const logout = async(req,res)=>{
    console.log("Logout");
};

const getUser = async(req,res)=>{
   try{
         const id = req.user.id;

        const user = await User.findById(id);
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }

        res.status(200).json({
            success:true,
            message:"User found",
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
                role:user.role,
                branch:user.branch,
                graduationYear:user.graduationYear,
                profileImage:user.profileImage || ""
            }
        });
   }catch(err){
    console.log(`An error occured ${err.message}`);
    return res.status(500).json({
        success:false,
        message:"Internal server error",
    });
   }
};

const adminLogin = async(req,res)=>{
    try{
         const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Both email and password required",
            });
        }

        const user = await User.findOne({email}).select("+password");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"Invalid email or password"
            });
        }

        const compare = await bcrypt.compare(password,user.password);
        if(!compare){
            return res.status(401).json({
                success:false,
                message:"Invalid email or password",
            });
        }

        if(user.role !== 'admin') {
            return res.status(403).json({
                success:false,
                message:"Access denied. Admin resources only."
            });
        }

        const token = jwt.sign(
            {id:user._id,role:user.role},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );

        res.status(200).json({
            success:true,
            message:"Admin Logged in succesfully",
            token,
            user:{
                id:user._id,
                username:user.username,
                email:user.email,
                role:user.role
            }
        });
    }catch(err){
        console.log(`An error occured ${err.message}`);
        return res.status(500).json({
            success:false,
            message:"Internal Server error",
        });
    }
};

const adminRegister = async(req,res)=>{
    try{
        const {username,email, password}= req.body;

        if(!username || !email || !password){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }

        const exists =await User.findOne({$or:[{email},{username}]});
        if(exists){
            return res.status(409).json({success:false, message:"Admin user already registered"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const newUser =await User.create({
            username,
            email,
            password:hashedPassword,
            role: 'admin'
        });

        const token = jwt.sign(
            {id:newUser._id,role:newUser.role},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );

        // Send welcome email in the background
        sendWelcomeEmail({
            to: newUser.email,
            username: newUser.username,
        }).catch((err) => {
            console.error("[Auth:AdminRegister] Error sending welcome email:", err?.message || err);
        });

        res.status(201).json({
            success:true,
            message:"Admin registered",
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
            },
        });

    }catch(err){
        console.log(`An error occured ${err.message}`);
        return res.status(500).json({
            success:false,
            message:"Internal Server Error"
        });
    }
};

// Request password reset link
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide an email address",
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address",
            });
        }

        // Generate unhashed reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash token for database storage
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins expiry
        await user.save({ validateBeforeSave: false });

        // Construct reset URL dynamically based on request origin, referer, or env
        let clientOrigin = req.headers.origin;
        if (clientOrigin === "null" || clientOrigin === "undefined") {
            clientOrigin = null;
        }
        if (!clientOrigin && req.headers.referer) {
            try {
                const parsed = new URL(req.headers.referer);
                clientOrigin = parsed.origin;
            } catch {
                // ignore invalid referer
            }
        }
        if (!clientOrigin) {
            clientOrigin = process.env.CLIENT_URL || "https://codedev-network-jmi.onrender.com";
        }
        clientOrigin = clientOrigin.replace(/\/$/, "");
        const resetLink = `${clientOrigin}/reset-password?token=${resetToken}`;

        // Send email via primary mail service
        const emailSent = await sendPasswordResetEmail({
            to: user.email,
            resetLink,
            resetUrl: resetLink,
            username: user.username,
            recipientName: user.username,
            expiresIn: "15 minutes",
            appName: "CodeDev-Network",
        });

        if (!emailSent) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({
                success: false,
                message: "Failed to send reset email. Please try again later.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email.",
        });
    } catch (err) {
        console.error("Forgot password error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Reset password with token
const resetPassword = async (req, res) => {
    try {
        const token = req.params.token || req.body.token || req.query.token;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Reset token is missing or invalid.",
            });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long",
            });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        }).select("+password +resetPasswordToken +resetPasswordExpire");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset link.",
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful! You can now log in with your new password.",
        });
    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export { login, register, logout, getUser, adminLogin, adminRegister, forgotPassword, resetPassword };