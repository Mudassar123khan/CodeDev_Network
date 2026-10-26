import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import "./Profile.css";
import { Context } from "../../context/AuthContext";
import { fetchUserProfile, updateUserPlatforms, uploadProfileImage } from "../../api/profile.api.js";
import { syncUser } from "../../api/sync.api";
import { assets } from "../../assets/assets.js";
import Spinner from "../../components/Spinner/Spinner.jsx";
import { toast } from "react-toastify";

const PLATFORM_CONFIG = {
  leetcode: {
    name: "LeetCode",
    placeholder: "LeetCode username (e.g. tourist)",
  },
  codeforces: {
    name: "Codeforces",
    placeholder: "Codeforces username (e.g. tourist)",
  },
  codechef: {
    name: "CodeChef",
    placeholder: "CodeChef username (e.g. tourist)",
  },
  gfg: {
    name: "GeeksforGeeks",
    placeholder: "GeeksforGeeks username (e.g. tourist)",
  },
};

const PLATFORM_KEYS = ["leetcode", "codeforces", "codechef", "gfg"];

const Profile = () => {
  const { username } = useParams();
  const { url, token, user, updateUser, syncing, setSyncing, syncStatus, setSyncStatus, startPolling } = useContext(Context);

  const [data, setData] = useState(null);

  // Profile image upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPlatforms, setEditPlatforms] = useState({
    leetcode: "",
    codeforces: "",
    codechef: "",
    gfg: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadProfileImage(url, file, token);
      if (res?.success) {
        toast.success("Profile photo updated successfully!");
        setData((prev) => ({
          ...prev,
          basic: {
            ...prev.basic,
            profileImage: res.profileImage,
          },
        }));
        if (updateUser) {
          updateUser({ profileImage: res.profileImage });
        }
      } else {
        toast.error(res?.message || "Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload profile photo");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const loadProfile = useCallback(async () => {
    try {
      const profileData = await fetchUserProfile(url, username, token);
      setData(profileData);
    } catch (err) {
      console.error(err);
    }
  }, [url, username, token]);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username, loadProfile]);

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
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Open Edit Modal with current handles
  const openEditModal = () => {
    setEditPlatforms({
      leetcode: data?.userPlatforms?.leetcode || data?.platforms?.leetcode?.handle || "",
      codeforces: data?.userPlatforms?.codeforces || data?.platforms?.codeforces?.handle || "",
      codechef: data?.userPlatforms?.codechef || data?.platforms?.codechef?.handle || "",
      gfg: data?.userPlatforms?.gfg || data?.platforms?.gfg?.handle || "",
    });
    setShowHelp(false);
    setIsEditModalOpen(true);
  };

  const closeEditModal = useCallback(() => {
    if (!isSaving) {
      setIsEditModalOpen(false);
    }
  }, [isSaving]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditPlatforms((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSavePlatforms = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const response = await updateUserPlatforms(url, editPlatforms, token);
      if (response?.success) {
        toast.success("Platform usernames updated successfully!");
        setIsEditModalOpen(false);
        await loadProfile();

        if (autoSync) {
          handleSync();
        }
      } else {
        toast.error(response?.message || "Failed to update platform usernames");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update platform usernames");
    } finally {
      setIsSaving(false);
    }
  };

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isEditModalOpen) {
        closeEditModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditModalOpen, closeEditModal]);

  if (!data) return <Spinner fullPage />;

  const isOwnProfile = user?.username === username;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-left">
          <div className="profile-avatar-container">
            <div className="profile-avatar-wrapper">
              <img
                src={data.basic?.profileImage || assets.profile_icon}
                alt={data.basic?.username || username}
                className="profile-avatar-img"
              />
              {isOwnProfile && (
                <button
                  type="button"
                  className="profile-avatar-overlay-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Change profile picture"
                >
                  {isUploadingAvatar ? (
                    <div className="avatar-upload-spinner" />
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      <span className="avatar-overlay-text">Change</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {isOwnProfile && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            )}
          </div>

          <div className="profile-user-info">
            <h2>{data.basic?.username || username}</h2>
            <p>Joined: {data.basic?.joinedAt ? new Date(data.basic.joinedAt).toDateString() : "N/A"}</p>
            {(data.basic?.branch || data.basic?.graduationYear) && (
              <div className="profile-details-sub">
                {data.basic.branch && <span className="profile-branch">{data.basic.branch}</span>}
                {data.basic.graduationYear && <span className="profile-grad-year">Grad: {data.basic.graduationYear}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="profile-right">
          <div className="profile-header-actions">
            {isOwnProfile && (
              <>
                <button
                  type="button"
                  className="edit-handles-btn"
                  onClick={openEditModal}
                  title="Edit coding platform handles"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  Edit Handles
                </button>

                <button
                  type="button"
                  className="sync-btn"
                  onClick={handleSync}
                  disabled={syncing || syncStatus === "queued" || syncStatus === "syncing"}
                >
                  {syncStatus === "syncing" ? "Syncing..." : syncStatus === "queued" ? "In Queue..." : "Sync My Stats"}
                </button>
              </>
            )}
          </div>
          <div className="profile-rank-info">
            <div className="profile-rank">#{data.ranking?.collegeRank || "N/A"}</div>
            <p>Out of {data.ranking?.totalStudents || 0} students</p>
          </div>
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

      {/* Edit Platform Handles Modal */}
      {isEditModalOpen && (
        <div className="profile-modal-overlay" onClick={closeEditModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div>
                <h3 className="profile-modal-title">Edit Platform Usernames</h3>
                <p className="profile-modal-subtitle">Update your coding platform handles to sync scores</p>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                onClick={closeEditModal}
                disabled={isSaving}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlatforms}>
              <div className="profile-modal-body">
                {PLATFORM_KEYS.map((key) => {
                  const config = PLATFORM_CONFIG[key];
                  return (
                    <div className="platform-input-group" key={key}>
                      <label className="platform-input-label" htmlFor={`input-${key}`}>
                        <span>{config.name}</span>
                        {editPlatforms[key] && (
                          <span className="platform-preview-tag">@{editPlatforms[key]}</span>
                        )}
                      </label>
                      <input
                        id={`input-${key}`}
                        type="text"
                        name={key}
                        value={editPlatforms[key]}
                        onChange={handleInputChange}
                        placeholder={config.placeholder}
                        className="platform-input"
                        autoComplete="off"
                        maxLength={50}
                        disabled={isSaving}
                      />
                    </div>
                  );
                })}

                {/* Help Section */}
                <div className="profile-help-container">
                  <p
                    className="profile-toggle-help"
                    onClick={() => setShowHelp(!showHelp)}
                  >
                    <span>{showHelp ? "▾" : "▸"}</span> Don’t know your platform username?
                  </p>

                  {showHelp && (
                    <div className="profile-help-box">
                      <p>You can find your username in your profile URL:</p>
                      <ul>
                        <li>
                          <strong>LeetCode:</strong> leetcode.com/u/<span className="highlight">username</span>
                        </li>
                        <li>
                          <strong>GeeksforGeeks:</strong> geeksforgeeks.org/user/<span className="highlight">username</span>
                        </li>
                        <li>
                          <strong>Codeforces:</strong> codeforces.com/profile/<span className="highlight">username</span>
                        </li>
                        <li>
                          <strong>CodeChef:</strong> codechef.com/users/<span className="highlight">username</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Auto-sync Option */}
                <label className="profile-sync-option">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    disabled={isSaving}
                  />
                  <span>Sync stats immediately after saving</span>
                </label>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeEditModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;