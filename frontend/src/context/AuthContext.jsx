/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getSyncStatus } from "../api/sync.api";

export const Context = createContext(null);

/**
 * Checks if a JWT token is expired by decoding its payload without third-party dependencies.
 */
export const isTokenExpired = (jwtToken) => {
  if (!jwtToken || typeof jwtToken !== "string") return true;
  try {
    const parts = jwtToken.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

export const ContextProvider = ({ children }) => {
  const url = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  // Initialize token synchronously from localStorage, verifying it is not expired
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && !isTokenExpired(storedToken)) {
      return storedToken;
    }
    if (storedToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return null;
  });

  // Initialize user synchronously from localStorage
  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken || isTokenExpired(storedToken)) {
      return null;
    }
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser && storedUser !== "undefined"
        ? JSON.parse(storedUser)
        : null;
    } catch {
      return null;
    }
  });

  // Global Sync States
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const pollingRef = useRef(null);

  /**
   * Centralized logout handler that clears localStorage, context states, and alerts the user.
   */
  const logout = useCallback((reason) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (reason) {
      toast.warn(reason, { toastId: "session-expired" });
    }
  }, []);

  // Global Axios response interceptor to detect 401 Unauthorized errors across all pages
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const reqUrl = error.config?.url || "";
          // Do not treat intentional wrong password errors at /login or /register as expired sessions
          const isAuthAction =
            reqUrl.includes("/login") || reqUrl.includes("/register");
          if (!isAuthAction) {
            logout("Your session has expired. Please log in again.");
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  // Check token expiration on initial mount and when user switches back to the tab
  useEffect(() => {
    const checkAuthStatus = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken && isTokenExpired(currentToken)) {
        logout("Your session has expired. Please log in again.");
      }
    };

    checkAuthStatus();
    window.addEventListener("focus", checkAuthStatus);
    document.addEventListener("visibilitychange", checkAuthStatus);

    return () => {
      window.removeEventListener("focus", checkAuthStatus);
      document.removeEventListener("visibilitychange", checkAuthStatus);
    };
  }, [logout]);

  const startPolling = (apiToken, onComplete) => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const statusResponse = await getSyncStatus(url, apiToken);
        if (!statusResponse) return;

        const status = statusResponse.syncStatus;
        setSyncStatus(status);

        if (status === "done" || status === "failed") {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          if (status === "done" && onComplete) onComplete();
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);
  };

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...updatedFields };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const contextValue = {
    url,
    token,
    setToken,
    setUser,
    user,
    updateUser,
    logout,
    syncing,
    setSyncing,
    syncStatus,
    setSyncStatus,
    startPolling,
  };

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

