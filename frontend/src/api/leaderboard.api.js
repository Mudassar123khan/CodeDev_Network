import axios from "axios";

const leaderboard = async (plat, url, token) => {
  const response = await axios.get(`${url}/leaderboard`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { platform: plat },
  });

  return response.data;
};

export { leaderboard };
