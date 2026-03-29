import React from "react";
import { format, parseISO } from "date-fns";
import { Clock, Ruler, FileText } from "lucide-react";

export default function WorkoutList({ workouts }) {
  if (workouts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No workouts logged yet. Add your first one above!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((w) => (
        <div
          key={w.id}
          className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">
              {format(parseISO(w.date), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" />
              {w.distance} mi
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {w.time_minutes} min
            </span>
            {w.distance > 0 && w.time_minutes > 0 && (
              <span className="flex items-center gap-1.5 text-primary font-medium">
                {(w.time_minutes / w.distance).toFixed(1)} min/mi
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