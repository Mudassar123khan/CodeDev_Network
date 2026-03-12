import { createContext, useEffect, useState, useRef } from "react";
import { getSyncStatus } from "../api/sync.api"; // Ensure path is correct

export const Context = createContext(null);

export const ContextProvider = ({ children }) => {
  //const url = "http://localhost:3000/api";
  const url = 'https://codedev-network-1.onrender.com/api';
  
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user")),
  );

  // Global Sync States
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const pollingRef = useRef(null);

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

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
      setUser(JSON.parse(localStorage.getItem("user")));
    }
  }, []);

  const contextValue = {
    url,
    token,
    setToken,
    setUser,
    user,
    syncing,
    setSyncing,
    syncStatus,
    setSyncStatus,
    startPolling,
  };

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};