import ExternalStats from "../../models/ExternalStats.js";
import fetchGfgStats from "./gfg.syncs.js";
import fetchCodeForcesStats from "./codeforces.sync.js";
import fetchCodechefStats from "./codechef.sync.js";
import fetchLeetcodeStats from "./leetcode.sync.js";

const syncUserPlatforms = async (user) => {
  let gfgDetails = null;
  let codeforcesDetails = null;
  let codechefDetails = null;
  let leetcodeDetails = null;

  if (user.platforms.gfg) {
    gfgDetails = await fetchGfgStats(user.platforms.gfg);
  }

  if (user.platforms.codeforces) {
    codeforcesDetails = await fetchCodeForcesStats(user.platforms.codeforces);
  }

  if (user.platforms.codechef) {
    codechefDetails = await fetchCodechefStats(user.platforms.codechef);
  }

  if(user.platforms.leetcode){
    leetcodeDetails = await fetchLeetcodeStats(user.platforms.leetcode);
  }

  const platforms = {
    gfg: gfgDetails,
    codeforces: codeforcesDetails,
    codechef: codechefDetails,
    leetcode: leetcodeDetails
  };

  const totalSolved =
    (gfgDetails?.solvedCount || 0) +
    (codeforcesDetails?.solvedCount || 0) +
    (codechefDetails?.solvedCount || 0) +
    (leetcodeDetails?.solvedCount || 0);

  const stats = await ExternalStats.findOneAndUpdate(
    { userId: user._id },
    {
      userId: user._id,
      platforms,
      totalSolved,
      lastSyncedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return stats;
};

export default syncUserPlatforms;