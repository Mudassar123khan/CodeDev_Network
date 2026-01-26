import { useContext, useEffect, useState } from "react";
import { fetchProblemsAPI } from "../../api/problem.api.js";
import { Context } from "../../context/AuthContext.jsx";
import "./Problems.css";
import { Link } from "react-router-dom";

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const { url } = useContext(Context);

  const fetchProblems = async () => {
    const response = await fetchProblemsAPI(url);
    setProblems(response);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

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

              <Link
                to={`/problems/${p.slug}`}
                className="problem-link"
              >
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
