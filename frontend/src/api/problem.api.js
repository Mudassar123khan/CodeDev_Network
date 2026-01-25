import axios from 'axios';

const fetchProblemsAPI = async (url)=>{
    const response = await axios.get(`${url}/problems`);
    return response.data.data;
}

const fetchOneProblemAPI = async (url, slug)=>{
    const response = await axios.get(`${url}/problems/${slug}`);
    return response.data.data;
}

export {fetchProblemsAPI,fetchOneProblemAPI};