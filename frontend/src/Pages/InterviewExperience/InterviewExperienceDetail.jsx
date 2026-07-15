import React, { useContext, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../../context/AuthContext.jsx";
import { fetchInterviewById } from "../../api/interview.api.js";
import Spinner from "../../components/Spinner/Spinner.jsx";
import "./InterviewExperience.css";

// SVG Icons
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const AwardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function InterviewExperienceDetail() {
  const { id } = useParams();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);

  const { url, token } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        if (!token) {
          toast.error("Please login to see the full interview experience.");
          navigate("/login");
          return;
        }
        const data = await fetchInterviewById(url, id, token);
        setExperience(data);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to load details.");
        navigate("/interviews");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, url, token, navigate]);

  if (loading) {
    return <Spinner fullPage />;
  }

  if (!experience) {
    return (
      <div className="interview-page">
        <div className="interview-container">
          <Link to="/interviews" className="back-link">
            ← Back to Experiences
          </Link>
          <div className="empty-section-card">
            <p className="empty-text">Experience not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  return (
    <div className="interview-page">
      <div className="interview-container">
        {/* Back Link */}
        <Link to="/interviews" className="back-link">
          ← Back to Experiences
        </Link>

        {/* Detailed Header Card */}
        <div className="detail-header-card">
          <div className="header-title-details">
            <h1>{experience.companyDetails.companyName}</h1>
            <p>{experience.companyDetails.role}</p>
          </div>
          <div className="header-status-details">
            <span className={`outcome-badge ${experience.feedback.outcome}`}>
              {experience.feedback.outcome === "cleared" ? "Cleared" : "Rejected"}
            </span>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="detail-layout">
          {/* Main Content Side */}
          <div className="detail-main">
            {/* Company Info Box */}
            <div className="section-box">
              <h2>Company Details</h2>
              <div className="form-grid-2">
                <div className="info-item-group">
                  <span className="info-item-label">Company Name</span>
                  <span className="info-item-value">{experience.companyDetails.companyName}</span>
                </div>
                <div className="info-item-group">
                  <span className="info-item-label">Target Role</span>
                  <span className="info-item-value">{experience.companyDetails.role}</span>
                </div>
                {experience.companyDetails.location && (
                  <div className="info-item-group">
                    <span className="info-item-label">Location</span>
                    <span className="info-item-value">{experience.companyDetails.location}</span>
                  </div>
                )}
                {experience.companyDetails.jobType && (
                  <div className="info-item-group">
                    <span className="info-item-label">Job Type</span>
                    <span className="info-item-value">{experience.companyDetails.jobType}</span>
                  </div>
                )}
                {experience.companyDetails.experienceLevel && (
                  <div className="info-item-group">
                    <span className="info-item-label">Experience Level</span>
                    <span className="info-item-value">{experience.companyDetails.experienceLevel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rounds Box */}
            <div className="section-box">
              <h2>Interview Rounds ({experience.rounds.length})</h2>
              <div className="rounds-timeline">
                {experience.rounds.map((round, idx) => (
                  <div className="round-detail-item" key={round._id || idx}>
                    <div className="round-item-header">
                      <h3 className="round-title">{round.roundName}</h3>
                      <div className="round-badge-group">
                        <span className="pill-badge">{round.roundType}</span>
                        <span className={`pill-badge difficulty-${round.difficulty.toLowerCase()}`}>
                          {round.difficulty}
                        </span>
                        <span className="pill-badge">{round.mode}</span>
                        {round.duration && <span className="pill-badge">{round.duration}</span>}
                      </div>
                    </div>
                    <div className="round-summary">{round.summary}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation and Feedback Box */}
            <div className="section-box">
              <h2>Feedback & Salary</h2>
              <div className="feedback-details">
                {experience.feedback.salaryRange && (
                  <div className="info-item-group">
                    <span className="info-item-label">Salary Range</span>
                    <span className="info-item-value" style={{ color: "#ffa116" }}>
                      {experience.feedback.salaryRange}
                    </span>
                  </div>
                )}
                {experience.feedback.prepTips && (
                  <div className="info-item-group" style={{ marginTop: "10px" }}>
                    <span className="info-item-label">Preparation Tips</span>
                    <div className="feedback-text-block">{experience.feedback.prepTips}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Side */}
          <div className="sidebar-card">
            <h3 style={{ margin: "0", color: "#ffffff", fontSize: "18px" }}>Author Info</h3>
            <div className="info-item-group">
              <span className="info-item-label">
                <UserIcon /> Candidate Name
              </span>
              <span className="info-item-value">{experience.personalInfo.name}</span>
            </div>
            {experience.user && experience.user.branch && (
              <div className="info-item-group">
                <span className="info-item-label">Branch</span>
                <span className="info-item-value">{experience.user.branch}</span>
              </div>
            )}
            {/* <div className="info-item-group">
              <span className="info-item-label">
                <MailIcon /> Email Contact
              </span>
              <span className="info-item-value">{experience.personalInfo.email}</span>
            </div> */}
            {experience.personalInfo.currentRole && (
              <div className="info-item-group">
                <span className="info-item-label">Current Role</span>
                <span className="info-item-value">{experience.personalInfo.currentRole}</span>
              </div>
            )}
            {experience.personalInfo.gradYear && (
              <div className="info-item-group">
                <span className="info-item-label">Graduation Year</span>
                <span className="info-item-value">{experience.personalInfo.gradYear}</span>
              </div>
            )}
            {experience.personalInfo.showLinkedin && experience.personalInfo.linkedin && (
              <div className="info-item-group">
                <span className="info-item-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LinkedInIcon /> LinkedIn
                </span>
                <span className="info-item-value">
                  <a
                    href={experience.personalInfo.linkedin.startsWith("http") ? experience.personalInfo.linkedin : `https://${experience.personalInfo.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkedin-link"
                  >
                    Connect
                  </a>
                </span>
              </div>
            )}
            <div className="info-item-group" style={{ borderTop: "1px solid #2d2d2d", paddingTop: "14px" }}>
              <span className="info-item-label">
                <CalendarIcon /> Date Shared
              </span>
              <span className="info-item-value" style={{ fontSize: "14px", color: "#888888" }}>
                {formatDate(experience.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
