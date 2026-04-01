import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const CurrentUserContext = createContext(null);

/**
 * Provides `currentUser` to the whole app.
 * currentUser is the raw auth user with fields: id, email, full_name, role (user_type), team_id
 * The app does NOT render until currentUser is resolved.
 */
export function CurrentUserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user || null);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser, refresh }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}