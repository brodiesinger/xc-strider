import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Flag, Users } from "lucide-react";
import { parseISO, differenceInCalendarDays, format } from "date-fns";

function getCountdownText(daysUntil) {
  if (daysUntil === 0) return "Today! 🏁";
  if (daysUntil === 1) return "Tomorrow";
  return `${daysUntil} days away`;
}

export default function NextMeetCountdown({ teamId, athletes = [], isCoach = false, onOpenLineup }) {
  const [nextMeet, setNextMeet] = useState(null); // { meet, seasonName }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!teamId) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const seasons = await base44.entities.Season.filter({ team_id: teamId }, "-created_date", 50);
        if (!seasons || seasons.length === 0) { setLoading(false); return; }

        const seasonMap = {};
        seasons.forEach((s) => { seasonMap[s.id] = s.season_name; });

        const todayStr = format(new Date(), "yyyy-MM-dd");

        // Fetch meets for each season in parallel, filtered to only future meets
        const meetArrays = await Promise.all(
          seasons.map((s) =>
            base44.entities.Meet.filter({ season_id: s.id }, "meet_date", 50).catch(() => [])
          )
        );
        const allMeets = meetArrays.flat();

        const upcoming = allMeets
          .filter((m) => m.meet_date && m.meet_date >= todayStr)
          .sort((a, b) => a.meet_date.localeCompare(b.meet_date));

        if (upcoming.length === 0) { setLoading(false); return; }

        const meet = upcoming[0];
        setNextMeet({ meet, seasonName: seasonMap[meet.season_id] || "Season" });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading next meet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Unable to load next meet.</p>
      </div>
    );
  }

  if (!nextMeet) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Flag className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No upcoming meets scheduled.</p>
      </div>
    );
  }

  const { meet, seasonName } = nextMeet;
  const daysUntil = differenceInCalendarDays(parseISO(meet.meet_date), new Date());
  const countdownText = getCountdownText(daysUntil);
  const isToday = daysUntil === 0;
  const isSoon = daysUntil <= 3;

  return (
    <div className={`rounded-2xl border bg-card p-4 flex items-center gap-4 ${isToday ? "border-accent" : isSoon ? "border-primary/40" : "border-border"}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isToday ? "bg-accent/15" : "bg-primary/10"}`}>
        <CalendarDays className={`w-5 h-5 ${isToday ? "text-accent" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next Meet</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isToday ? "bg-accent/15 text-accent" :
            isSoon ? "bg-primary/10 text-primary" :
            "bg-muted text-muted-foreground"
          }`}>
            {countdownText}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground truncate mt-0.5">{meet.meet_name}</p>
        <p className="text-xs text-muted-foreground">{seasonName} · {format(parseISO(meet.meet_date), "MMM d, yyyy")}</p>
        {meet.conditions && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">{meet.conditions}</p>
        )}
        {isCoach && onOpenLineup && (
          <button
            onClick={() => onOpenLineup(meet)}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-full transition-colors"
          >
            <Users className="w-3 h-3" />
            Add Lineup
          </button>
        )}
      </div>
    </div>
  );
}