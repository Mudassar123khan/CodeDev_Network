import React, { useState, useContext, useEffect } from "react";
import "./Contact.css";
import { Context } from "../../context/AuthContext.jsx";
import { submitContactMessage } from "../../api/contact.api.js";
import { toast } from "react-toastify";

export default function Contact() {
  const { url, token, user } = useContext(Context);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "query",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || user.username || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const contactTypes = [
    { id: "query", label: "Query" },
    { id: "suggestion", label: "Suggestion" },
    { id: "bug_report", label: "Bug Report" },
    { id: "other", label: "Other" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await submitContactMessage(url, formData, token);

      if (res && res.success) {
        toast.success(res.message || "Message sent successfully.");
        setSubmitted(true);
      } else {
        toast.error(res?.message || "Failed to send message.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.message || "Error submitting message.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({
      name: user?.name || user?.username || "",
      email: user?.email || "",
      type: "query",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <header className="contact-header">
          <h1>Contact & Suggestions</h1>
          <p>Get in touch directly or submit your query or suggestion below.</p>
        </header>

        <div className="contact-layout">
          {/* Direct Details */}
          <aside className="contact-info">
            <div className="info-block">
              <span className="info-label">Direct Email</span>
              <a href="mailto:12mudassarkhan@gmail.com" className="info-value">
                12mudassarkhan@gmail.com
              </a>
              <div className="info-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => copyToClipboard("12mudassarkhan@gmail.com", "Email")}
                >
                  {copiedField === "Email" ? "Copied" : "Copy"}
                </button>
                <a href="mailto:12mudassarkhan@gmail.com" className="btn-text highlight">
                  Send Mail
                </a>
              </div>
            </div>

            {/* Open Source Contribution Card */}
            <div className="info-block contribute-card">
              <div className="contribute-header">
                <svg className="github-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span className="info-label">Open Source</span>
              </div>
              <h3 className="contribute-title">Contribute to CodeDev</h3>
              <p className="contribute-desc">
                Want to contribute to CodeDev Network? We welcome contributions, feature suggestions, and pull requests on GitHub!
              </p>
              <div className="info-actions">
                <a
                  href="https://github.com/Mudassar123khan/CodeDev_Network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-text highlight contribute-btn"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  GitHub Repo
                </a>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => copyToClipboard("https://github.com/Mudassar123khan/CodeDev_Network", "Repository Link")}
                >
                  {copiedField === "Repository Link" ? "Copied" : "Copy Link"}
                </button>
              </div>
            </div>
          </aside>

          {/* Form */}
          <main className="contact-main">
            {submitted ? (
              <div className="form-success">
                <h3>Message Received</h3>
                <p>Thank you for your feedback. Your message has been delivered to the admin.</p>
                <button type="button" className="btn-submit" onClick={handleReset}>
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="type-toggle-group">
                  {contactTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`type-toggle ${formData.type === t.id ? "active" : ""}`}
                      onClick={() => setFormData((prev) => ({ ...prev, type: t.id }))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    id="subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-footer">
                  <button type="submit" disabled={loading} className="btn-submit">
                    {loading ? "Sending..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
