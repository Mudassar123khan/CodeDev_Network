import { syncQueue } from "./sync.queue.js";
import scoreCalculator from "../services/leaderboard/scoreCalculator.js";
import syncUserPlatforms from "../services/platformSync/platformSync.service.js";

let isRunning = false;

async function startSyncWorker() {
  if (isRunning) return;
  isRunning = true;

  while (true) {
    if (syncQueue.length === 0) {
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }
    const user = syncQueue.shift();

    try {
      console.time("sync");
      await syncUserPlatforms(user); // Puppeteer runs here
      await scoreCalculator(user); //score calculator
      console.timeEnd("sync");
    } catch (err) {
      console.error("Sync failed:", user, err);
    }
  }
}

startSyncWorker();
