import User from "../models/User.js";
import { syncQueue } from "../workers/sync.queue.js";

export const syncUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    //pushing the user in the sync queue
    syncQueue.push(user);

    return res.status(200).json({
      success: true,
      message: "queued"
    });
  } catch (err) {
    console.error("Sync error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
