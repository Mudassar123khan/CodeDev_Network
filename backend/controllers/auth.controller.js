import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
                success:true,
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

//register controller
const register = async(req,res)=>{
    try{
        const {username,email, password, platforms}= req.body;

        if(!username || !email || !password){
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
            return res.status(409).json({success:false, message:"user already registered"});
        }

        //hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        //creating user in db
        const newUser =await User.create({
            username,
            email,
            password:hashedPassword,
            platforms:{
                ...platforms
            }
        });

        //creating jwt token
        const token = jwt.sign(
            {id:newUser._id,role:newUser.role},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        );
        

        console.log("User saved");

        //sending response
        res.status(201).json({
            success:true,
            message:"User registered",
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

const logout = async()=>{
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
                role:user.role
            }
        });
   }catch(err){
    console.log(`An error occured ${err.message}`);
    return res.status(500).json({
        success:false,
        message:"Internal server error",
    });
   }
}

export {login,register,logout,getUser};