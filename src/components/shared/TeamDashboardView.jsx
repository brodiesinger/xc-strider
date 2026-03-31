import React from "react";
import { format, parseISO, isBefore, isToday, startOfToday } from "date-fns";
import { CalendarDays, MapPin, Clock, Megaphone, Dumbbell } from "lucide-react";
import AnnouncementFeed from "./AnnouncementFeed";

export default function TeamDashboardView({ announcements = [], schedule = [] }) {
  const today = startOfToday();
  const todayEntry = schedule.find((s) => s.date && isToday(parseISO(s.date)));
  const upcoming = schedule
    .filter((s) => s.date && !isBefore(parseISO(s.date), today) && !isToday(parseISO(s.date)))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Today's Workout */}
      <div>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-primary" />
          Today's Workout
        </h2>
        {!todayEntry ? (
          <p className="text-sm text-muted-foreground text-center py-4 rounded-xl border border-border bg-card">No workout scheduled for today.</p>
        ) : (
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{todayEntry.title}</p>
              <span className="text-xs text-muted-foreground">{format(parseISO(todayEntry.date), "EEE, MMM d")}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {todayEntry.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{todayEntry.time}</span>}
              {todayEntry.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{todayEntry.location}</span>}
            </div>
            {todayEntry.notes && <p className="text-sm text-foreground/80 leading-relaxed">{todayEntry.notes}</p>}
          </div>
        )}
      </div>

      {/* Upcoming practices */}
      <div>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-primary" />
          Upcoming Practices
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No upcoming practices scheduled.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{s.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(s.date), "EEE, MMM d")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {s.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.time}
                    </span>
                  )}
                  {s.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {s.location}
                    </span>
                  )}
                </div>
                {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcements */}
      <div>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Megaphone className="w-4 h-4 text-primary" />
          Announcements
        </h2>
        <AnnouncementFeed announcements={announcements} />
      </div>
    </div>
  );
}