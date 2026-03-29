import React from "react";
import { format, parseISO, isBefore, startOfToday } from "date-fns";
import { CalendarDays, MapPin, Clock, Megaphone } from "lucide-react";
import AnnouncementFeed from "./AnnouncementFeed";

export default function TeamDashboardView({ announcements, schedule }) {
  const today = startOfToday();
  const upcoming = schedule
    .filter((s) => s.date && !isBefore(parseISO(s.date), today))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
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