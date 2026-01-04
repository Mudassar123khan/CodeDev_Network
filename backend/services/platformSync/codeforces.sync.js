import axios from "axios";

const CF_BASE_URL = "https://codeforces.com/api";


//function to fetch the codeforces data using the codeforces api
const fetchCodeForcesStats = async (handle)=>{
    if(!handle) return null;

    try{

        //getting the user profile data
        const userInfoRes =await axios.get(`${CF_BASE_URL}/user.info`,{params:{handles:handle}});
        const user = userInfoRes.data.result[0];

        //getting the user's solved count and status
        const userStatusRes = await axios.get(`${CF_BASE_URL}/user.status`,{params:{handle:handle}});
        const submissions = userStatusRes.data.result;

        //calculating the number of solved problems
        const solvedSet = new Set();
        submissions.forEach(element => {
            if(element.verdict === "OK"){
                solvedSet.add(`${element.problem.contestId}-${element.problem.index}`);
            }
        });

        return {
            handle,
            rating:user.rating || 0,
            solvedCount:solvedSet.size,
            lastSynced:new Date(),
        }

    }catch(err){
        console.log(`CodeForces sync failed ${err.message}`);
        console.error("Codeforces sync failed",err.message);
    }
}