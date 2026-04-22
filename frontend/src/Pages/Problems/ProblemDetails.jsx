import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchOneProblemAPI } from "../../api/problem.api";
import { Context } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import "./ProblemDetails.css";
import { createSubmission } from "../../api/submission.api";
import Spinner from "../../components/Spinner/Spinner.jsx";
import runCode from "../../api/codeRunner.api.js";
import { getAllSubmissionsOfAProblem } from "../../api/submission.api.js";
import useSocket from "../../hooks/useSocket.js";
import { createContestSubmissionAPI, fetchContestSubmissionsAPI } from "../../api/contest.api.js";

/* ── helpers ────────────────────────────────────────────────────────────── */

const verdictClass = (v = "") => {
  if (["AC", "Accepted", "Passed"].includes(v)) return "verdict-AC";
  if (v === "TLE") return "verdict-TLE";
  return "verdict-WA";
};

const resultCardClass = (status = "") => {
  if (["Accepted", "Passed"].includes(status)) return "result-card pass";
  if (status === "TLE") return "result-card warn";
  return "result-card fail";
};

const resultBadgeClass = (status = "") => {
  if (["Accepted", "Passed"].includes(status)) return "result-status-badge verdict-AC";
  if (status === "TLE") return "result-status-badge verdict-TLE";
  return "result-status-badge verdict-WA";
};

/* ── component ──────────────────────────────────────────────────────────── */

export default function ProblemDetails() {
  const { url, token } = useContext(Context);
  const socketRef = useSocket(url, token);
  const { slug , contestSlug} = useParams();
  const navigate = useNavigate();

  const [problemDetail, setProblemDetail] = useState({});
  const [language, setLanguage]           = useState("java");
  const [code, setCode]                   = useState("import java.util.*;\nclass Main {\n    public static void main(String[] args) {\n\n    }\n}");
  const [loading, setLoading]             = useState(true);

  const [activeTab, setActiveTab]                   = useState("description");
  const [submissions, setSubmissions]               = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [results, setResults]   = useState([]);
  const [verdict, setVerdict]   = useState(null);
  const [running, setRunning]   = useState(false);

  /* ── resizable editor / result pane ────────────────────────────────── */
  // editorPct: percentage of the right panel height given to the editor
  const [editorPct, setEditorPct]   = useState(65);   // 65% editor, 35% result
  const isDragging                  = useRef(false);
  const dragStartY                  = useRef(0);
  const dragStartPct                = useRef(0);
  const rightPanelRef               = useRef(null);

  const onMouseDownDivider = useCallback((e) => {
    e.preventDefault();
    isDragging.current    = true;
    dragStartY.current    = e.clientY;
    dragStartPct.current  = editorPct;
    document.body.style.cursor    = "row-resize";
    document.body.style.userSelect = "none";
  }, [editorPct]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current || !rightPanelRef.current) return;
      const panelH  = rightPanelRef.current.clientHeight;
      const delta   = e.clientY - dragStartY.current;
      const deltaPct = (delta / panelH) * 100;
      const next    = Math.min(85, Math.max(20, dragStartPct.current + deltaPct));
      setEditorPct(next);
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current            = false;
      document.body.style.cursor    = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  /* ── boilerplates ─────────────────────────────────────────────────── */
  const boilerplates = {
    java:   "import java.util.*;\nclass Main {\n    public static void main(String[] args) {\n\n    }\n}",
    cpp:    "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\n}",
    python: "def solve():\n    pass",
  };

  useEffect(() => { setCode(boilerplates[language]); }, [language]);

  /* ── fetch problem ────────────────────────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setProblemDetail(await fetchOneProblemAPI(url, slug));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [slug]);

  /* ── fetch past submissions ───────────────────────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      try {
        if(!contestSlug) {
          const res = await getAllSubmissionsOfAProblem(url, slug, token);
          setSubmissions(res.data);
        }else {
          const res = await fetchContestSubmissionsAPI(url, contestSlug, slug, token);
          setSubmissions(res.data);
        }
      } catch (e) { console.error(e); }
    };
    fetch();
  }, [slug]);

  /* ── WebSocket listeners ──────────────────────────────────────────── */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data) => {
      setVerdict(data.error ? "Error" : data.verdict);
      setResults(data.error ? [] : (data.outputs || []));
      setRunning(false);
    };
    socket.on("submission:result", handler);
    return () => socket.off("submission:result", handler);
  }, [socketRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data) => {
      if (data.error) { setVerdict("Error"); setResults([]); }
      else {
        const outputs = data.outputs || [];
        setVerdict(outputs.every(o => o.status === "Passed") ? "AC" : (outputs[0]?.status || "WA"));
        setResults(outputs);
      }
      setRunning(false);
    };
    socket.on("run:result", handler);
    return () => socket.off("run:result", handler);
  }, [socketRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Contest submissions emit a different event — handle it here
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data) => {
      setVerdict(data.error ? "Error" : data.verdict);
      // Normalise field names: worker uses "expected" but the result pane reads "expectedOutput"
      const outputs = (data.outputs || []).map(o => ({
        ...o,
        expectedOutput: o.expectedOutput ?? o.expected ?? "",
      }));
      setResults(data.error ? [] : outputs);
      setRunning(false);
    };
    socket.on("contestSubmission:result", handler);
    return () => socket.off("contestSubmission:result", handler);
  }, [socketRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── handlers ─────────────────────────────────────────────────────── */
  const submitHandler = async () => {
    try {
      setRunning(true); setResults([]); setVerdict(null);

      if(contestSlug) {
        // If the problem is part of a contest, use the contest submission API
        await createContestSubmissionAPI(url,contestSlug, {problemId:problemDetail._id, code, language}, token);
      } else {
        // Otherwise, use the regular submission API
        await createSubmission(url, { problemId: problemDetail._id, code, language }, token);
      }
    } catch (e) {
      console.error(e); setVerdict("Error"); setResults([]); setRunning(false);
    }
  };

  const runHandler = async () => {
    try {
      setRunning(true); setResults([]); setVerdict(null);
      await runCode(url, { problemId: problemDetail._id, code, language }, token);
    } catch (e) {
      console.error(e); setVerdict("Error"); setResults([]); setRunning(false);
    }
  };

  const sampleTestCases = problemDetail?.testCases?.filter(t => t.isSample) || [];

  if (loading) return <Spinner fullPage />;

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <div className="problem-details">

      {/* ═══════════════ LEFT PANEL ═══════════════ */}
      <div className="problem-left">

        {contestSlug && (
          <div className="back-to-contest-container">
            <button 
              className="back-to-contest-btn" 
              onClick={() => navigate(`/contest/${contestSlug}`)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Contest
            </button>
          </div>
        )}

        <div className="tabs">
          {["description", "submissions"].map(tab => (
            <button
              key={tab}
              className={`tab-btn${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "submissions" && submissions.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, background: "#2d2d2d", color: "#8c8c8c", padding: "1px 6px", borderRadius: 99, fontWeight: 600 }}>
                  {submissions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Description */}
        {activeTab === "description" && (
          <div className="tab-content">
            {problemDetail.difficulty && (
              <div className="problem-meta">
                <span className={`problem-difficulty diff-${(problemDetail.difficulty || "").toLowerCase()}`}>
                  {problemDetail.difficulty}
                </span>
              </div>
            )}

            <h1 className="problem-title">{problemDetail.title}</h1>
            <p className="problem-description">{problemDetail.description}</p>

            {sampleTestCases.length > 0 && (
              <>
                <p className="section-label">Examples</p>
                {sampleTestCases.map((test, i) => (
                  <div className="testCase" key={i}>
                    <div className="testCase-header">Example {i + 1}</div>
                    <div className="testCase-body">
                      <div className="testCase-row"><label>Input</label><pre>{test.input}</pre></div>
                      <div className="testCase-row"><label>Output</label><pre>{test.output}</pre></div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {problemDetail?.tags?.length > 0 && (
              <div className="tags-section">
                <p className="section-label">Topics</p>
                <div className="tags-row">
                  {problemDetail.tags.map((tag, i) => <span className="tag" key={i}>{tag}</span>)}
                </div>
              </div>
            )}

            {problemDetail.constraints && (
              <div style={{ marginTop: 16 }}>
                <p className="section-label">Constraints</p>
                <div className="constraints">{problemDetail.constraints}</div>
              </div>
            )}
          </div>
        )}

        {/* Submissions */}
        {activeTab === "submissions" && (
          <div className="tab-content">
            {submissions.length > 0 ? (
              <div className="submissions-list">
                {submissions.map((sub, idx) => (
                  <div
                    key={idx}
                    className={`submission-card ${selectedSubmission?._id === sub._id ? "selected" : ""}`}
                    onClick={() => setSelectedSubmission(selectedSubmission?._id === sub._id ? null : sub)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="submission-header">
                      <span className={`verdict verdict-${sub.verdict}`}>{sub.verdict}</span>
                      <span className="language">{sub.language}</span>
                    </div>
                    <div className="submission-body">
                      <span>Time: {sub.executionTime}s</span>
                      <span>{new Date(sub.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="submissions-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>No submissions yet</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      <div className="problem-right" ref={rightPanelRef}>

        {/* ── Submission code viewer (overrides editor) ── */}
        {selectedSubmission ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <div className="submission-code-header">
              <h2>
                Submission · <span style={{ color: "#8c8c8c", fontWeight: 400 }}>{selectedSubmission.language}</span>
                <span className={`verdict-badge ${verdictClass(selectedSubmission.verdict)}`} style={{ marginLeft: 10, fontSize: 11 }}>
                  {selectedSubmission.verdict === "AC" ? "Accepted" : selectedSubmission.verdict}
                </span>
              </h2>
              <button className="close-btn" onClick={() => setSelectedSubmission(null)}>✕ Close</button>
            </div>
            {/* CodeEditor fills the remaining height */}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <CodeEditor
                key="submission-editor"
                language={selectedSubmission.language}
                code={selectedSubmission.code || ""}
                setCode={() => {}}
                readOnly={true}
              />
            </div>
          </div>

        ) : (
          /* ── Main editor + result pane (resizable) ── */
          <>
            {/* Toolbar */}
            <div className="toolbar">
              <select className="lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="python">Python</option>
              </select>
              <div className="run-submit-buttons">
                <button className="run-btn" disabled={running} onClick={runHandler}>
                  {running ? "Running…" : "Run"}
                </button>
                <button className="submit-btn" disabled={running} onClick={submitHandler}>
                  {running ? "Judging…" : "Submit"}
                </button>
              </div>
            </div>

            {/* Editor pane — height controlled by drag */}
            <div
              className="editor-pane"
              style={{ height: `${editorPct}%`, display: "flex", flexDirection: "column" }}
            >
              <CodeEditor language={language} code={code} setCode={setCode} />
            </div>

            {/* Drag handle */}
            <div
              className="drag-handle"
              onMouseDown={onMouseDownDivider}
              title="Drag to resize"
            />

            {/* Result pane — takes remaining height */}
            <div
              className="result-pane"
              style={{ flex: 1, minHeight: 0 }}
            >
              <div className="result-pane-header">
                <div className="result-pane-title">
                  <span>Test Results</span>
                  {!running && verdict && (
                    <span className={`result-verdict-pill ${verdictClass(verdict)}`}>
                      {verdict === "AC" ? "Accepted" : verdict}
                    </span>
                  )}
                </div>
              </div>

              <div className="result-pane-body">
                {running && (
                  <div className="exec-loading">
                    <div className="pulse-dots"><span /><span /><span /></div>
                    Judging your code…
                  </div>
                )}

                {!running && results.length > 0 && (
                  <div className="results-grid">
                    {results.map((res, i) => (
                      <div key={i} className={resultCardClass(res.status)}>
                        <div className="result-card-header">
                          <span className="result-card-title">Test {i + 1}</span>
                          <span className={resultBadgeClass(res.status)}>{res.status}</span>
                        </div>
                        <div className="result-card-body">
                          {res.input && res.input !== "—" && (
                            <div className="result-row"><label>Input</label><pre>{res.input}</pre></div>
                          )}
                          {res.expectedOutput && res.expectedOutput !== "—" && (
                            <div className="result-row"><label>Expected</label><pre>{res.expectedOutput}</pre></div>
                          )}
                          {res.actualOutput && res.actualOutput !== "—" && (
                            <div className="result-row"><label>Your Output</label><pre>{res.actualOutput}</pre></div>
                          )}
                          <div className="result-meta">
                            <div className="result-meta-item">
                              ⏱ <strong>{res.executionTime}s</strong>
                            </div>
                            {res.memoryUsed && res.memoryUsed !== "—" && (
                              <div className="result-meta-item">
                                💾 <strong>{res.memoryUsed} KB</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!running && results.length === 0 && !verdict && (
                  <p style={{ color: "#6e6e6e", fontSize: 13, marginTop: 4 }}>
                    Run or submit your code to see results here.
                  </p>
                )}

                {!running && results.length === 0 && verdict && (
                  <p style={{ color: "#8c8c8c", fontSize: 13 }}>
                    Verdict: <span className={`result-verdict-pill ${verdictClass(verdict)}`}>{verdict}</span>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
