import "./Home.css";
import { Link } from "react-router-dom";
import { useContext, useRef } from "react";
import { Context } from "../../context/AuthContext";

export default function Home() {
  const { token } = useContext(Context);
  const howRef = useRef(null);

  const scrollToHow = () => {
    howRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* HERO */}
        <section className="home-hero">
          <h1>CodeDev Network</h1>
          <h2>Competitive Programming for Jamia Students</h2>

          <p>
            A campus-focused platform to track coding progress, compete on
            leaderboards, and build a strong competitive programming culture at
            Jamia Millia Islamia.
          </p>

          <div className="home-actions">
            {token ? (
              <Link to="/leaderboard" className="btn-primary">
                Go to Leaderboard
              </Link>
            ) : (
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            )}

            <Link to="/problems" className="btn-secondary">
              Go to Problems
            </Link>
          </div>
          <div className="scroll-hint" onClick={scrollToHow}>
            Learn how it works ↓
          </div>
        </section>

        {/* FEATURES */}
        <section className="home-features">
          <div className="feature-card">
            <h3>Unified Leaderboard</h3>
            <p>
              Rankings across Codeforces, LeetCode, CodeChef and GFG — all in
              one place.
            </p>
          </div>

          <div className="feature-card">
            <h3>Student-Only Competition</h3>
            <p>
              Compete only with Jamia students and measure your real standing on
              campus.
            </p>
          </div>

          <div className="feature-card">
            <h3>Profile Sync</h3>
            <p>
              Sync your coding profiles and keep your stats updated
              automatically.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="home-how" ref={howRef}>
          <h3 className="how-title">How It Works</h3>

          <div className="how-steps">
            <div className="how-step">
              <span className="step-number">01</span>
              <h4>Create an Account</h4>
              <p>
                Register using your details and become part of the Jamia Millia
                Islamia coding community.
              </p>
            </div>

            <div className="how-step">
              <span className="step-number">02</span>
              <h4>Sync Your Profiles</h4>
              <p>
                Connect your Codeforces, LeetCode, CodeChef, and GFG profiles
                with one click.
              </p>
            </div>

            <div className="how-step">
              <span className="step-number">03</span>
              <h4>Compete & Improve</h4>
              <p>
                Track your progress, climb the leaderboard, and grow through
                healthy competition on campus.
              </p>
            </div>
          </div>
        </section>

        {/* MISSION */}
        <section className="home-mission">
          <p>
            Built to encourage consistency, collaboration, and healthy
            competition among Jamia students.
          </p>
        </section>
      </div>
    </div>
  );
}
