import "./LeaderBoard.css";
import { leaderboard } from "../../api/leaderboard.api";
import { syncUser, getSyncStatus } from "../../api/sync.api";
import { useContext, useEffect, useState, useRef } from "react";
import { Context } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [platform, setPlatform] = useState("overall");
  const { url, token, user } = useContext(Context);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const pollingRef = useRef(null);
  // const [lastSyncedAt, setLastSyncedAt] = useState(new Date());

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
    if (syncing || syncStatus === "syncing" || syncStatus === "queued") return;

    setSyncing(true);

    try {
      const response = await syncUser(url, token);

      if (response?.success) {
        toast.info("You are in queue...");
        setSyncStatus("queued");
        startPolling();
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

  //polling function
  const startPolling = () => {
    // Prevent multiple intervals
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const statusResponse = await getSyncStatus(url, token);

        if (!statusResponse) return;

        const status = statusResponse.syncStatus;
        setSyncStatus(status);

        // if (statusResponse.lastSyncedAt) {
        //   setLastSyncedAt(statusResponse.lastSyncedAt);
        // }

        if (status === "done") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;

          toast.success("Profile updated successfully!");
          fetchLeaderboardDetails();
        }

        if (status === "failed") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;

          toast.error("Sync failed");
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000); // Poll every 3 seconds
  };

  //cleanup
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return (
    <div className="leaderboard-page">
      {/* CONTROL BAR */}
      <div className="control-bar">
        <h2>Leaderboard</h2>

        <div className="leaderboard-actions">
          <div className="sync-section">
            <button
              className="sync-btn"
              onClick={userSyncHandler}
              disabled={
                syncing || syncStatus === "queued" || syncStatus === "syncing"
              }
            >
              {syncStatus === "syncing"
                ? "Syncing..."
                : syncStatus === "queued"
                  ? "In Queue..."
                  : "Sync Me"}
            </button>

            {/* {lastSyncedAt && (
              <div className="last-synced">
                Last synced: {new Date(lastSyncedAt).toLocaleString()}
              </div>
            )} */}
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

      {/* PODIUM */}
      <div className="podium">
        {podium.map((u) => (
          <div
            key={u._id}
            className={`podium-card rank-${u.rank} ${
              u.userId.username === user.username ? "current-user" : ""
            }`}
          >
            <div className="podium-rank">#{u.rank}</div>
            <Link
              to={`/profile/${u.userId.username}`}
              className="podium-user profile-link"
            >
              {u.userId.username}
            </Link>
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
          <div
            className={`leaderboard-row ${
              u.userId.username === user.username ? "current-user" : ""
            }`}
            key={u._id}
          >
            <div className="rank">{u.rank}</div>
            <div className="user">
              <Link
                to={`/profile/${u.userId.username}`}
                className="profile-link"
              >
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

// changes 1 times
