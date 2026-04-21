import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../../context/AuthContext.jsx";
import { getContestBySlugAPI, joinContestAPI, leaveContestAPI, getContestProblemsAPI } from "../../api/contest.api.js";
import Spinner from "../../components/Spinner/Spinner.jsx";
import "./ContestDetails.css";

export default function ContestDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { url, token, user } = useContext(Context);

  const [contest, setContest] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchContestData = async () => {
    try {
      setLoading(true);
      const data = await getContestBySlugAPI(url, slug, token);
      setContest(data.contest);

      // Check registration
      const isRegistered = user && data.contest.participants.some(
        (p) => p === user.id || p.toString() === user.id
      );

      // If running and registered, fetch problems
      if (data.contest.status === 'running' && isRegistered) {
        try {
          const probData = await getContestProblemsAPI(url, slug, token);
          if (probData.success) {
            setProblems(probData.problems);
          }
        } catch (e) {
          console.error("Failed to load problems:", e);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load contest details.");
      navigate("/contest");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestData();
  }, [slug, url, token]);

  const isUserRegistered = () => {
    return user && contest?.participants.some(
      (p) => p === user.id || p.toString() === user.id
    );
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error("Please login to register.");
      navigate("/login");
      return;
    }
    setActionLoading(true);
    try {
      await joinContestAPI(url, slug, token);
      toast.success("Successfully registered for the contest!");
      fetchContestData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!window.confirm("Are you sure you want to unregister from this contest?")) return;
    setActionLoading(true);
    try {
      await leaveContestAPI(url, slug, token);
      toast.success("Successfully unregistered from the contest.");
      fetchContestData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unregistration failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner fullPage />;
  if (!contest) return null;

  const isRegistered = isUserRegistered();
  const startDate = new Date(contest.startTime).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
  const endDate = new Date(contest.endTime).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="contest-details-page">
      <div className="cd-container">
        <div className="cd-back-nav">
          <Link to="/contest" className="cd-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Contests
          </Link>
        </div>
        
        <div className="contest-header">
        <div className="contest-header-inner">
          <div className="contest-header-left">
            <h1 className="contest-title">{contest.title}</h1>
            <div className="contest-meta">
              <span className={`status-badge status-${contest.status}`}>
                {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
              </span>
              <span className="participants-count">
                {contest.participants.length} Participants
              </span>
            </div>
            <div className="contest-times">
              <p><strong>Starts:</strong> {startDate}</p>
              <p><strong>Ends:</strong> {endDate}</p>
            </div>
          </div>
          <div className="contest-header-right">
            {contest.status === 'upcoming' && (
              isRegistered ? (
                <button
                  onClick={handleUnregister}
                  className="btn-unregister"
                  disabled={actionLoading}
                >
                  {actionLoading ? "..." : "Unregister"}
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  className="btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? "..." : "Register Now"}
                </button>
              )
            )}
            {contest.status === 'running' && isRegistered && (
              <div className="registered-badge large">You are registered</div>
            )}
            {contest.status === 'running' && !isRegistered && (
              <div className="unregistered-warning">Registration Closed</div>
            )}
            {contest.status === 'ended' && (
              <div className="ended-badge">Contest Ended</div>
            )}
            {(contest.status === 'running' || contest.status === 'ended') && (
              <Link to={`/contest/${slug}/leaderboard`} className="btn-leaderboard">
                🏆 View Leaderboard
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="contest-body">
        <div className="contest-rules card">
          <h2>Contest Rules & Details</h2>
          <ul>
            <li>This is a competitive programming contest. Plagiarism of any kind is strictly prohibited.</li>
            <li>Ensure a stable internet connection. No extra time will be provided for network drops.</li>
            <li>All submissions will be evaluated against hidden test cases. Time and space complexities matter.</li>
            <li>The leaderboard is updated in real-time. Ties will be broken by submission time penalties.</li>
            <li>The decision of the contest administrators will be final and binding.</li>
            <li>Have fun, and may the best coder win!</li>
          </ul>
        </div>

        {contest.status === 'running' && isRegistered && problems.length > 0 && (
          <div className="contest-problems list card">
            <h2>Contest Problems</h2>
            <div className="problems-grid">
              {problems.map((prob, index) => (
                <div className="problem-card" key={prob._id}>
                  <div className="problem-card-left">
                    <span className="problem-number">#{index + 1}</span>
                    <h3 className="problem-title">{prob.title}</h3>
                  </div>
                  <Link to={`/contest/${slug}/problems/${prob.slug}`} className="btn-secondary solve-btn">
                    Solve
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {contest.status === 'running' && isRegistered && problems.length === 0 && (
          <div className="contest-problems list card">
            <h2>Contest Problems</h2>
            <p className="empty-msg">No problems have been added to this contest yet.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
