import mongoose from "mongoose";
const {Schema} = mongoose;

const ProblemSchema= new Schema({
    title:{
        type:String,
        trim:true,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    difficulty:{
        type:String,
        enum:["easy","medium","hard"],
        required:true
    },
    tags:{
        type:[String],
        required:true,
        index:true
    },
    constraints:{
        type:String,
        default:""
    },
    testCases:[
       {
        input:{
            type:String,
            required:true,
        },
        output:{
            type:String,
            required:true
        },
        isSample:{
            type:Boolean,
            default:false
        },
       }
    ],
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    slug:{
        type:String,
        unique:true,
        index:true,
        required:true,
        lowercase:true,
        trim:true,
    }
},
{
    timestamps:true
}

);

const Problem = mongoose.model("Problem",ProblemSchema);
export default Problem;