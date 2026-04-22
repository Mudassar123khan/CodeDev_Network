import axios from 'axios';

const getHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// User Admin Logic
export const getAllUsers = async (url, token) => {
  return await axios.get(`${url}/admin/users`, getHeaders(token));
};

export const createUser = async (url, token, data) => {
  return await axios.post(`${url}/admin/users`, data, getHeaders(token));
};

export const updateUser = async (url, token, id, data) => {
  return await axios.put(`${url}/admin/users/${id}`, data, getHeaders(token));
};

export const deleteUser = async (url, token, id) => {
  return await axios.delete(`${url}/admin/users/${id}`, getHeaders(token));
};

export const syncAllUsersApi = async (url, token) => {
  return await axios.post(`${url}/admin/users/sync-all`, {}, getHeaders(token));
};

export const syncSingleUser = async (url, token, id) => {
  return await axios.post(`${url}/admin/users/${id}/sync`, {}, getHeaders(token));
};

// Problem Admin Logic (Reusing existing problem backend APIs)
export const getAllProblems = async (url) => {
  // Existing route returns all problems 
  return await axios.get(`${url}/problems?admin=true`); 
};

export const createProblem = async (url, token, data) => {
  return await axios.post(`${url}/problems`, data, getHeaders(token));
};

export const updateProblem = async (url, token, id, data) => {
  return await axios.patch(`${url}/problems/${id}`, data, getHeaders(token));
};

export const deleteProblem = async (url, token, id) => {
  return await axios.delete(`${url}/problems/${id}`, getHeaders(token));
};

// Contest Admin Logic
export const getAllContests = async (url, token) => {
  return await axios.get(`${url}/contest`, getHeaders(token));
};

export const createContest = async (url, token, data) => {
  return await axios.post(`${url}/contest/create`, data, getHeaders(token));
};

export const updateContest = async (url, token, id, data) => {
  return await axios.put(`${url}/contest/${id}`, data, getHeaders(token));
};

export const deleteContest = async (url, token, id) => {
  return await axios.delete(`${url}/contest/${id}`, getHeaders(token));
};
