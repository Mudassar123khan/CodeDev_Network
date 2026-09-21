import Problem from '../models/Problem.js';
import jwt from 'jsonwebtoken';

const getRequesterRole = (req) => {
    try {
        const authHeader = req.headers?.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.role;
        }
    } catch {
        // invalid or expired token
    }
    return null;
};

const createProblem = async (req,res)=>{
    try{
        const {title, description,difficulty,tags,constraints, slug,testCases, isContestProblem} = req.body;
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
            testCases,
            isContestProblem: !!isContestProblem
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
        const role = getRequesterRole(req);
        // Only authenticated admins can query all problems including unreleased contest problems
        const filter = (req.query.admin === 'true' && role === 'admin') 
            ? {} 
            : { isContestProblem: { $ne: true } };
            
        const problems = await Problem.find(filter).lean();

        // Strip hidden test cases for non-admin callers to prevent test case leakage
        const sanitizedProblems = role === 'admin' 
            ? problems 
            : problems.map(p => ({
                ...p,
                testCases: (p.testCases || []).filter(tc => tc.isSample)
            }));

        res.status(200).json({
            success:true,
            count:sanitizedProblems.length,
            data:sanitizedProblems,
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
        const problem = await Problem.findOne({slug}).lean();

        if (!problem) {
            console.log("Problem not found");
            return res.status(404).json({
                success: false,
                message: "Problem not found",
            });
        }
        
        const role = getRequesterRole(req);

        if (problem.isContestProblem && role !== 'admin') {
            const Contest = (await import('../models/Contest.js')).default;
            const contest = problem.contest 
              ? await Contest.findById(problem.contest).lean() 
              : await Contest.findOne({ "problems.problemId": problem._id }).lean();
              
            if (contest) {
                const now = new Date();
                if (now < contest.startTime) {
                    return res.status(403).json({
                        success: false,
                        message: "This problem is part of an upcoming contest and is not yet available.",
                    });
                }
            }
        }

        // Return all test cases for admins (to manage/edit), but only sample test cases for students
        const responseData = role === 'admin'
            ? problem
            : {
                ...problem,
                testCases: (problem.testCases || []).filter(tc => tc.isSample)
            };

        console.log("Problem found");
        res.status(200).json({
            success:true,
            message:"Problem found",
            data:responseData
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
    try{
        const {id} = req.params;
        
        //deciding the allowed fields which can be updated
        const allowedFields = [
            "title",
            "description",
            "difficulty",
            "tags",
            "constraints",
            "testCases",
            "slug",
            "isContestProblem"
        ];

        //object storing the updates
        const updates = {};

        //adding the updates in the updates object
        allowedFields.forEach((field)=>{
            if(req.body[field]!=undefined){
                updates[field]=req.body[field];
            }
        });

        //checking if admin has sent any updates or not
        if(Object.keys(updates).length ===0){
            return res.status(400).json({
                success:false,
                message:"No valid fields to update"
            });
        }

        //checking if given slug for update already exists
        if(updates.slug){
            const exists = await Problem.findOne({slug:updates.slug});

            if(exists && exists._id.toString()!==id){
                return res.status(409).json({
                    success:false,
                    message:"slug already exists"
                });
            }
        }

        //updating the given fields
        const updatedProblem = await Problem.findByIdAndUpdate(id,updates,{returnDocument: 'after'}).select("-testCases");

        //returning if problem with given id (id) not found
        if(!updatedProblem){
            return res.status(404).json({
                success:false,
                message:"Problem not found"
            });
        }


        res.status(200).json({
            success:true,
            message:"Updated successfully",
            data:updatedProblem
        });
    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error",
        });
    }
}

const deleteProblem = async (req,res)=>{
    try{const {id} = req.params;

    const deletedProblem = await Problem.findByIdAndDelete(id);

    if(!deletedProblem){
        return res.status(404).json({
            success:false,
            message:"Problem not found"
        });
    }

    res.status(200).json({
        success:true,
        message:"Problem deleted",
        data:{id}
    });
    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

export {createProblem,getOneProblem,getProblems,updateProblem,deleteProblem}