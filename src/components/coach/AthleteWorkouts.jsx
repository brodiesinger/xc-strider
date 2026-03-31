import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Ruler, Clock, FileText, User } from "lucide-react";

export default function AthleteWorkouts({ athlete }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkouts = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.Workout.filter(
          { athlete_email: athlete.email },
          "-date",
          100
        );
        setWorkouts(data);
      } finally {
        setLoading(false);
      }
    };
    loadWorkouts();
  }, [athlete.email]);

  return (
    <div>
      {/* Athlete header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-foreground text-lg">
            {athlete.full_name || athlete.email}
          </h2>
          {athlete.full_name && (
            <p className="text-xs text-muted-foreground">{athlete.email}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No workouts logged yet.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-1">{workouts.length} workout{workouts.length !== 1 ? "s" : ""}</p>
          {workouts.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
            >
              <span className="font-medium text-foreground">
                {w.date ? format(parseISO(w.date), "MMM d, yyyy") : "—"}
              </span>
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
                  <span className="text-primary font-medium">
                    {(() => { const p = w.time_minutes / w.distance; const m = Math.floor(p); const s = Math.round((p - m) * 60); return `${m}:${s.toString().padStart(2, "0")} /mi`; })()}
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
      )}
    </div>
  );
}