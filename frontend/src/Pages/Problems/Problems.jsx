import { useContext, useEffect, useState, useCallback } from "react";
import { fetchProblemsAPI } from "../../api/problem.api.js";
import { Context } from "../../context/AuthContext.jsx";
import "./Problems.css";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner/Spinner.jsx";

// Toggle flag: set to false to unmask and display the problem list
const WIP_MASKED = true;

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const { url } = useContext(Context);
  const [loading, setLoading] = useState(!WIP_MASKED);

  /*========================
    Fetching Problems (Preserved for when unmasked)
  ==========================*/
  const fetchProblems = useCallback(async () => {
    if (WIP_MASKED) return;
    try {
      setLoading(true);
      const response = await fetchProblemsAPI(url);
      setProblems(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!WIP_MASKED) {
      fetchProblems();
    }
  }, [fetchProblems]);

  if (loading && !WIP_MASKED) {
    return <Spinner fullPage />;
  }

  // ── MINIMAL WORK IN PROGRESS MASK ─────────────────────────────────
  if (WIP_MASKED) {
    return (
      <div className="problems-page">
        <div className="problems-container">
          <h1 className="problems-title">Problems</h1>

          <div className="problems-wip-simple">
            <div className="wip-pill">
              <span className="wip-pulse" />
              <span>Work in Progress</span>
            </div>

            <h2 className="wip-simple-title">Under Construction</h2>
            <p className="wip-simple-text">
              This section is currently under development. Practice problems will be available soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── ORIGINAL PROBLEMS LIST (ACTIVE WHEN WIP_MASKED = false) ───────────
  return (
    <div className="problems-page">
      <div className="problems-container">
        <h2 className="problems-title">Problems</h2>

        {/* Header */}
        <div className="problems-header">
          <span>#</span>
          <span>Problem</span>
          <span>Difficulty</span>
        </div>

        {/* List */}
        <div className="problems-list">
          {problems.map((p, index) => (
            <div className="problem-row" key={p._id}>
              <span className="problem-index">{index + 1}</span>

              <Link to={`/problems/${p.slug}`} className="problem-link">
                {p.title}
              </Link>

              <span
                className={`problem-difficulty ${p.difficulty.toLowerCase()}`}
              >
                {p.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
