import React, { useState, useContext } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../../api/auth.api.js";
import { Context } from "../../context/AuthContext.jsx";
import { toast } from "react-toastify";
import "./login.css";

export default function ResetPassword() {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get("token");
  const { url } = useContext(Context);
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    if (password.length < 8) {
      toast.warning("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      toast.warning("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(token, password, url);
      if (res.data.success) {
        setResetSuccess(true);
        toast.success(res.data.message || "Password reset successful!");
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Failed to reset password");
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
          <h2 className="auth-card-title">Reset Password</h2>
          <p className="auth-card-desc">
            {resetSuccess
              ? "Your password has been changed"
              : "Choose a new secure password (at least 8 characters)"}
          </p>
        </div>

        {resetSuccess ? (
          <div className="auth-success-box">
            <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>Password Updated!</p>
            <p style={{ margin: "0" }}>
              Your password has been reset successfully. Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                required
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="password-input-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Updating Password..." : "Update Password"}
            </button>
          </>
        )}

        <p className="login-link">
          <Link to="/login">← Back to Login</Link>
        </p>
      </form>
    </div>
  );
}
