import ExternalStats from "../models/ExternalStats.js";


const getleaderBoard = async (req,res)=>{

    try{
        const platform = req.query.platform; // codeforces | codechef | gfg | leetcode

        const sortField = platform
        ? { [`platformScores.${platform}`]: -1 }
        : { totalScore: -1 };


        const leaderboard = await ExternalStats.find()
        .select("userId totalSolved totalScore platformScores")   // only required fields
        .populate("userId", "username -_id")
        .sort(sortField);


        if(leaderboard.length === 0){
            return res.status(404).json({
                success:false,
                message:"No data found"
            });
        }

        const rankedLeaderboard = leaderboard.map((item, index) => ({
            rank: index + 1,
            ...item._doc
            }));


        res.status(200).json({
            success:true,
            message:"Data found",
            data:rankedLeaderboard,
        });
        
    }catch(err){
        console.log(`An error occured, message: ${err.message}`);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

export default getleaderBoard;