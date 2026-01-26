import { useContext, useEffect, useState } from "react";
import { fetchOneProblemAPI } from "../../api/problem.api";
import { Context } from "../../context/AuthContext";
import { useParams } from "react-router-dom";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import "./ProblemDetails.css";
import { createSubmission } from "../../api/submission.api";

export default function ProblemDetails() {
  //fetching url from context api
  const { url,token } = useContext(Context);

  //use params hook to extract slug from the url
  const { slug } = useParams();
  //state variable to store the problem detail
  const [problemDetail, setProblemDetail] = useState({});

  //state variables for code editor
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState(`class Solution {\n\n}`);

  //function to call the problem details api
  const fetchProblemDetails = async () => {
    const response = await fetchOneProblemAPI(url, slug);
    setProblemDetail(response);
  };

  const boilerplates = {
    java: `class Solution {\n    public static void main(String[] args) {\n    }\n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n}`,
    python: `def solve():\n    pass`,
  };

  //useEffect to re-render after language change
  useEffect(() => {
    setCode(boilerplates[language]);
  }, [language]);

  //useEffect to re-render when new problem is requested
  useEffect(() => {
    fetchProblemDetails();
  }, [slug]);

  //submit button handler
  // const submitHandler =async ()=>{
  //   const payload = {
  //     problemId: problemDetail._id,
  //     code,
  //     language
  //   }
  //   const response = await createSubmission(url,payload,token);
  // }

  return (
    <div className="problem-details">
      {/* Left: Problem Description */}
      <div className="problem-left">
        <h1>{problemDetail.title}</h1>
        <p>{problemDetail.description}</p>
        {problemDetail?.testCases?.map((test, index) => (
          <div className="testCase" key={index}>
            <h2>Input: {test.input}</h2>
            <p>Output: {test.output}</p>
          </div>
        ))}

        <span>Topic Tags:</span>
        {problemDetail?.tags?.map((tag, index) => (
          <span className="tag" key={index}>
            {tag}{" "}
          </span>
        ))}

        <div className="constraints">
          Constraints: {problemDetail.constraints}
        </div>
      </div>

      {/* Right: Code Editor */}
      <div className="problem-right">
        <div className="toolbar">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <div className="run-submit-buttons">
            <button className="run-btn">Run</button>
            <button className="submit-btn">Submit</button>
          </div>
        </div>
        <div className="editor-info">
        Code execution is under development. You will be able to run and
          submit solutions soon.
        </div>
        <CodeEditor language={language} code={code} setCode={setCode} />
      </div>
    </div>
  );
}
