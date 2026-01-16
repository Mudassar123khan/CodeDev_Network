import axios from "axios";

const leaderboard = async (platform,url,token)=>{
    const response = await axios.get(`${url}/leaderboard`,{headers:{Authorization:`Bearer ${token}`}},{params:{platform}});
    return response.data;
}

export {leaderboard};