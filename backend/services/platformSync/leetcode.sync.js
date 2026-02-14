import axios from "axios";

const fetchLeetcodeStats = async (handle) => {
  const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

  // This query specifically targets the solved counts for all difficulties
  const graphqlQuery = {
    query: `
      query userPublicProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
        }
      }
    `,
    variables: { username: handle },
  };

  try {
    const response = await axios.post(LEETCODE_GRAPHQL_URL, graphqlQuery, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0", // Helps prevent basic bot blocking
      },
    });

    const data = response.data.data;

    if (!data.matchedUser) {
      throw new Error(`User "${handle}" not found on LeetCode.`);
    }

    // Find the total solved count from the array
    const submissionStats = data.matchedUser.submitStats.acSubmissionNum;
    const totalSolved = submissionStats.find((s) => s.difficulty === "All")?.count || 0;

    return {
      handle,
      rating: 0, // Contest rating requires a separate query field if needed
      solvedCount: totalSolved,
      lastSynced: new Date(),
    };
  } catch (err) {
    console.error(`LeetCode GraphQL Sync Error: ${err.message}`);
    // Return a default object or null so your worker doesn't crash
    return {
      handle,
      rating: 0,
      solvedCount: 0,
      lastSynced: new Date(),
      error: err.message
    };
  }
};

export default fetchLeetcodeStats;