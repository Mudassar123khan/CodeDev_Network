import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../../context/AuthContext.jsx";
import { fetchInterviews } from "../../api/interview.api.js";
import Spinner from "../../components/Spinner/Spinner.jsx";
import "./InterviewExperience.css";

// SVG Icons
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

const BriefcaseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const BarChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function InterviewExperienceList() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    difficulty: "",
    outcome: "",
    mode: "",
    roundType: "",
  });

  const { url, token } = useContext(Context);
  const navigate = useNavigate();

  const loadExperiences = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchQuery || undefined,
        difficulty: filters.difficulty || undefined,
        outcome: filters.outcome || undefined,
        mode: filters.mode || undefined,
        roundType: filters.roundType || undefined,
      };
      const result = await fetchInterviews(url, token, params);
      if (result.success) {
        setExperiences(result.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load interview experiences.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Immediate fetch, debounce can be done if needed but direct is fine for now
    const delayDebounce = setTimeout(() => {
      loadExperiences();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, filters, url, token]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleShareClick = () => {
    if (!token) {
      toast.info("Please login to share your interview experience.");
      navigate("/login");
    } else {
      navigate("/interviews/new");
    }
  };

  const handleCardClick = (id) => {
    if (!token) {
      toast.info("Please login to view full interview experiences.");
      navigate("/login");
    } else {
      navigate(`/interviews/${id}`);
    }
  };

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Get difficulty count summary
  const getDifficultySummary = (rounds) => {
    if (!rounds || rounds.length === 0) return "N/A";
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    rounds.forEach((r) => {
      if (counts[r.difficulty] !== undefined) {
        counts[r.difficulty]++;
      }
    });

    if (counts.Hard > 0) return "Hard";
    if (counts.Medium > 0) return "Medium";
    return "Easy";
  };

  return (
    <div className="interview-page">
      <div className="interview-container">
        {/* Header Title & CTA */}
        <div className="interview-header-row">
          <h1 className="page-title">Interview Experiences</h1>
          <button className="btn-primary" onClick={handleShareClick}>
            <PlusIcon /> Share Experience
          </button>
        </div>

        {/* Toolbar: Search and Filters */}
        <div className="filters-toolbar">
          <div className="search-container">
            <span className="search-icon">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search company, role, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Difficulty (All)</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
              name="outcome"
              value={filters.outcome}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Outcome (All)</option>
              <option value="cleared">Cleared</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              name="mode"
              value={filters.mode}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Mode (All)</option>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
            </select>

            <select
              name="roundType"
              value={filters.roundType}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Round Type (All)</option>
              <option value="Technical">Technical</option>
              <option value="HR">HR</option>
              <option value="Coding test">Coding test</option>
              <option value="Final interview">Final interview</option>
            </select>
          </div>
        </div>

        {/* Main List */}
        {loading ? (
          <Spinner />
        ) : experiences.length === 0 ? (
          <div className="empty-section-card">
            <span className="empty-icon">
              <BriefcaseIcon />
            </span>
            <p className="empty-text">No interview experiences found. Be the first to share one!</p>
          </div>
        ) : (
          <div className="experience-list">
            {experiences.map((exp) => {
              const diffSummary = getDifficultySummary(exp.rounds);
              return (
                <div
                  className="experience-card"
                  key={exp._id}
                  onClick={() => handleCardClick(exp._id)}
                >
                  <div className="card-left">
                    <div className="card-icon-container">
                      <BriefcaseIcon />
                    </div>
                    <div className="card-info">
                      <div className="card-title-row">
                        <h3>
                          {exp.companyDetails.companyName} – {exp.companyDetails.role}
                        </h3>
                        <span className={`outcome-badge ${exp.feedback.outcome}`}>
                          {exp.feedback.outcome === "cleared" ? "Cleared" : "Rejected"}
                        </span>
                      </div>
                      <div className="card-meta-row">
                        {exp.companyDetails.location && (
                          <span className="meta-item">
                            <MapPinIcon /> {exp.companyDetails.location}
                          </span>
                        )}
                        <span className="meta-item">
                          <BarChartIcon /> Avg. Difficulty: {diffSummary}
                        </span>
                        <span className="meta-item">
                          <CalendarIcon /> Posted {formatDate(exp.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card-right">
                    <div className="card-author">
                      By: <span>{exp.personalInfo.name}</span>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(exp._id);
                      }}
                    >
                      {token ? "View Details" : "Login to View"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
