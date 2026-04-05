import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { TreePine } from "lucide-react";

const CurrentUserContext = createContext(null);

function GlobalLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
        <TreePine className="w-6 h-6 text-primary" />
      </div>
      <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/**
 * Single source of truth for the authenticated user.
 * - Blocks all rendering until the user is resolved.
 * - Exposes `isLoaded`, `currentUser`, `setCurrentUser`, and `refresh`.
 */
export function CurrentUserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user ?? null);
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Hard block — nothing renders until we know who the user is
  if (!isLoaded) return <GlobalLoader />;

  return (
    <CurrentUserContext.Provider value={{ currentUser, setCurrentUser, refresh, isLoaded }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

/** Returns true only if the user has explicitly confirmed their name during onboarding */
export function hasRealName(user) {
  return !!user?.name_confirmed;
}

/** Returns true only if the user has a recognized role */
export function hasRole(user) {
  return user?.user_type === "coach" || user?.user_type === "athlete";
}

/** Returns true only if the user has a team assigned */
export function hasTeam(user) {
  return !!user?.team_id;
}

/** Derives the correct onboarding step for a given user object. Returns null if fully onboarded. */
export function getOnboardingStep(user) {
  if (!user) return "unauthenticated";
  if (!hasRealName(user)) return "name";
  if (!hasRole(user)) return "role";
  if (user.user_type === "coach" && !hasTeam(user)) return "create-team";
  if (user.user_type === "athlete" && !hasTeam(user)) return "join-team";
  return null; // fully onboarded
}