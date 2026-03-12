import "./LeaderBoard.css";
import { leaderboard } from "../../api/leaderboard.api";
import { syncUser } from "../../api/sync.api";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner/Spinner";

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [platform, setPlatform] = useState("overall");
  const [loading, setLoading] = useState(true);

  // Pull global states and startPolling from Context
  const { 
    url, 
    token, 
    user, 
    syncing, 
    setSyncing, 
    syncStatus, 
    setSyncStatus, 
    startPolling 
  } = useContext(Context);

  useEffect(() => {
    fetchLeaderboardDetails();
  }, [platform]);

  const fetchLeaderboardDetails = async () => {
    try {
      setLoading(true);
      const response = await leaderboard(
        platform === "overall" ? "" : platform,
        url,
        token,
      );
      setData(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onPlatformChange = (e) => {
    setPlatform(e.target.value);
  };

  const userSyncHandler = async () => {
    if (syncing || syncStatus === "syncing" || syncStatus === "queued") return;

    setSyncing(true);

    try {
      const response = await syncUser(url, token);

      if (response?.success) {
        toast.info("You are in queue...");
        setSyncStatus("queued");
        // Start polling globally
        startPolling(token, () => {
          toast.success("Profile updated successfully!");
          fetchLeaderboardDetails();
        });
      } else {
        toast.error("Sync failed");
      }
    } catch (error) {
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

  if (loading) {
    return <Spinner fullPage />;
  }

  return (
    <div className="leaderboard-page">
      <div className="control-bar">
        <h2>Leaderboard</h2>

        <div className="leaderboard-actions">
          <div className="sync-section">
            <button
              className="sync-btn"
              onClick={userSyncHandler}
              disabled={syncing || syncStatus === "queued" || syncStatus === "syncing"}
            >
              {syncStatus === "syncing"
                ? "Syncing..."
                : syncStatus === "queued"
                ? "In Queue..."
                : "Sync Me"}
            </button>
          </div>

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

      <div className="podium">
        {podium.map((u) => (
          <div
            key={u._id}
            className={`podium-card rank-${u.rank} ${
              u.userId.username === user.username ? "current-user" : ""
            }`}
          >
            <div className="podium-rank">#{u.rank}</div>
            <Link to={`/profile/${u.userId.username}`} className="podium-user profile-link">
              {u.userId.username}
            </Link>
            <div className="podium-score">{getScoreByPlatform(u)}</div>
          </div>
        ))}
      </div>

      <div className="leaderboard-list">
        <div className="leaderboard-row headline">
          <div className="rank">Rank</div>
          <div className="user">User</div>
          <div className="score">Score</div>
        </div>
        {rest.map((u) => (
          <div
            className={`leaderboard-row ${
              u.userId.username === user.username ? "current-user" : ""
            }`}
            key={u._id}
          >
            <div className="rank">{u.rank}</div>
            <div className="user">
              <Link to={`/profile/${u.userId.username}`} className="profile-link">
                {u.userId.username}
              </Link>
            </div>
            <div className="score">{getScoreByPlatform(u)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}