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

export const uploadProfileImage = async (url, file, token) => {
  const formData = new FormData();
  formData.append("profileImage", file);

  const response = await axios.put(
    `${url}/getProfile/profile-image`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};