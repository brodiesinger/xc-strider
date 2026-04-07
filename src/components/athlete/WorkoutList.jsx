import React from "react";
import { format, parseISO } from "date-fns";
import { Clock, Ruler, FileText, Activity } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

export default function WorkoutList({ workouts }) {
  if (workouts.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No workouts logged yet"
        description="Start tracking your training by logging your first run."
      />
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((w) => (
        <div
          key={w.id}
          className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">
              {w.date ? (() => { try { return format(parseISO(w.date), "MMM d, yyyy"); } catch { return w.date; } })() : "—"}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" />
              {(w.distance ?? 0).toFixed(2)} mi
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {w.time_minutes ?? 0} min
            </span>
            {(w.distance > 0) && (w.time_minutes > 0) && (
              <span className="flex items-center gap-1.5 text-primary font-medium">
                {(() => { const p = (w.time_minutes) / (w.distance); const m = Math.floor(p); const s = Math.round((p - m) * 60); return `${m}:${s.toString().padStart(2,"0")} /mi`; })()}
              </span>
            )}
          </div>
          {w.notes && (
            <p className="text-sm text-muted-foreground flex items-start gap-1.5">
              <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {w.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}