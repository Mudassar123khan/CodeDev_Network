import mongoose from "mongoose";

const {Schema} = mongoose;

const ContestSchema = new Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    slug:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        lowercase:true,
        index:true,
    },
    problems:[
        {
            problemId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Problem",
                required:true
            },
            order:{
                type:Number,
                required:true,
            },
            points:{
                type:Number,
                required:true,
            },
        },
    ],
    startTime:{
        type:Date,
        required:true,
    },
    endTime:{
        type:Date,
        required:true,
    },
    participants:[
        {
            type:Schema.Types.ObjectId,
            ref:"User",
        },
    ],
    status:{
        type:String,
        enum:["upcoming","running","ended"],
        default:"upcoming",
        index:true
    },

},
{
    timestamps:true,
},
);

const Contest = mongoose.model("Contest",ContestSchema);

export default Contest;