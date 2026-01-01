import Problem from '../models/Problem.js';

const createProblem = async (req,res)=>{
    try{
        const {title, description,difficulty,tags,constraints, slug,testCases} = req.body;
        if(!title || !description || !difficulty || !tags || !constraints || !slug || !testCases || tags.length===0 || testCases.length===0){
            return res.status(400).json({
                success:false,
                message:"All field are required"
            });
        }

        //checking if the same problem exists 
        const existingProblem = await Problem.findOne({slug});
        if(existingProblem){
            return res.status(409).json({
                success:false,
                message:"Problem exists"
            });
        }


        //creating the problem
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
        res.status(201).json({
            success:true,
            message:"Problem created",
            data: {
            id: newProblem._id,
            title: newProblem.title,
            slug: newProblem.slug,
            difficulty: newProblem.difficulty,
      },
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
    try{
        const problems = await Problem.find({});

        res.status(200).json({
            success:true,
            count:problems.length,
            data:problems,
            message:"All Problems"
        });
    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error",
        });
    }
}

const getOneProblem = async (req,res)=>{
    try{
        const {slug} = req.params;

        if(!slug){
            return res.status(400).json({
                success:false,
                message:"Slug is required",
            });
        }
        const problem = await Problem.findOne({slug});

        if (!problem) {
            console.log("Problem not found");
            return res.status(404).json({
            success: false,
            message: "Problem not found",
            });
        }
        console.log("Problem found");
        res.status(200).json({
            success:true,
            message:"Problem found",
            data:problem
        });

    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

const updateProblem = async (req,res)=>{
    
}

const deleteProblem = async (req,res)=>{
    console.log("Delete problem");
}

export {createProblem,getOneProblem,getProblems,updateProblem,deleteProblem}