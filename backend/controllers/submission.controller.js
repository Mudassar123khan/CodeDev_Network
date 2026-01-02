import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';

const createSubmission = async (req,res)=>{
    try{
        const {problemId,code,language} = req.body;
        const userId = req.user.id;

        //using mocked value of verdict and execution time
        const verdict = "AC";
        const executionTime = "1";

        //checking if problem exists
        const problem = await Problem.findById(problemId);
        if(!problem){
            return res.status(404).json({
                success:false,
                message:"Problem not found"
            });
        }

        //validating parameters
        if(!userId || !problemId || !code || !language || !verdict || !executionTime){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            });
        }
        
        //creating new Submission
        const newSubmission = await Submission.create({
            userId,
            problemId,
            code,
            language,
            verdict,
            executionTime
        });

        if(!newSubmission){
            return res.status(404).json({
                success:false,
                message:"Submission not created"
            });
        }

        res.status(201).json({
            success:true,
            message:"Submission created",
            data:{
                id:newSubmission._id,
                verdict:newSubmission.verdict,
                executionTime:newSubmission.executionTime,
            }
        });

    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

const getSubmissions = async (req,res)=>{
    try{
        const submissions = await Submission.find({userId:req.user.id}).sort({createdAt:-1}).select("-code");
        

        res.status(200).json({
            success:true,
            message:"submissions found",
            count:submissions.length,
            data:submissions
        });

    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

const getOneSubmission = async (req,res)=>{
    try{
        const submissionId = req.params.id;

        const submission = await Submission.findById(submissionId);

        //checking if submission exists or not
        if(!submission){
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        //sending the submission if the logedIn user is admin
        if(req.user.role === "admin"){
            return res.status(200).json({
                success:true,
                message:"Submissions found",
                data:submission
            });
        }

        if(submission.userId.toString() !== req.user.id){
            return res.status(403).json({
                success:false,
                message:"Forbidden",
            });
        }
        
        res.status(200).json({
            success:true,
            message:"Submission found",
            data:submission
        });
    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

const getAllSubmissionsOfaProblem = async (req,res)=>{
    try{
        const slug = req.params.slug;

        //finding the problem with given slug
        const problem = await Problem.findOne({slug});

        //checking if problem with given slug exists or not
        if (!problem) {
            return res.status(404).json({
            success: false,
            message: "Problem not found",
            });
        }

        //finding the submissions attached with the problem
        const submission = await Submission.find({problemId:problem._id,userId:req.user.id}).sort({createdAt:-1}).select("-code");

        //checking if submission exists or not
        if(submission.length===0){
            return res.status(404).json({
                success:false,
                message:"Submission not found"
            });
        }

        //seding response
        res.status(200).json({
            success:true,
            message:"Submission found",
            data:submission
        });

    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

export {createSubmission,getOneSubmission,getSubmissions,getAllSubmissionsOfaProblem};