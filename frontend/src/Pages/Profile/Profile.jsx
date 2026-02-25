import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Profile.css";
import { Context } from "../../context/AuthContext";
import { fetchUserProfile } from "../../api/profile.api.js";

const Profile = () => {
  const { username } = useParams();   // dynamic username
  const { url, token } = useContext(Context);

  const [data, setData] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await fetchUserProfile(
          url,
          username,
          token
        );
        setData(profileData);
      } catch (err) {
        console.error(err);
      }
    };

    if (username) {
      loadProfile();
    }
  }, [username, url, token]);

  if (!data) return <div className="loading">Loading...</div>;

  return (
   <div className="profile-page">

  {/* HEADER SECTION */}
  <div className="profile-header">
    <div className="profile-left">
      <h2>{data.basic.username}</h2>
      <p>Joined: {new Date(data.basic.joinedAt).toDateString()}</p>
    </div>

    <div className="profile-right">
      <div className="profile-rank">
        #{data.ranking.collegeRank}
      </div>
      <p>Out of {data.ranking.totalStudents} students</p>
    </div>
  </div>

  {/* SCORE SECTION */}
  <div className="score-row">
    <div className="score-card">
      <h3>Total Coding Score</h3>
      <h1>{data.ranking.totalScore}</h1>
    </div>

    <div className="score-card">
      <h3>Total Problems Solved</h3>
      <h1>{data.ranking.totalSolved}</h1>
    </div>
  </div>

  {/* PLATFORM SECTION */}
  <div className="platform-section">
    <h2>Platform Stats</h2>

    <div className="platform-grid">
      {Object.keys(data.platforms).map((platform) => (
        <div className="platform-card" key={platform}>
          <h3>{platform.toUpperCase()}</h3>
          <p>Rating: {data.platforms[platform]?.rating || 0}</p>
          <p>Solved: {data.platforms[platform]?.solvedCount || 0}</p>
          <p className="score">
            Score: {data.platformScores[platform] || 0}
          </p>
        </div>
      ))}
    </div>
  </div>

</div>
  );
};

export default Profile;