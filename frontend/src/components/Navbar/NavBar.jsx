import { Link } from "react-router-dom";
import "./NavBar.css";
import { assets } from "../../assets/assets.js";
import { useContext, useState, useEffect, useRef } from "react";
import { Context } from "../../context/AuthContext.jsx";

export default function NavBar() {
  const { token, setToken, user } = useContext(Context);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="navbar">
      {/* LEFT */}
      <Link to="/" className="navbar-logo">
        <img src={assets.logo} alt="CodeDev_Network" className="logo" />
      </Link>

      {/* DESKTOP MENU */}
      <ul className="navbar-menu desktop-menu">
        <Link to="/contest">Contest</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        <Link to="/problems">Problems</Link>
      </ul>

      {/* RIGHT (DESKTOP AUTH) */}
      <div className="navbar-right desktop-only">
        {token ? (
          <div className="desktop-profile" ref={dropdownRef}>
            <img
              src={assets.profile_icon}
              className="profile-image"
              alt="profile"
              onClick={() => setDropdownOpen((prev) => !prev)}
            />
            {dropdownOpen && (
              <div className="desktop-dropdown-menu">
                <Link to={`/profile/${user.username}`} onClick={() => setDropdownOpen(false)}>
                  Profile
                </Link>
                <div className="dropdown-divider" />
                <div className="desktop-logout" onClick={logout}>
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login">Login</Link>
            <span>/</span>
            <Link to="/register">Register</Link>
          </div>
        )}
      </div>

      {/* HAMBURGER */}
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {/* PROFILE (TOP) */}
        {token && (
          <Link to={`/profile/${user.username}`}>
            <div className="menu-profile-top">
              <img src={assets.profile_icon} alt="profile" />
              <span>Profile</span>
            </div>
          </Link>
        )}

        {/* NAV LINKS */}
        <Link to="/contest" onClick={() => setMenuOpen(false)}>
          Contest
        </Link>
        <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>
          Leaderboard
        </Link>
        <Link to="/problems" onClick={() => setMenuOpen(false)}>
          Problems
        </Link>

        <div className="menu-divider" />

        {/* AUTH */}
        {token ? (
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}>
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
