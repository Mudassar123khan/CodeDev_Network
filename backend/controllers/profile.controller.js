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

    const userPlatforms = user.platforms || {
      codeforces: "",
      leetcode: "",
      codechef: "",
      gfg: ""
    };

    // If stats not present yet
    if (!stats) {
      return res.status(200).json({
        success: true,
        data: {
          basic: {
            username: user.username,
            email: user.email,
            joinedAt: user.createdAt,
            branch: user.branch,
            graduationYear: user.graduationYear
          },
          ranking: {
            totalScore: 0,
            totalSolved: 0,
            collegeRank: "N/A",
            totalStudents: 0
          },
          platforms: {
            codeforces: { handle: userPlatforms.codeforces || "", rating: 0, solvedCount: 0 },
            leetcode: { handle: userPlatforms.leetcode || "", rating: 0, solvedCount: 0 },
            codechef: { handle: userPlatforms.codechef || "", rating: 0, solvedCount: 0 },
            gfg: { handle: userPlatforms.gfg || "", rating: 0, solvedCount: 0 }
          },
          platformScores: {
            codeforces: 0,
            leetcode: 0,
            codechef: 0,
            gfg: 0
          },
          userPlatforms,
          meta: {
            lastSyncedAt: null,
            syncStatus: "idle"
          }
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
          joinedAt: user.createdAt,
          branch: user.branch,
          graduationYear: user.graduationYear
        },
        ranking: {
          totalScore: stats.totalScore,
          totalSolved: stats.totalSolved,
          collegeRank,
          totalStudents
        },
        platforms: stats.platforms || {},
        platformScores: stats.platformScores || {},
        userPlatforms,
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

export const updatePlatforms = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { platforms } = req.body;
    if (!platforms || typeof platforms !== "object") {
      return res.status(400).json({ success: false, message: "Platforms data is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.platforms) {
      user.platforms = {
        codeforces: "",
        leetcode: "",
        codechef: "",
        gfg: ""
      };
    }

    // Sanitize and update handles
    if (platforms.leetcode !== undefined) {
      user.platforms.leetcode = typeof platforms.leetcode === "string" ? platforms.leetcode.trim().slice(0, 50) : "";
    }
    if (platforms.codeforces !== undefined) {
      user.platforms.codeforces = typeof platforms.codeforces === "string" ? platforms.codeforces.trim().slice(0, 50) : "";
    }
    if (platforms.codechef !== undefined) {
      user.platforms.codechef = typeof platforms.codechef === "string" ? platforms.codechef.trim().slice(0, 50) : "";
    }
    if (platforms.gfg !== undefined) {
      user.platforms.gfg = typeof platforms.gfg === "string" ? platforms.gfg.trim().slice(0, 50) : "";
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Coding platform usernames updated successfully",
      platforms: user.platforms
    });
  } catch (error) {
    console.error("Error updating platforms:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default getProfile;