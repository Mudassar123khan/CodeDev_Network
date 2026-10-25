import axios from "axios";

/**
 * Public: Fetch B.Tech placement statistics from DB
 */
export const fetchPlacementStats = async (url) => {
  const response = await axios.get(`${url}/placements`);
  return response.data;
};
