import {fetchGfgStats} from "./gfg.syncs.js";
import fetchCodeForcesStats from './codeforces.sync.js';
import fetchCodechefStats from './codechef.sync.js';
import fetchLeetcodeStats from './leetcode.sync.js';
import User from '../../models/User.js';
import ExternalStats from '../../models/ExternalStats.js';

const syncsUser = async (req,res)=>{

    try{
        const user = await User.findById(req.user.id);
        //checking if user exists or not
        if(!user){
            res.status(404).json({
                success:false,
                message:"User not found"
            });
        }

/////////////////////////////calling the api and scrappers/////////////////////////////////
        
        //gfg
        if(user.platforms.gfg.length !==0 ){
            const gfgDetails = await fetchGfgStats(user.platforms.gfg);
        }
        
        //codeforces
        if(user.platforms.codeforces.length !==0){
            const codeforcesDetails = await fetchCodeForcesStats(user.platforms.codeforces);
        }

        //codechef
        if(user.platforms.codechef.length !==0){
            const codechefDetails = await fetchCodechefStats(user.platforms.codechef);
        }

        //leetcode
        if(user.platforms.leetcode.length !==0){
            const leetcodeDetails = await fetchLeetcodeStats(user.platforms.leetcode);
        }

        const platforms = {
            codeforces:{
                ...codeforcesDetails
            },
            codechef:{
                ...codechefDetails
            },
            leetcode:{
                ...leetcodeDetails
            },
            gfg:{
                ...gfgDetails
            }
        }

///////////////////////////////////////////////////////////////////////////////////////////////////////
        const newStats = await ExternalStats.create({
            userId:req.user.id,
            platforms
        });

        if(!newStats){
            res.status(404).json({
                success:false,
                message:"Stats not created"
            });
        }

        res.status(201).json({
            success:true,
            message:"Stats synced",
            data:{
                totalSolved: codechefDetails.solvedCount+codeforcesDetails.solvedCount+leetcodeDetails.solvedCount+gfgDetails.solvedCount
            }
        });

    }catch(err){
        console.log(`An error occured while syncing service, message:${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}