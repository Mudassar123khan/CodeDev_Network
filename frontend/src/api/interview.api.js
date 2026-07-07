import axios from "axios";

// Fetch all interview experiences with query params (search, difficulty, outcome, etc.)
export const fetchInterviews = async (url, token, params = {}) => {
  // If there's a token, send it, otherwise fetch without it (since list page is public)
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await axios.get(`${url}/interviews`, {
    params,
    headers,
  });
  return response.data;
};

// Fetch details of a single experience
export const fetchInterviewById = async (url, id, token) => {
  const response = await axios.get(`${url}/interviews/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};

// Post a new interview experience
export const createInterview = async (url, experienceData, token) => {
  const response = await axios.post(`${url}/interviews`, experienceData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
