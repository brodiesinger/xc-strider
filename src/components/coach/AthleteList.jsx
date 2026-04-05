import React from "react";
import { User, ChevronRight } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";

export default function AthleteList({ athletes, onSelect }) {
  if (athletes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        No athletes on the roster yet.
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-semibold text-foreground mb-3">
        Team Roster ({athletes.length})
      </h2>
      <div className="space-y-2">
        {athletes.map((athlete) => (
          <button
            key={athlete.id}
            onClick={() => onSelect(athlete)}
            className="w-full text-left rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {getDisplayName(athlete)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}