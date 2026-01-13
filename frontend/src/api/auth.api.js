import axios from 'axios';

//funciton to call the register api
const register = async (data,url)=>{
    //calling the register api
    const response =await axios.post(`${url}/auth/register`,data);
    return response;
}


//function to call the login api
const login = async (data,url)=>{
    const response = await axios.post(`${url}/auth/login`,data);
    return response;
}
export {register,login};