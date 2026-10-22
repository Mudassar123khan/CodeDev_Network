/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const Context = createContext(null);

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

  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem("token");
    if (stored && !isTokenExpired(stored)) {
      return stored;
    }
    if (stored) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken || isTokenExpired(storedToken)) {
      return null;
    }
    try {
      const stored = localStorage.getItem("user");
      return stored && stored !== "undefined" ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback((reason) => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    if (reason) {
      toast.warn(reason, { toastId: "admin-session-expired" });
    }
  }, []);

  // Global Axios response interceptor for 401 Unauthorized
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const reqUrl = error.config?.url || "";
          const isAuthAction = reqUrl.includes("/login") || reqUrl.includes("/register");
          if (!isAuthAction) {
            logout("Your admin session has expired. Please log in again.");
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  // Check token expiration on mount and tab focus
  useEffect(() => {
    const checkAuthStatus = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken && isTokenExpired(currentToken)) {
        logout("Your admin session has expired. Please log in again.");
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

  const contextValue = {
    url,
    token,
    setToken,
    setUser,
    user,
    logout
  };

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

