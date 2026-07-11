import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../../context/AuthContext.jsx";
import { createInterview } from "../../api/interview.api.js";
import "./InterviewExperience.css";

// SVG Icons
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function InterviewExperienceForm() {
  const { url, token, user } = useContext(Context);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      toast.error("Please login to post an interview experience.");
      navigate("/login");
    }
  }, [token, navigate]);

  const [formData, setFormData] = useState({
    personalInfo: {
      name: user?.username || "",
      email: user?.email || "",
      currentRole: "",
      gradYear: "",
      linkedin: "",
      showLinkedin: false,
    },
    companyDetails: {
      companyName: "",
      role: "",
      location: "",
      jobType: "Full-time",
      experienceLevel: "",
    },
    rounds: [
      {
        roundName: "Round 1",
        roundType: "Technical",
        difficulty: "Medium",
        mode: "remote",
        duration: "",
        summary: "",
      },
    ],
    feedback: {
      outcome: "cleared",
      salaryRange: "",
      prepTips: "",
    },
  });

  // Handle nested object text updates
  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Handle individual round change
  const handleRoundChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedRounds = [...prev.rounds];
      updatedRounds[index] = {
        ...updatedRounds[index],
        [field]: value,
      };
      return {
        ...prev,
        rounds: updatedRounds,
      };
    });
  };

  // Add new round to form list
  const addRound = () => {
    setFormData((prev) => ({
      ...prev,
      rounds: [
        ...prev.rounds,
        {
          roundName: `Round ${prev.rounds.length + 1}`,
          roundType: "Technical",
          difficulty: "Medium",
          mode: "remote",
          duration: "",
          summary: "",
        },
      ],
    }));
  };

  // Remove round from form list (keep at least 1)
  const removeRound = (index) => {
    if (formData.rounds.length <= 1) {
      toast.warning("At least one round detail is required.");
      return;
    }
    setFormData((prev) => {
      const updatedRounds = prev.rounds.filter((_, idx) => idx !== index);
      // Re-index round names if needed, but not strictly required
      const reindexedRounds = updatedRounds.map((round, idx) => ({
        ...round,
        roundName: round.roundName.startsWith("Round ") ? `Round ${idx + 1}` : round.roundName,
      }));
      return {
        ...prev,
        rounds: reindexedRounds,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Clean numerical fields without mutating state
      const cleanedFormData = {
        ...formData,
        personalInfo: { ...formData.personalInfo }
      };
      if (cleanedFormData.personalInfo.gradYear) {
        cleanedFormData.personalInfo.gradYear = Number(cleanedFormData.personalInfo.gradYear);
      } else {
        delete cleanedFormData.personalInfo.gradYear;
      }

      const response = await createInterview(url, cleanedFormData, token);
      if (response.success) {
        toast.success("Interview experience shared successfully!");
        navigate("/interviews");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to submit interview experience.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="interview-page">
      <div className="interview-container">
        {/* Back Link */}
        <Link to="/interviews" className="back-link">
          ← Cancel and Go Back
        </Link>

        <h1 className="page-title" style={{ marginBottom: "28px" }}>
          Share Your Interview Experience
        </h1>

        <form onSubmit={handleSubmit} className="form-layout">
          {/* 1. Personal Info */}
          <div className="form-section">
            <h3 className="form-section-title">1. Personal Info</h3>
            <div className="form-grid-2">
              <div className="form-field">
                <label>Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.personalInfo.name}
                  onChange={(e) => handleNestedChange("personalInfo", "name", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={formData.personalInfo.email}
                  onChange={(e) => handleNestedChange("personalInfo", "email", e.target.value)}
                />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label>Current Role (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Student, SDE-1, Freelancer"
                  value={formData.personalInfo.currentRole}
                  onChange={(e) => handleNestedChange("personalInfo", "currentRole", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Graduation Year (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 2026"
                  value={formData.personalInfo.gradYear || ""}
                  onChange={(e) => handleNestedChange("personalInfo", "gradYear", e.target.value)}
                />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field" style={{ marginBottom: "8px" }}>
                <label>LinkedIn Profile URL (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://linkedin.com/in/username"
                  value={formData.personalInfo.linkedin}
                  onChange={(e) => handleNestedChange("personalInfo", "linkedin", e.target.value)}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                  <input
                    type="checkbox"
                    id="showLinkedin"
                    checked={formData.personalInfo.showLinkedin}
                    onChange={(e) => handleNestedChange("personalInfo", "showLinkedin", e.target.checked)}
                    style={{ width: "14px", height: "14px", cursor: "pointer", accentColor: "#ffa116" }}
                  />
                  <label htmlFor="showLinkedin" style={{ fontSize: "12px", color: "#888888", cursor: "pointer", userSelect: "none", margin: 0 }}>
                    Show LinkedIn on the platform
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Company Details */}
          <div className="form-section">
            <h3 className="form-section-title">2. Company Details</h3>
            <div className="form-grid-2">
              <div className="form-field">
                <label>Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Microsoft"
                  value={formData.companyDetails.companyName}
                  onChange={(e) => handleNestedChange("companyDetails", "companyName", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Target Role / Profile *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer Intern, Associate Developer"
                  value={formData.companyDetails.role}
                  onChange={(e) => handleNestedChange("companyDetails", "role", e.target.value)}
                />
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-field">
                <label>Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Remote, Seattle"
                  value={formData.companyDetails.location}
                  onChange={(e) => handleNestedChange("companyDetails", "location", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Job Type *</label>
                <select
                  required
                  value={formData.companyDetails.jobType}
                  onChange={(e) => handleNestedChange("companyDetails", "jobType", e.target.value)}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
            </div>
            <div className="form-field">
              <label>Experience Level / Target Group (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Fresher, 2+ Years Exp, Campus Hire"
                value={formData.companyDetails.experienceLevel}
                onChange={(e) => handleNestedChange("companyDetails", "experienceLevel", e.target.value)}
              />
            </div>
          </div>

          {/* 3. Round Details */}
          <div className="form-section">
            <h3 className="form-section-title">3. Round Details</h3>
            <div className="rounds-list-container">
              {formData.rounds.map((round, index) => (
                <div className="round-form-card" key={index}>
                  <div className="round-form-header">
                    <h4>Round #{index + 1}</h4>
                    {formData.rounds.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-round"
                        onClick={() => removeRound(index)}
                      >
                        <TrashIcon /> Remove Round
                      </button>
                    )}
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label>Round Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Online Assessment, Round 1 (System Design)"
                        value={round.roundName}
                        onChange={(e) => handleRoundChange(index, "roundName", e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label>Round Type *</label>
                      <select
                        required
                        value={round.roundType}
                        onChange={(e) => handleRoundChange(index, "roundType", e.target.value)}
                      >
                        <option value="Technical">Technical</option>
                        <option value="HR">HR</option>
                        <option value="Coding test">Coding test</option>
                        <option value="Final interview">Final interview</option>
                        <option value="Offer discussion">Offer discussion</option>
                        <option value="Cultural fit">Cultural fit</option>
                        <option value="Group discussion">Group discussion</option>
                        <option value="Aptitude test">Aptitude test</option>
                        <option value="System design">System design</option>
                        <option value="Case study">Case study</option>
                        <option value="Behavioral">Behavioral</option>
                        <option value="Managerial">Managerial</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label>Difficulty level *</label>
                      <select
                        required
                        value={round.difficulty}
                        onChange={(e) => handleRoundChange(index, "difficulty", e.target.value)}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Mode *</label>
                      <select
                        required
                        value={round.mode}
                        onChange={(e) => handleRoundChange(index, "mode", e.target.value)}
                      >
                        <option value="remote">Remote</option>
                        <option value="onsite">Onsite</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Duration / Time Taken (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 45 mins, 1 hour"
                      value={round.duration}
                      onChange={(e) => handleRoundChange(index, "duration", e.target.value)}
                    />
                  </div>

                  <div className="form-field" style={{ marginBottom: "0" }}>
                    <label>Round Summary (Topics, Questions, Process) *</label>
                    <textarea
                      required
                      placeholder="Summarize what was asked, questions solved, or topics discussed in this round."
                      value={round.summary}
                      onChange={(e) => handleRoundChange(index, "summary", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-add-round"
              onClick={addRound}
              style={{ marginTop: "16px", width: "100%" }}
            >
              <PlusIcon /> Add Another Round
            </button>
          </div>

          {/* 4. Feedback & Output */}
          <div className="form-section">
            <h3 className="form-section-title">4. Interview Feedback</h3>
            <div className="form-grid-2">
              <div className="form-field">
                <label>Interview Outcome *</label>
                <select
                  required
                  value={formData.feedback.outcome}
                  onChange={(e) => handleNestedChange("feedback", "outcome", e.target.value)}
                >
                  <option value="cleared">Cleared</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="form-field">
                <label>Salary range (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 15-18 LPA, $120k/year"
                  value={formData.feedback.salaryRange}
                  onChange={(e) => handleNestedChange("feedback", "salaryRange", e.target.value)}
                />
              </div>
            </div>
            <div className="form-field">
              <label>Preparation Tips & Resources (Optional)</label>
              <textarea
                placeholder="Share your preparation strategy, advice for future candidates, and helpful links or topics."
                value={formData.feedback.prepTips}
                onChange={(e) => handleNestedChange("feedback", "prepTips", e.target.value)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/interviews")}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Sharing..." : "Post Experience"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
