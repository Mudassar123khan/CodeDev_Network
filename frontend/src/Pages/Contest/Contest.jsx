import React, { useContext, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../../context/AuthContext.jsx";
import { getAllContestsAPI, joinContestAPI, leaveContestAPI } from "../../api/contest.api.js";
import Spinner from "../../components/Spinner/Spinner.jsx";
import "./Contest.css";

// SVG Icons
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
  </svg>
);

const TrophyDottedIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" strokeDasharray="3 3" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" strokeDasharray="3 3" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
  </svg>
);

// Formatting utilities
const formatDateRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startMonth = start.toLocaleString("default", { month: "short" });
  const endMonth = end.toLocaleString("default", { month: "short" });
  const startDate = start.getDate();
  const endDate = end.getDate();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      if (startDate === endDate) {
        return `${startMonth} ${startDate}, ${startYear}`;
      }
      return `${startMonth} ${startDate}–${endDate}, ${startYear}`;
    }
    return `${startMonth} ${startDate} – ${endMonth} ${endDate}, ${startYear}`;
  }
  return `${startMonth} ${startDate}, ${startYear} – ${endMonth} ${endDate}, ${endYear}`;
};

const formatTimeRange = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const formatTime = (date) => {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  return `${formatTime(start)} – ${formatTime(end)}`;
};

const formatDuration = (startTime, endTime) => {
  const diffMs = new Date(endTime) - new Date(startTime);
  const diffMins = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours >= 24) {
    const roundedHours = Math.round(diffMins / 60);
    const exactHours = diffMins / 60;
    const isApprox = Math.abs(exactHours - roundedHours) > 0.05;
    return isApprox ? `~${roundedHours}h` : `${roundedHours}h`;
  } else {
    if (mins === 0) {
      return `${hours}h`;
    }
    if (hours === 0) {
      return `${mins}m`;
    }
    return `${hours}h ${mins}m`;
  }
};

export default function Contest() {
  const [contests, setContests] = useState({ running: [], upcoming: [], ended: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // slug of contest being acted on
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const { url, token, user } = useContext(Context);
  const navigate = useNavigate();

  const fetchContests = useCallback(async () => {
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
  }, [url, token]);

  useEffect(() => {
    fetchContests();
  }, [fetchContests]);

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

  // Calculated Stats
  const allContests = [...contests.running, ...contests.upcoming, ...contests.ended];
  const totalCount = allContests.length;
  const upcomingCount = contests.upcoming.length;
  const endedCount = contests.ended.length;

  // Search & Filter match helpers
  const matchesSearch = (contest) =>
    contest.title.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesFilter = (contest) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "upcoming") return contest.status === "upcoming";
    if (activeFilter === "past") return contest.status === "ended";
    if (activeFilter === "registered") return isUserRegistered(contest);
    return true;
  };

  const filteredRunning = contests.running.filter((c) => matchesSearch(c) && matchesFilter(c));
  const filteredUpcoming = contests.upcoming.filter((c) => matchesSearch(c) && matchesFilter(c));
  const filteredEnded = contests.ended.filter((c) => matchesSearch(c) && matchesFilter(c));

  // Count helper for tabs
  const registeredCountForTab = allContests.filter(isUserRegistered).length;

  const renderContestCard = (contest, type) => {
    const isRegistered = isUserRegistered(contest);
    const isActing = actionLoading === contest.slug;

    return (
      <div
        className={`contest-card ${isRegistered ? "registered" : ""}`}
        key={contest._id}
        onClick={() => navigate(`/contest/${contest.slug}`)}
        style={{ cursor: "pointer" }}
      >
        <div className="contest-card-left">
          <div className={`contest-card-icon-container ${isRegistered ? "registered" : ""}`}>
            <TrophyIcon />
          </div>
          <div className="contest-info">
            <div className="contest-title-row">
              <h3>{contest.title}</h3>
              {isRegistered && (
                <span className="registered-badge">Registered</span>
              )}
            </div>
            <div className="contest-meta-row">
              <span className="meta-item">
                <CalendarIcon /> {formatDateRange(contest.startTime, contest.endTime)}
              </span>
              <span className="meta-item">
                <ClockIcon /> {formatTimeRange(contest.startTime, contest.endTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="contest-card-right">
          <div className="duration-indicator">
            <span className="duration-text">{formatDuration(contest.startTime, contest.endTime)}</span>
          </div>

          <div className="contest-action">
            {type === "upcoming" && (
              isRegistered ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnregister(contest.slug);
                  }}
                  className="btn-action btn-unregister"
                  disabled={isActing}
                >
                  {isActing ? "..." : "Unregister"}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegister(contest.slug);
                  }}
                  className="btn-action btn-register"
                  disabled={isActing}
                >
                  {isActing ? "..." : "Register"}
                </button>
              )
            )}

            {type === "running" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/contest/${contest.slug}`);
                }}
                className="btn-action btn-enter"
              >
                Enter
              </button>
            )}

            {type === "ended" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/contest/${contest.slug}`);
                }}
                className="btn-action btn-view"
              >
                View
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="contest-page">
      <div className="contest-container">

        {/* Header Row: Title & Search */}
        <div className="contest-header-row">
          <h1 className="page-title">Contests</h1>
          <div className="search-container">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search contests"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Live status banner
        {contests.running.length === 0 && (
          <div className="live-notice-bar">
            <span className="info-icon"><InfoIcon /></span>
            <span className="notice-text">No live contests right now · Check back soon</span>
          </div>
        )} */}

        {/* Stats Grid */}
        {/* <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{totalCount}</span>
            <span className="stat-label">Total contests</span>
          </div>
          <div className="stat-card accent-registered">
            <span className="stat-number">{registeredCount}</span>
            <span className="stat-label">Registered</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{upcomingCount}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div> */}

        {/* Filters Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All <span className="tab-badge">{totalCount}</span>
          </button>
          <button
            className={`filter-tab ${activeFilter === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveFilter("upcoming")}
          >
            Upcoming <span className="tab-badge">{upcomingCount}</span>
          </button>
          <button
            className={`filter-tab ${activeFilter === "past" ? "active" : ""}`}
            onClick={() => setActiveFilter("past")}
          >
            Past <span className="tab-badge">{endedCount}</span>
          </button>
          <button
            className={`filter-tab ${activeFilter === "registered" ? "active" : ""}`}
            onClick={() => setActiveFilter("registered")}
          >
            Registered <span className="tab-badge">{registeredCountForTab}</span>
          </button>
        </div>

        {/* Sections based on filter */}

        {/* Running section */}
        {(activeFilter === "all" || activeFilter === "upcoming" || activeFilter === "registered") && filteredRunning.length > 0 && (
          <section className="contest-section">
            <h2 className="section-title">RUNNING CONTESTS</h2>
            <div className="contest-list">
              {filteredRunning.map((c) => renderContestCard(c, "running"))}
            </div>
          </section>
        )}

        {/* Upcoming section */}
        {(activeFilter === "all" || activeFilter === "upcoming" || activeFilter === "registered") && (
          <section className="contest-section">
            <h2 className="section-title">UPCOMING</h2>
            {filteredUpcoming.length > 0 ? (
              <div className="contest-list">
                {filteredUpcoming.map((c) => renderContestCard(c, "upcoming"))}
              </div>
            ) : (
              <div className="empty-section-card">
                <span className="empty-icon"><TrophyDottedIcon /></span>
                <p className="empty-text">No upcoming contests scheduled.</p>
              </div>
            )}
          </section>
        )}

        {/* Past section */}
        {(activeFilter === "all" || activeFilter === "past" || activeFilter === "registered") && (
          <section className="contest-section">
            <h2 className="section-title">PAST CONTESTS</h2>
            {filteredEnded.length > 0 ? (
              <div className="contest-list">
                {filteredEnded.map((c) => renderContestCard(c, "ended"))}
              </div>
            ) : (
              <div className="empty-section-card">
                <span className="empty-icon"><TrophyDottedIcon /></span>
                <p className="empty-text">No past contests found.</p>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
