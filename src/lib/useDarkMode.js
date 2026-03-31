import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook to manage per-user dark mode preference.
 * Reads from user profile (dark_mode field), persists changes back.
 * Toggles the "dark" class on <html> element.
 */
export default function useDarkMode(user) {
  const [isDark, setIsDark] = useState(false);

  // On user load, apply their saved preference
  useEffect(() => {
    if (!user) return;
    const saved = !!user.dark_mode;
    setIsDark(saved);
    applyDarkClass(saved);
  }, [user?.email]);

  const toggle = async (value) => {
    setIsDark(value);
    applyDarkClass(value);
    try {
      await base44.auth.updateMe({ dark_mode: value });
    } catch {}
  };

  return { isDark, toggle };
}

function applyDarkClass(enabled) {
  const html = document.documentElement;
  if (enabled) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}