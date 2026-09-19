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
