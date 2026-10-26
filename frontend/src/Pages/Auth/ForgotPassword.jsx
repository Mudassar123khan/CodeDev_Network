import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth.api.js";
import { Context } from "../../context/AuthContext.jsx";
import { toast } from "react-toastify";
import "./login.css";

export default function ForgotPassword() {
  const { url } = useContext(Context);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.warning("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword(email.trim(), url);
      if (res.data.success) {
        setSubmitted(true);
        toast.success(res.data.message || "Reset link sent!");
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Failed to send reset link");
      } else {
        toast.error("Server not responding. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="auth-card-header">
          <h2 className="auth-card-title">Forgot Password</h2>
          <p className="auth-card-desc">
            {submitted
              ? "Check your email inbox for instructions"
              : "Enter your registered email and we'll send you a password reset link"}
          </p>
        </div>

        {submitted ? (
          <div className="auth-success-box">
            <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>Email Sent!</p>
            <p style={{ margin: "0" }}>
              A password reset link has been sent to <strong>{email}</strong>. It is valid for 15 minutes.
            </p>
          </div>
        ) : (
          <>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={loading}
              autoFocus
            />

            <button type="submit" disabled={loading}>
              {loading ? "Sending Reset Link..." : "Send Reset Link"}
            </button>
          </>
        )}

        <p className="login-link" style={{ marginTop: submitted ? "8px" : "4px" }}>
          Remembered your password? <Link to="/login">Back to Login</Link>
        </p>

        {submitted && (
          <p className="login-link" style={{ marginTop: "-8px", fontSize: "13px" }}>
            Didn't receive it?{" "}
            <span
              onClick={() => setSubmitted(false)}
              style={{ color: "#FFA116", cursor: "pointer", fontWeight: 500 }}
            >
              Try again
            </span>
          </p>
        )}
      </form>
    </div>
  );
}
