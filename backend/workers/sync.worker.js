import { syncQueue } from "./sync.queue.js";
import scoreCalculator from "../services/leaderboard/scoreCalculator.js";
import syncUserPlatforms from "../services/platformSync/platformSync.service.js";
import ExternalStats from "../models/ExternalStats.js";
import { clearCacheByPrefix } from "../services/cache.service.js";

let isRunning = false;

async function startSyncWorker() {
  if (isRunning) return;
  isRunning = true;

  while (true) {
    if (syncQueue.length === 0) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    const user = syncQueue.shift();
    const userId = user._id;
    try {
      //updating the status in db
      await ExternalStats.updateOne(
        { userId: userId },
        { syncStatus: "syncing", lastSyncError: null },
      );

      //sync worker starts
      console.time("sync");
      await syncUserPlatforms(user); // Puppeteer runs here
      await scoreCalculator(user); //score calculator
      console.log(user.username);
      console.timeEnd("sync");

      //updating the status in db
      await ExternalStats.updateOne(
        { userId: userId },
        { syncStatus: "done", lastSyncedAt: new Date() },
      );

      // Invalidate leaderboard cache
      await clearCacheByPrefix("leaderboard:");
    } catch (err) {
      //updating the status in db
      await ExternalStats.updateOne(
        { userId: userId },
        { syncStatus: "failed", lastSyncError: err.message },
      );
      console.error("Sync failed:", user, err);
    }
  }
}

startSyncWorker();
