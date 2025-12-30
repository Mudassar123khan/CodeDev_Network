import mongoose from "mongoose";
const {Schema} = mongoose;

const ProblemSchema= new Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    difficulty:{
        type:String,
        enum:["easy","medium","hard"],
    },
    tags:{
        type:Array,
        required:true
    },
    constraints:{
        type:String,
        required:true
    },
    testCases:{
        type:
    }
});