import axios from "axios";

const fetchLeetcodeStats = async (handle) => {
  const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

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
        userContestRanking(username: $username) {
          rating
          globalRanking
          topPercentage
          attendedContestsCount
        }
      }
    `,
    variables: { username: handle },
  };

  try {
    const response = await axios.post(LEETCODE_GRAPHQL_URL, graphqlQuery, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const { matchedUser, userContestRanking } = response.data.data;

    if (!matchedUser) {
      throw new Error(`User "${handle}" not found on LeetCode.`);
    }

    // Extract solved count
    const submissionStats = matchedUser.submitStats.acSubmissionNum;
    const totalSolved = submissionStats.find((s) => s.difficulty === "All")?.count || 0;

    return {
      handle,
      // userContestRanking will be null if the user has never participated in a contest
      rating: userContestRanking ? Math.round(userContestRanking.rating) : 0,
      globalRanking: userContestRanking?.globalRanking || 0,
      solvedCount: totalSolved,
      lastSynced: new Date(),
    };
  } catch (err) {
    console.error(`LeetCode GraphQL Sync Error: ${err.message}`);
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
