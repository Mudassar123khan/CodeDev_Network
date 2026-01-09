import ExternalStats from "../../models/ExternalStats.js";
import {WEIGHTS, scoreMultiplier} from '../../config/weights.js';

//function to calculate score and store it in db
const scoreCalculator = async (user)=>{
   try{
     //finding the stats of a user by id of the user
        const userStats = await ExternalStats.findOne({userId:user._id});

        //checking if ExternalStats are fetched or not
        if(!userStats) return null;

        const codeforcesScore = userStats.platforms?.codeforces?.solvedCount*scoreMultiplier*WEIGHTS.codeforces;
        const codechefScore = userStats.platforms?.codechef?.solvedCount*scoreMultiplier*WEIGHTS.codechef;
        const leetcodeScore = userStats.platforms?.leetcode?.solvedCount*scoreMultiplier*WEIGHTS.leetcode || 0;
        const gfgScore = userStats.platforms?.gfg?.solvedCount*scoreMultiplier*WEIGHTS.gfg;

        const totalScore = codeforcesScore+codechefScore+gfgScore+leetcodeScore;

        const updatedStats = await ExternalStats.findOneAndUpdate({userId:user._id},{
            platformScores:{
                codeforces:codeforcesScore,
                leetcode:leetcodeScore,
                codechef:codechefScore,
                gfg:gfgScore
            },
            totalScore
        },
        {new:true}
        );

        

        return updatedStats;

   }catch(err){
    console.log(`An error occured, message: ${err.message}`);
   }   
}

export default scoreCalculator;