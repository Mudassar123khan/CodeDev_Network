import "./Leaderboard.css";
import { leaderboard } from "../../api/leaderboard.api";
import { syncUser } from "../../api/sync.api";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [platform, setPlatform] = useState("overall");
  const { url, token } = useContext(Context);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchLeaderboardDetails();
  }, [platform]);

  const fetchLeaderboardDetails = async () => {
    const response = await leaderboard(
      platform === "overall" ? "" : platform,
      url,
      token,
    );
    setData(response.data);
  };

  const onPlatformChange = (e) => {
    setPlatform(e.target.value);
  };

  const userSyncHandler = async () => {
    if (syncing) return;
    setSyncing(true);

    try {
      const response = await syncUser(url, token);
      if (response?.success) {
        toast.success("Profile synced successfully");
        fetchLeaderboardDetails();
      } else {
        toast.error("Sync failed");
      }
    } catch {
      toast.error("Sync error");
    } finally {
      setSyncing(false);
    }
  };

  const getScoreByPlatform = (u) => {
    if (platform === "overall") {
      return u.totalScore;
    }
    return u.platformScores?.[platform] ?? 0;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <h2>Leaderboard</h2>

          <div className="leaderboard-actions">
            <button
              className="sync-btn"
              onClick={userSyncHandler}
              disabled={syncing}
            >
              {syncing ? "Syncing..." : "Sync Me"}
            </button>

            <button
              value="overall"
              onClick={onPlatformChange}
              className={platform === "overall" ? "active" : ""}
            >
              Overall
            </button>

            <button
              value="leetcode"
              onClick={onPlatformChange}
              className={platform === "leetcode" ? "active" : ""}
            >
              LeetCode
            </button>

            <button
              value="codeforces"
              onClick={onPlatformChange}
              className={platform === "codeforces" ? "active" : ""}
            >
              Codeforces
            </button>

            <button
              value="codechef"
              onClick={onPlatformChange}
              className={platform === "codechef" ? "active" : ""}
            >
              CodeChef
            </button>

            <button
              value="gfg"
              onClick={onPlatformChange}
              className={platform === "gfg" ? "active" : ""}
            >
              GFG
            </button>
          </div>
        </div>

        <div className="leaderboard-list">
          {data.map((u) => (
            <div className="leaderboard-row" key={u._id}>
              {/* Rank from backend */}
              <div className={`rank rank-${u.rank <= 3 ? u.rank : ""}`}>
                {u.rank}
              </div>

              {/* User */}
              <div className="user">
                <span className="username">{u.userId.username}</span>
              </div>

              {/* Score */}
              <div className="score">{getScoreByPlatform(u)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
