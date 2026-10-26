import "./Register.css";
import { register } from "../../api/auth.api";
import { useState, useContext } from "react";
import { Context } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const { url } = useContext(Context);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile image upload state
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    branch: "",
    graduationYear: "",
    platforms: {
      leetcode: "",
      codeforces: "",
      codechef: "",
      gfg: "",
    },
  });

  const onChangeHandler = (e) => {
    const { name, value } = e.target;

    if (name in data.platforms) {
      setData((prev) => ({
        ...prev,
        platforms: {
          ...prev.platforms,
          [name]: value,
        },
      }));
    } else {
      setData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setProfileImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setProfileImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const nextStep = () => {
    if (!data.username || !data.email || !data.password || !data.branch || !data.graduationYear) {
      toast.error("Please fill all required fields");
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (data.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    setStep(2);
  };

  const prevStep = () => {
    setStep(1);
  };

  const registerHandler = async (event) => {
    event.preventDefault();

    if (step === 1) {
      nextStep();
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Build FormData to support optional profile image upload
      const formData = new FormData();
      formData.append("username", data.username.trim());
      formData.append("email", data.email.trim());
      formData.append("password", data.password);
      formData.append("branch", data.branch);
      formData.append("graduationYear", data.graduationYear);
      formData.append("platforms", JSON.stringify(data.platforms));

      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      const response = await register(formData, url);

      if (response.data.success) {
        toast.success("Account created successfully!");
        navigate("/login");
      } else {
        toast.error(response.data.message || "Registration failed");
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register">
      <form onSubmit={registerHandler} className="register-form">

        {step === 1 && (
          <>
            <h2 className="form-title">Create Account</h2>

            {/* Optional Profile Picture Upload */}
            <div className="signup-avatar-section">
              <label htmlFor="signup-avatar-input" className="signup-avatar-picker" title="Upload profile picture (optional)">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="signup-avatar-img" />
                ) : (
                  <div className="signup-avatar-placeholder">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </div>
                )}
                <div className="signup-avatar-badge" title="Choose photo">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                </div>
              </label>
              <input
                id="signup-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
              <div className="signup-avatar-meta">
                <span className="signup-avatar-label">Profile Photo</span>
                {imagePreview && (
                  <button type="button" onClick={handleRemoveImage} className="signup-avatar-remove">
                    Remove
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              name="username"
              onChange={onChangeHandler}
              value={data.username}
              className="username"
              placeholder="Username"
              required
            />

            <input
              type="email"
              name="email"
              onChange={onChangeHandler}
              value={data.email}
              className="email"
              placeholder="Email"
              required
            />

            <input
              type="password"
              name="password"
              onChange={onChangeHandler}
              value={data.password}
              className="password"
              placeholder="Password"
              required
              minLength={8}
            />

            <select
              name="branch"
              onChange={onChangeHandler}
              value={data.branch}
              className="branch-select"
              required
            >
              <option value="" disabled>Select Branch</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="ECE">ECE</option>
              <option value="Electical Engineering">Electical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="CSDS">CSDS</option>
              <option value="VLSI">VLSI</option>
              <option value="Robotics & AI">Robotics & AI</option>
              <option value="Electrical & Computer">Electrical & Computer</option>
              <option value="Construction Technology">Construction Technology</option>
            </select>

            <select
              name="graduationYear"
              onChange={onChangeHandler}
              value={data.graduationYear}
              className="year-select"
              required
            >
              <option value="" disabled>Select Graduation Year</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
              <option value="2031">2031</option>
            </select>

            <button type="submit" className="primary-btn">Next</button>

            <p className="login-link">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="form-title">Platform Handles (Optional)</h2>
            <div className="handles-grid">
              <input
                type="text"
                name="leetcode"
                onChange={onChangeHandler}
                value={data.platforms.leetcode}
                className="leetcode"
                placeholder="LeetCode username"
              />

              <input
                type="text"
                name="gfg"
                onChange={onChangeHandler}
                value={data.platforms.gfg}
                className="gfg"
                placeholder="GeeksforGeeks username"
              />

              <input
                type="text"
                name="codeforces"
                onChange={onChangeHandler}
                value={data.platforms.codeforces}
                className="codeforces"
                placeholder="Codeforces username"
              />

              <input
                type="text"
                name="codechef"
                onChange={onChangeHandler}
                value={data.platforms.codechef}
                className="codechef"
                placeholder="CodeChef username"
              />
            </div>

            {/* Toggle Help Section */}
            <p
              className="toggle-help"
              onClick={() => setShowHelp(!showHelp)}
            >
              Don’t know your platform username?
            </p>

            {showHelp && (
              <div className="platform-help">
                <p>You can find your username in your profile URL:</p>
                <ul>
                  <li>
                    <strong>LeetCode:</strong> https://leetcode.com/u/<span className="highlight">your_username</span>
                  </li>
                  <li>
                    <strong>GeeksforGeeks:</strong> https://www.geeksforgeeks.org/profile/<span className="highlight">your_username</span>
                  </li>
                  <li>
                    <strong>Codeforces:</strong> https://codeforces.com/profile/<span className="highlight">your_username</span>
                  </li>
                  <li>
                    <strong>CodeChef:</strong> https://www.codechef.com/users/<span className="highlight">your_username</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="button-group">
              <button type="button" className="secondary-btn" onClick={prevStep} disabled={isSubmitting}>Back</button>
              <button type="submit" className="primary-btn" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}