import axios from 'axios';
const register = async (data,url)=>{

    
    const response =await axios.post(`${url}/auth/register`,data);
    return response;
}

export default register;