import mongoose, { mongo } from "mongoose";
const {Schema} = mongoose;

const SubmissionSchema=new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    problemId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Problem",
        required:true
    },
    code:{
        type:String,
        required:true
    },
    language:{
        type:String,
        enum:["cpp", "java"],
        required:true,
        lowercase:true,
    },
    verdict:{
        type:String,
        enum:["AC","WA","TLE","RE"],
        required:true
    },
    executionTime:{
        type:Number,
    },
},
{
    timestamps:true
});

SubmissionSchema.index({ userId: 1 });
SubmissionSchema.index({ problemId: 1 });
SubmissionSchema.index({ userId: 1, problemId: 1 });

const Submission = mongoose.model("Submission",SubmissionSchema);
export default Submission;