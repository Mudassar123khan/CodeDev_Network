import { startContestStatusWorker } from "../services/contestStatus.service.js";

if (process.env.NODE_ENV !== "test") {
  startContestStatusWorker(30000); // Check and sync every 30 seconds
  console.log("Contest status sync worker started (30s interval).");
}

export { startContestStatusWorker };
