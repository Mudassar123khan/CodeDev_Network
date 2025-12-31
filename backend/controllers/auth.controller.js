import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const login = async()=>{
    console.log("Login");
};


const register = async(req,res)=>{
    try{
        const {username,email, password}= req.body;

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
            message:"Server Error"
        });
    }
};

const logout = async()=>{
    console.log("Logout");
};

const getUser = async()=>{
    console.log("I am XtremeWinger");
}

export {login,register,logout,getUser};