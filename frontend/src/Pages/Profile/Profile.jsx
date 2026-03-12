import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Profile.css";
import { Context } from "../../context/AuthContext";
import { fetchUserProfile } from "../../api/profile.api.js";
import { syncUser } from "../../api/sync.api"; // Import the sync trigger
import Spinner from "../../components/Spinner/Spinner.jsx";
import { toast } from "react-toastify";

const Profile = () => {
  const { username } = useParams();
  const { url, token, user, syncing, setSyncing, syncStatus, setSyncStatus, startPolling } = useContext(Context);

  const [data, setData] = useState(null);

  const loadProfile = async () => {
    try {
      const profileData = await fetchUserProfile(url, username, token);
      setData(profileData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username, url, token]);

  // Handler for the Sync Button
  const handleSync = async () => {
    if (syncing || syncStatus === "syncing" || syncStatus === "queued") return;

    setSyncing(true);
    try {
      const response = await syncUser(url, token);
      if (response?.success) {
        toast.info("Syncing started...");
        setSyncStatus("queued");
        
        // Start polling and refresh profile data on completion
        startPolling(token, () => {
          toast.success("Profile updated!");
          loadProfile(); 
        });
      }
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (!data) return <Spinner fullPage />;

  // Check if this is the logged-in user's own profile
  const isOwnProfile = user?.username === username;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-left">
          <h2>{data.basic?.username || username}</h2>
          <p>Joined: {data.basic?.joinedAt ? new Date(data.basic.joinedAt).toDateString() : "N/A"}</p>
        </div>

        <div className="profile-right">
          {/* Only show Sync Button if it's the user's own profile */}
          {isOwnProfile && (
            <button 
              className="sync-btn" 
              onClick={handleSync}
              disabled={syncing || syncStatus === "queued" || syncStatus === "syncing"}
            >
              {syncStatus === "syncing" ? "Syncing..." : syncStatus === "queued" ? "In Queue..." : "Sync My Stats"}
            </button>
          )}
          <div className="profile-rank">#{data.ranking?.collegeRank || "N/A"}</div>
          <p>Out of {data.ranking?.totalStudents || 0} students</p>
        </div>
      </div>

      <div className="score-row">
        <div className="score-card">
          <h3>Total Coding Score</h3>
          <h1>{data.ranking?.totalScore ?? 0}</h1>
        </div>
        <div className="score-card">
          <h3>Total Problems Solved</h3>
          <h1>{data.ranking?.totalSolved ?? 0}</h1>
        </div>
      </div>

      <div className="platform-section">
        <h2>Platform Stats</h2>
        <div className="platform-grid">
          {data.platforms ? (
            Object.keys(data.platforms).map((platform) => (
              <div className="platform-card" key={platform}>
                <h3>{platform.toUpperCase()}</h3>
                <p>Rating: {data.platforms[platform]?.rating || 0}</p>
                <p>Solved: {data.platforms[platform]?.solvedCount || 0}</p>
                <p className="score">
                  Score: {data.platformScores?.[platform] || 0}
                </p>
              </div>
            ))
          ) : (
            <div className="no-data">
              <p>No platform data available.</p>
              {isOwnProfile && <p>Click "Sync My Stats" to pull your data.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;