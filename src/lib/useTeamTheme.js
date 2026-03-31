import { useEffect } from "react";

/**
 * Converts a hex color (#rrggbb) to HSL string "H S% L%" suitable for CSS variables.
 */
function hexToHsl(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `${h} ${s}% ${l}%`;
}

/**
 * Determine readable foreground color (black or white) for a given hex background.
 */
function getContrastForeground(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "0 0% 10%" : "0 0% 98%";
}

/**
 * Applies team theme CSS variables to :root.
 * Pass null/undefined colors to reset to app defaults.
 */
export function applyTeamTheme(primaryHex, secondaryHex) {
  const root = document.documentElement;

  if (primaryHex && /^#[0-9a-fA-F]{6}$/.test(primaryHex)) {
    const hsl = hexToHsl(primaryHex);
    const fg = getContrastForeground(primaryHex);
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--primary-foreground", fg);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-primary-foreground", fg);
    root.style.setProperty("--sidebar-ring", hsl);
    root.style.setProperty("--chart-1", hsl);
  } else {
    // Reset to defaults
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-primary-foreground");
    root.style.removeProperty("--sidebar-ring");
    root.style.removeProperty("--chart-1");
  }

  if (secondaryHex && /^#[0-9a-fA-F]{6}$/.test(secondaryHex)) {
    const hsl = hexToHsl(secondaryHex);
    const fg = getContrastForeground(secondaryHex);
    root.style.setProperty("--accent", hsl);
    root.style.setProperty("--accent-foreground", fg);
    root.style.setProperty("--chart-2", hsl);
  } else {
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-foreground");
    root.style.removeProperty("--chart-2");
  }
}

/**
 * React hook — call with team object. Applies theme on mount/team change.
 */
export default function useTeamTheme(team) {
  useEffect(() => {
    applyTeamTheme(team?.primary_color, team?.secondary_color);
    return () => {
      // Reset on unmount only if you want scoped behavior (optional)
    };
  }, [team?.primary_color, team?.secondary_color]);
}