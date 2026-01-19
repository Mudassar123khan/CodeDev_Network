import axios from "axios";

const syncUser = async (url,token)=>{
    const response = await axios.post(`${url}/sync/platforms`,{},{
        headers:{
            Authorization:`Bearer ${token}`
        }
    });

    return response.data;
}

export{syncUser};