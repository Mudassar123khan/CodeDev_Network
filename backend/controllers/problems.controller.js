import Problem from '../models/Problem.js';

const createProblem = async (req,res)=>{
    try{
        const {title, description,difficulty,tags,constraints, createdBy, slug,testCases} = req.body;
        if(!title || !description || !difficulty || !tags || !constraints || !slug || !testCases){
            return res.status(400).json({
                success:false,
                message:"All field are required"
            });
        }

        const newProblem =await Problem.create({
            title,
            description,
            difficulty,
            tags,
            constraints,
            createdBy:req.user.id,
            slug,
            testCases
        });

        console.log("Problem created");
        res.status(200).json({
            success:true,
            message:"Problem created"
        });
    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

const getProblems = async (req,res)=>{
    console.log("GEt problems");
}

const getOneProblem = async (req,res)=>{
    console.log("Get one problem");
}

const updateProblem = async (req,res)=>{
    console.log("Update problem");
}

const deleteProblem = async (req,res)=>{
    console.log("Delete problem");
}

export {createProblem,getOneProblem,getProblems,updateProblem,deleteProblem}