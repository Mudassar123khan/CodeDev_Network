import axios from 'axios';

// function to call the register api
const register = async (data, url) => {
    const response = await axios.post(`${url}/auth/register`, data);
    return response;
};

// function to call the login api
const login = async (data, url) => {
    const response = await axios.post(`${url}/auth/login`, data);
    return response;
};

// function to call forgot password api (request reset link)
const forgotPassword = async (email, url) => {
    const response = await axios.post(`${url}/auth/forgot-password`, { email });
    return response;
};

// function to call reset password api with token
const resetPassword = async (token, password, url) => {
    const endpoint = token ? `${url}/auth/reset-password/${encodeURIComponent(token)}` : `${url}/auth/reset-password`;
    const response = await axios.post(endpoint, { password, token });
    return response;
};

export { register, login, forgotPassword, resetPassword };