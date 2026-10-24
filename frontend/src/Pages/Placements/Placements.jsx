import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Context } from "../../context/AuthContext.jsx";
import { fetchPlacementStats } from "../../api/placement.api.js";
import Spinner from "../../components/Spinner/Spinner.jsx";
import "./Placements.css";

export default function Placements() {
  const { url } = useContext(Context);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchPlacementStats(url);
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError("Failed to load placement data.");
        }
      } catch (err) {
        console.error("Error loading placement statistics:", err);
        setError("Unable to connect to database. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [url]);

  if (loading) {
    return (
      <div className="placements-page">
        <div className="placements-container">
          <div className="placements-loading">
            <Spinner />
            <p>Loading placement statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="placements-page">
        <div className="placements-container">
          <div className="placements-error">
            <p>{error || "No placement data available."}</p>
            <button className="btn-retry" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { branches, overall, companiesCovered, notes } = data;

  return (
    <div className="placements-page">
      <div className="placements-container">
        {/* Navigation & Header */}
        <div className="placements-nav-row">
          <Link to="/interviews" className="placements-back-link">
            ← Back to Interviews
          </Link>
        </div>

        <div className="placements-header">
          <h1 className="page-title">B.Tech Placement Statistics</h1>
          <p className="placements-subtitle">
            Branch-wise summary and package statistics for Jamia Millia Islamia B.Tech programs.
          </p>
          {companiesCovered && companiesCovered.length > 0 && (
            <div className="companies-covered-bar">
              <span className="companies-label">Companies covered:</span>
              <span className="companies-list">
                {companiesCovered.join(", ")}
              </span>
              <span className="companies-currency">(Packages in LPA)</span>
            </div>
          )}
        </div>

        {/* Executive Stat Cards */}
        {overall && (
          <div className="placements-metrics-grid">
            <div className="metric-card highlight">
              <span className="metric-label">Highest Package</span>
              <span className="metric-value">₹{overall.maxPackage?.toFixed(2)} LPA</span>
              <span className="metric-sub">Visa (Computer Engg)</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Average Package</span>
              <span className="metric-value">₹{overall.averagePackage?.toFixed(2)} LPA</span>
              <span className="metric-sub">Across 93 offers</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Median Package</span>
              <span className="metric-value">₹{overall.medianPackage?.toFixed(2)} LPA</span>
              <span className="metric-sub">All B.Tech branches</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Students Placed</span>
              <span className="metric-value">{overall.studentsPlaced}</span>
              <span className="metric-sub">With at least 1 offer</span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Total Offers</span>
              <span className="metric-value">{overall.totalOffers}</span>
              <span className="metric-sub">Includes 15 dual offers</span>
            </div>
          </div>
        )}

        {/* B.Tech Branch Summary Table */}
        <div className="placements-card">
          <div className="placements-card-header">
            <h2>B.Tech Branch Summary</h2>
          </div>

          <div className="table-responsive">
            <table className="placements-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Total Students</th>
                  <th>Students Placed</th>
                  <th>Total Offers</th>
                  <th>Min Package (LPA)</th>
                  <th>Max Package (LPA)</th>
                  <th>Median Package (LPA)</th>
                  <th>Average Package (LPA)</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch._id || branch.branch}>
                    <td className="branch-name-cell">{branch.branch}</td>
                    {/* For electrical the total number of students is missing so keep that place empty */}
                    <td className="center-cell">
                      {branch.totalStudents !== null && branch.totalStudents !== undefined
                        ? branch.totalStudents
                        : ""}
                    </td>
                    <td className="center-cell">{branch.studentsPlaced}</td>
                    <td className="center-cell">{branch.totalOffers}</td>
                    <td className="center-cell">
                      {branch.minPackage !== null && branch.minPackage !== undefined
                        ? branch.minPackage.toFixed(2)
                        : "N/A"}
                    </td>
                    <td className="center-cell">
                      {branch.maxPackage !== null && branch.maxPackage !== undefined
                        ? branch.maxPackage.toFixed(2)
                        : "N/A"}
                    </td>
                    <td className="center-cell">
                      {branch.medianPackage !== null && branch.medianPackage !== undefined
                        ? branch.medianPackage.toFixed(2)
                        : "N/A"}
                    </td>
                    <td className="center-cell">
                      {branch.averagePackage !== null && branch.averagePackage !== undefined
                        ? branch.averagePackage.toFixed(2)
                        : "N/A"}
                    </td>
                  </tr>
                ))}

                {/* Overall Summary Row */}
                {overall && (
                  <tr className="overall-row">
                    <td className="branch-name-cell">
                      <strong>{overall.branch}</strong>
                    </td>
                    <td className="center-cell">
                      {/* Overall total is also not available due to missing Electrical total */}
                      {overall.totalStudents !== null && overall.totalStudents !== undefined
                        ? overall.totalStudents
                        : ""}
                    </td>
                    <td className="center-cell">
                      <strong>{overall.studentsPlaced}</strong>
                    </td>
                    <td className="center-cell">
                      <strong>{overall.totalOffers}</strong>
                    </td>
                    <td className="center-cell">
                      <strong>{overall.minPackage?.toFixed(2)}</strong>
                    </td>
                    <td className="center-cell">
                      <strong>{overall.maxPackage?.toFixed(2)}</strong>
                    </td>
                    <td className="center-cell">
                      <strong>{overall.medianPackage?.toFixed(2)}</strong>
                    </td>
                    <td className="center-cell">
                      <strong>{overall.averagePackage?.toFixed(2)}</strong>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Notes */}
        {notes && notes.length > 0 && (
          <div className="placements-notes-card">
            <h3>Notes</h3>
            <ul className="notes-list">
              {notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
