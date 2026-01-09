import User from "../models/User.js";
import scoreCalculator from "../services/leaderboard/scoreCalculator.js";
import syncUserPlatforms from "../services/platformSync/platformSync.service.js";

export const syncUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await syncUserPlatforms(user);
    await scoreCalculator(user);

    return res.status(200).json({
      success: true,
      message: "Platforms synced successfully"
    });
  } catch (err) {
    console.error("Sync error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
