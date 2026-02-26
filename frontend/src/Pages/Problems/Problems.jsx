import { useContext, useEffect, useState } from "react";
import { fetchProblemsAPI } from "../../api/problem.api.js";
import { Context } from "../../context/AuthContext.jsx";
import "./Problems.css";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner/Spinner.jsx";

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const { url } = useContext(Context);
  const [loading, setLoading] = useState(true); // state for loader

  /*========================
    Fetching Problems
  ==========================*/
  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await fetchProblemsAPI(url);
      setProblems(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  if (loading) {
    return <Spinner fullPage />;
  }
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
