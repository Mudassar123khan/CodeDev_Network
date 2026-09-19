import axios from "axios";

// Submit a contact query or suggestion
export const submitContactMessage = async (url, contactData, token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await axios.post(`${url}/contact`, contactData, {
    headers,
  });
  return response.data;
};
