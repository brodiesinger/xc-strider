import React from "react";

export default function TeamGroupFilter({ value, onChange }) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onChange("boys")}
        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
          value === "boys"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        Boys Team
      </button>
      <button
        onClick={() => onChange("girls")}
        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
          value === "girls"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        Girls Team
      </button>
    </div>
  );
}