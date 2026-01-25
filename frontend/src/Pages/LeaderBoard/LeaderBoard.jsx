import "./Leaderboard.css";
import { leaderboard } from "../../api/leaderboard.api";
import { syncUser } from "../../api/sync.api";
import { use, useContext, useEffect, useState } from "react";
import { Context } from "../../context/AuthContext";
import { toast } from "react-toastify";

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [platform, setPlatform] = useState("overall");
  const { url, token, user } = useContext(Context);
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
    if (platform === "overall") return u.totalScore;
    return u.platformScores?.[platform] ?? 0;
  };

  const podium = data.slice(0, 3);
  const rest = data.slice(3);


  return (
    <div className="leaderboard-page">
      <div className="userstats">
        
      </div>
      {/* CONTROL BAR */}
      <div className="control-bar">
        <h2>Leaderboard</h2>

        <div className="leaderboard-actions">
          <button
            className="sync-btn"
            onClick={userSyncHandler}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync Me"}
          </button>

          {["overall", "leetcode", "codeforces", "codechef", "gfg"].map((p) => (
            <button
              key={p}
              value={p}
              onClick={onPlatformChange}
              className={platform === p ? "active" : ""}
            >
              {p === "overall"
                ? "Overall"
                : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* PODIUM */}
      <div className="podium">
        {podium.map((u) => (
          <div key={u._id} className={`podium-card rank-${u.rank}`}>
            <div className="podium-rank">#{u.rank}</div>
            <div className="podium-user">{u.userId.username}</div>
            <div className="podium-score">{getScoreByPlatform(u)}</div>
          </div>
        ))}
      </div>

      {/* RANK LIST */}
      <div className="leaderboard-list">
        <div className="leaderboard-row headline">
          <div className="rank">Rank</div>
          <div className="user">User</div>
          <div className="score">Score</div>
        </div>
        {rest.map((u) => (
          <div className="leaderboard-row" key={u._id}>
            <div className="rank">{u.rank}</div>
            <div className="user">{u.userId.username}</div>
            <div className="score">{getScoreByPlatform(u)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// changes 1 times
