import "./Register.css";
import { register } from "../../api/auth.api";
import { useState, useContext } from "react";
import { Context } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const { url } = useContext(Context);
  const navigate = useNavigate();

  const [showHelp, setShowHelp] = useState(false);

  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
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

  const registerHandler = async (event) => {
    event.preventDefault();

    try {
      const response = await register(data, url);

      if (response.data.success) {
        toast.success("Account created successfully");
        navigate("/login");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <div className="register">
      <form onSubmit={registerHandler} className="register-form">
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
        />

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

        <button type="submit">Create Account</button>

        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}