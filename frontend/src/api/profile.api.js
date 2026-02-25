import axios from "axios";

export const fetchUserProfile = async (url, username, token) => {
  const response = await axios.get(
    `${url}/getProfile/${username}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data;
};