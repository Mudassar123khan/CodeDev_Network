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

export const updateUserPlatforms = async (url, platforms, token) => {
  const response = await axios.put(
    `${url}/getProfile/platforms`,
    { platforms },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};