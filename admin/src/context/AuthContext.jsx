/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";

export const Context = createContext(null);

export const ContextProvider = ({ children }) => {
  const url = "http://localhost:3000/api";
  
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored && stored !== "undefined" ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
      try {
        const stored = localStorage.getItem("user");
        if (stored && stored !== 'undefined') setUser(JSON.parse(stored));
      } catch {
        // Ignore error
      }
    }
  }, []);

  const contextValue = {
    url,
    token,
    setToken,
    setUser,
    user
  };

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};
