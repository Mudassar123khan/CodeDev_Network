import mongoose from "mongoose";
const {Schema} = mongoose;

const UserSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,  //removes the whitespaces
        maxlength:20,
        minlength:3
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password:{
        type:String,
        required:true,
        select:false,  // it means that when the user is fetched then password will not be fetched in the query
        minlength:8
    },
    role:{
        type:String,
        enum: ["user", "admin"],   //enum is an array which stores allowed values, values which are not in this array will be wrong
        default:"user"
    },
    rating:{
        type:Number,
        default:0
    },
    solvedCount:{
        type:Number,
        default:0
    },
    platforms: {
    codeforces: { type: String, trim: true, default:"" },
    leetcode: { type: String, trim: true, default:"" },
    codechef: { type: String, trim: true, default:"" },
    gfg: { type: String, trim: true, default:"" }
    },

    },

    {
        timestamps:true
    }
);

const User = mongoose.model("User",UserSchema);

export default User;