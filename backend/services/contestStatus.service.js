import Contest from "../models/Contest.js";

/**
 * Computes the real-time status of a contest deterministically based on its schedule.
 *
 * @param {Object} contest - Contest object containing startTime and endTime
 * @param {Date|number} [now=new Date()] - Reference timestamp
 * @returns {"upcoming" | "running" | "ended"}
 */
export const computeContestStatus = (contest, now = new Date()) => {
  if (!contest || !contest.startTime || !contest.endTime) {
    return "upcoming";
  }
  const currentTime = new Date(now).getTime();
  const startTime = new Date(contest.startTime).getTime();
  const endTime = new Date(contest.endTime).getTime();

  if (currentTime < startTime) {
    return "upcoming";
  }
  if (currentTime >= endTime) {
    return "ended";
  }
  return "running";
};

/**
 * Synchronizes contest statuses in MongoDB based on the current timestamp.
 * Handles both upcoming -> running and running/upcoming -> ended transitions.
 *
 * @param {Date} [now=new Date()]
 * @returns {Promise<{ updatedToRunning: number, updatedToEnded: number }>}
 */
export const syncContestStatuses = async (now = new Date()) => {
  try {
    const toRunning = await Contest.updateMany(
      { status: "upcoming", startTime: { $lte: now } },
      { $set: { status: "running" } }
    );

    const toEnded = await Contest.updateMany(
      { status: { $in: ["upcoming", "running"] }, endTime: { $lte: now } },
      { $set: { status: "ended" } }
    );

    return {
      updatedToRunning: toRunning.modifiedCount || 0,
      updatedToEnded: toEnded.modifiedCount || 0,
    };
  } catch (error) {
    console.error("Error synchronizing contest statuses:", error.message);
    return { updatedToRunning: 0, updatedToEnded: 0, error: error.message };
  }
};

let statusInterval = null;

/**
 * Starts a recurring background interval to keep contest statuses in MongoDB fresh.
 *
 * @param {number} [intervalMs=30000] - Interval in milliseconds (default: 30 seconds)
 * @returns {NodeJS.Timeout}
 */
export const startContestStatusWorker = (intervalMs = 30000) => {
  if (statusInterval) {
    return statusInterval;
  }

  // Execute initial sync immediately
  syncContestStatuses().catch((err) => {
    console.error("Initial contest status sync failed:", err.message);
  });

  statusInterval = setInterval(() => {
    syncContestStatuses().catch((err) => {
      console.error("Periodic contest status sync failed:", err.message);
    });
  }, intervalMs);

  return statusInterval;
};

/**
 * Stops the background contest status worker interval.
 */
export const stopContestStatusWorker = () => {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
};
