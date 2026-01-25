import { useContext, useEffect, useState } from "react";
import { fetchProblemsAPI } from "../../api/problem.api.js";
import { Context } from "../../context/AuthContext.jsx";
import "./Problems.css";
import { Link } from "react-router-dom";

export default function Problems() {
  //state variable to store the problems
  const [problem, setProblem] = useState([]);

  //url fetched from Context api
  const { url } = useContext(Context);

  //function to call fetchProblems api
  const fetchProblems = async () => {
    const response = await fetchProblemsAPI(url);
    setProblem(response);
  };

  //using useEffect to render the problems when the page re-renders
  useEffect(() => {
    fetchProblems();
  }, []);

  return (
    <div className="problems-page">
      <div className="problem-card">
        <div className="problem-header">
          <div className="problem-number">S.No</div>
          <div className="problem-name">Problem</div>
          <div className="problem-difficulty">Difficulty</div>
        </div>

        <div className="problem-list">
          {problem.map((p, index) => (
            <div className="problem-row" key={p._id}>
              {/*Serial number*/}
              <div className="problem-number">{index + 1}</div>

              {/*Problem Title*/}
              <div className="problem-title"><Link to={`/problems/${p.slug}`}>{p.title}</Link></div>

              {/*Problem difficulty*/}
              <div className="problem-difficulty">{p.difficulty}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
