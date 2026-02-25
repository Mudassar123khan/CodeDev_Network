import User from "../models/User.js";
import ExternalStats from "../models/ExternalStats.js";

export const getProfile = async (req, res) => {
  try {
    const { username } = req.params;

    //Fetch user
    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    //Fetch external stats
    const stats = await ExternalStats.findOne({ userId: user._id }).lean();

    // If stats not present yet
    if (!stats) {
      return res.status(200).json({
        success: true,
        data: {
          user,
          stats: null,
          ranking: null
        }
      });
    }

    // Calculate college rank based on totalScore
    const higherRanked = await ExternalStats.countDocuments({
      totalScore: { $gt: stats.totalScore }
    });

    const totalStudents = await ExternalStats.countDocuments();

    const collegeRank = higherRanked + 1;

    // Build response
    res.json({
      success: true,
      data: {
        basic: {
          username: user.username,
          email: user.email,
          joinedAt: user.createdAt
        },
        ranking: {
          totalScore: stats.totalScore,
          totalSolved: stats.totalSolved,
          collegeRank,
          totalStudents
        },
        platforms: stats.platforms,
        platformScores: stats.platformScores,
        meta: {
          lastSyncedAt: stats.lastSyncedAt,
          syncStatus: stats.syncStatus
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export default getProfile;