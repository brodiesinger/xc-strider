import React from "react";
import { Moon, Sun } from "lucide-react";

export default function DarkModeToggle({ isDark, onToggle }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Sun className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium text-foreground">Dark Mode</span>
      </div>
      <button
        onClick={() => onToggle(!isDark)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          isDark ? "bg-primary" : "bg-muted-foreground/30"
        }`}
        role="switch"
        aria-checked={isDark}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            isDark ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}