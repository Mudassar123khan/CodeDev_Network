import axios from "axios";

const createSubmission = async (url,data,token)=>{
    const response = await axios.post(`${url}/submissions`,data,{headers:{
        Authorization:`Bearer ${token}`
    }});

    return response.data;
}

export {createSubmission};