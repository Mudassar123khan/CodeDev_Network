import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../../context/AuthContext.jsx";
import { getContestLeaderboardAPI, getContestBySlugAPI } from "../../api/contest.api.js";
import Spinner from "../../components/Spinner/Spinner.jsx";
import "./ContestLeaderBoard.css";

const MEDALS = ["🥇", "🥈", "🥉"];

function useCountdown(endTime) {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => setDiff(Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (diff === null) return null;
  if (diff <= 0) return "00:00:00";
  const h = String(Math.floor(diff / 3600)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
  const s = String(diff % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function ContestLeaderBoard() {
  const { slug } = useParams();
  const { url, token, user } = useContext(Context);

  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const countdown = useCountdown(contest?.endTime);

  const fetchContest = useCallback(async () => {
    try {
      const data = await getContestBySlugAPI(url, slug, token);
      setContest(data.contest);
      const ordered = [...(data.contest?.problems ?? [])].sort((a, b) => a.order - b.order);
      setProblems(ordered);
    } catch {
      // ignore
    }
  }, [url, slug, token]);

  const fetchLeaderboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getContestLeaderboardAPI(url, slug, token);
      const ranked = (data.leaderboard ?? []).map((entry, i) => ({
        ...entry,
        rank: i + 1,
        problemsArr: Array.isArray(entry.problemsSolved) ? entry.problemsSolved : [],
      }));
      setLeaderboard(ranked);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      if (!silent) toast.error("Failed to load leaderboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [url, slug, token]);

  useEffect(() => {
    fetchContest();
    fetchLeaderboard();
  }, [fetchContest, fetchLeaderboard]);

  useEffect(() => {
    if (contest?.status !== "running") return;
    const id = setInterval(() => fetchLeaderboard(true), 30000);
    return () => clearInterval(id);
  }, [contest?.status, fetchLeaderboard]);

  const myEntry = leaderboard.find((e) => e.username === user?.username);
  const totalSolvedCount = leaderboard.reduce((sum, e) => sum + (e.problemsArr?.length ?? 0), 0);

  if (loading) return <Spinner fullPage />;

  return (
    <div className="clb-page">
      <div className="clb-container">
        
        {/* Header Section */}
        <div className="clb-header-section">
          <Link to={`/contest/${slug}`} className="clb-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Contest
          </Link>
          
          <div className="clb-title-wrapper">
            <div>
              <h1 className="clb-title">Leaderboard</h1>
              {contest && <p className="clb-subtitle">{contest.title}</p>}
            </div>
            
            <div className="clb-actions">
              {contest?.status === "running" && countdown && (
                <div className="clb-timer">
                  <span className="clb-timer-dot"></span>
                  {countdown}
                </div>
              )}
              <button 
                className={`clb-refresh-btn ${refreshing ? 'spinning' : ''}`} 
                onClick={() => fetchLeaderboard(true)}
                disabled={refreshing}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.26l5.08 5.08"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="clb-stats-bar">
          <div className="clb-stat-item">
            <span className="clb-stat-label">Participants</span>
            <span className="clb-stat-val">{leaderboard.length}</span>
          </div>
          <div className="clb-stat-item">
            <span className="clb-stat-label">Total Solves</span>
            <span className="clb-stat-val highlight">{totalSolvedCount}</span>
          </div>
          {myEntry && (
            <div className="clb-stat-item my-rank">
              <span className="clb-stat-label">Your Rank</span>
              <span className="clb-stat-val">#{myEntry.rank} <small>({myEntry.totalPoints} pts)</small></span>
            </div>
          )}
        </div>

        {/* Table Section */}
        {leaderboard.length === 0 ? (
          <div className="clb-empty">
            <div className="clb-empty-icon">📊</div>
            <h3>No Rankings Yet</h3>
            <p>Be the first to submit a correct answer and claim the top spot!</p>
          </div>
        ) : (
          <div className="clb-table-card">
            <div className="clb-table-responsive">
              <table className="clb-table">
                <thead>
                  <tr>
                    <th className="th-rank">Rank</th>
                    <th className="th-user">User</th>
                    {problems.map((p, i) => (
                      <th key={p.problemId?._id ?? i} className="th-prob">
                        <div className="th-prob-inner">
                          <span>{p.problemId?.title?.split(" ").slice(0, 2).join(" ") ?? `P${i + 1}`}</span>
                          <span className="th-prob-pts">{p.points}</span>
                        </div>
                      </th>
                    ))}
                    <th className="th-score">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => {
                    const isMe = entry.username === user?.username;
                    return (
                      <tr key={entry.username} className={isMe ? "row-me" : ""}>
                        <td className="td-rank">
                          {entry.rank <= 3 ? (
                            <span className={`medal medal-${entry.rank}`}>{MEDALS[entry.rank - 1]}</span>
                          ) : (
                            <span className="rank-num">{entry.rank}</span>
                          )}
                        </td>
                        <td className="td-user">
                          <Link to={`/profile/${entry.username}`} className="user-link">
                            {entry.username}
                          </Link>
                          {isMe && <span className="badge-me">You</span>}
                        </td>
                        {problems.map((p, i) => {
                          const pId = p.problemId?._id?.toString() ?? String(i);
                          const solved = entry.problemsArr?.includes(pId);
                          return (
                            <td key={pId} className="td-prob">
                              {solved ? (
                                <div className="prob-solved">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                              ) : (
                                <div className="prob-unsolved"></div>
                              )}
                            </td>
                          );
                        })}
                        <td className="td-score">
                          <span className="score-val">{entry.totalPoints}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
