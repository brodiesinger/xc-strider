import React from "react";
import { Dumbbell } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";

export default function TodaysWorkout({ schedule }) {
  const todayEntry = schedule?.find((s) => s.date && isToday(parseISO(s.date)));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-primary" />
        Today's Workout
      </h2>

      {!todayEntry ? (
        <p className="text-sm text-muted-foreground">
          No workout scheduled for today. Check back tomorrow or ask your coach!
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-background p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground">{todayEntry.title}</p>
            <span className="text-xs text-muted-foreground shrink-0">
              {format(parseISO(todayEntry.date), "EEE, MMM d")}
            </span>
          </div>
          {todayEntry.time && (
            <p className="text-xs text-muted-foreground">⏰ {todayEntry.time}</p>
          )}
          {todayEntry.location && (
            <p className="text-xs text-muted-foreground">📍 {todayEntry.location}</p>
          )}
          {todayEntry.notes && (
            <p className="text-sm text-foreground/80 leading-relaxed mt-1">{todayEntry.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}