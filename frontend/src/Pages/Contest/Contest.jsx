// Contest.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../../context/AuthContext.jsx";
import { getAllContestsAPI, joinContestAPI, leaveContestAPI } from "../../api/contest.api.js";
import Spinner from "../../components/Spinner/Spinner.jsx";
import "./Contest.css";

export default function Contest() {
  const [contests, setContests] = useState({ running: [], upcoming: [], ended: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // slug of contest being acted on
  const { url, token, user } = useContext(Context);
  const navigate = useNavigate();

  const fetchContests = async () => {
    try {
      setLoading(true);
      const data = await getAllContestsAPI(url, token);

      const running = [];
      const upcoming = [];
      const ended = [];

      data.forEach((contest) => {
        if (contest.status === "running") running.push(contest);
        else if (contest.status === "upcoming") upcoming.push(contest);
        else if (contest.status === "ended") ended.push(contest);
      });

      setContests({ running, upcoming, ended });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load contests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, [url, token]);

  // participants array contains ObjectId strings from backend
  const isUserRegistered = (contest) =>
    user && contest.participants.some((p) => p === user.id || p.toString() === user.id);

  const handleRegister = async (slug) => {
    if (!user) {
      toast.error("Please login to register.");
      navigate("/login");
      return;
    }
    setActionLoading(slug);
    try {
      await joinContestAPI(url, slug, token);
      toast.success("Successfully registered for the contest!");
      fetchContests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregister = async (slug) => {
    if (!window.confirm("Are you sure you want to unregister from this contest?")) return;
    setActionLoading(slug);
    try {
      await leaveContestAPI(url, slug, token);
      toast.success("Successfully unregistered from the contest.");
      fetchContests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unregistration failed.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Spinner fullPage />;

  const renderContestCard = (contest, type) => {
    const isRegistered = isUserRegistered(contest);
    const isActing = actionLoading === contest.slug;

    const startDate = new Date(contest.startTime).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const endDate = new Date(contest.endTime).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      <div className="contest-card" key={contest._id} onClick={() => navigate(`/contest/${contest.slug}`)} style={{ cursor: 'pointer' }}>
        <div className="contest-info">
          <div className="contest-title-row">
            <h3>{contest.title}</h3>
            {isRegistered && (
              <span className="registered-badge">Registered</span>
            )}
          </div>
          <p className="contest-time">Starts: {startDate}</p>
          <p className="contest-time">Ends: {endDate}</p>
        </div>

        <div className="contest-action">
          {type === "upcoming" && (
            isRegistered ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleUnregister(contest.slug); }}
                className="btn-unregister"
                disabled={isActing}
              >
                {isActing ? "..." : "Unregister"}
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handleRegister(contest.slug); }}
                className="btn-primary"
                disabled={isActing}
              >
                {isActing ? "..." : "Register"}
              </button>
            )
          )}

          {type === "running" && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/contest/${contest.slug}`); }} className="btn-primary">
              Enter
            </button>
          )}

          {type === "ended" && (
            <button onClick={(e) => { e.stopPropagation(); navigate(`/contest/${contest.slug}`); }} className="btn-secondary">
              View
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="contest-page">
      <div className="contest-container">
        <h1 className="page-title">Contests</h1>

        {contests.running.length > 0 && (
          <section className="contest-section">
            <h2>Running Contests</h2>
            <div className="contest-list">
              {contests.running.map((c) => renderContestCard(c, "running"))}
            </div>
          </section>
        )}

        <section className="contest-section">
          <h2>Upcoming Contests</h2>
          <div className="contest-list">
            {contests.upcoming.length > 0 ? (
              contests.upcoming.map((c) => renderContestCard(c, "upcoming"))
            ) : (
              <p className="empty-msg">No upcoming contests at the moment.</p>
            )}
          </div>
        </section>

        {contests.ended.length > 0 && (
          <section className="contest-section">
            <h2>Past Contests</h2>
            <div className="contest-list">
              {contests.ended.map((c) => renderContestCard(c, "ended"))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
