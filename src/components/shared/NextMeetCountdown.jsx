import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Flag, Users, Trophy, ChevronRight, X } from "lucide-react";
import { parseISO, differenceInCalendarDays, format } from "date-fns";
import MeetResultsViewer from "@/components/shared/MeetResultsViewer";

function getCountdownText(daysUntil) {
  if (daysUntil === 0) return "Today! 🏁";
  if (daysUntil === 1) return "Tomorrow";
  return `${daysUntil} days away`;
}

export default function NextMeetCountdown({ teamId, athletes = [], isCoach = false, onOpenLineup }) {
  const [widgetData, setWidgetData] = useState(null);
  // widgetData: { type: "upcoming"|"completed"|"no_results", meet, seasonName, hasResults }
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [dismissedMeetId, setDismissedMeetId] = useState(null);
  const [viewingResults, setViewingResults]   = useState(false);

  const load = useCallback(async () => {
    if (!teamId) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    try {
      const seasons = await base44.entities.Season.filter({ team_id: teamId }, "-created_date", 50);
      if (!seasons || seasons.length === 0) { setLoading(false); return; }

      const seasonMap = {};
      seasons.forEach((s) => { seasonMap[s.id] = s.season_name; });

      const todayStr = format(new Date(), "yyyy-MM-dd");

      const meetArrays = await Promise.all(
        seasons.map((s) =>
          base44.entities.Meet.filter({ season_id: s.id }, "meet_date", 50).catch(() => [])
        )
      );
      const allMeets = meetArrays.flat().filter((m) => m.meet_date);

      // 1. Find the most recent past meet with results (not dismissed)
      // Fetch results for all past meets in parallel instead of sequentially
      const pastMeets = allMeets
        .filter((m) => m.meet_date < todayStr)
        .sort((a, b) => b.meet_date.localeCompare(a.meet_date))
        .slice(0, 5); // only check last 5 past meets

      const pastResultCounts = await Promise.all(
        pastMeets.map((m) =>
          base44.entities.MeetResult.filter({ meet_id: m.id }).catch(() => [])
        )
      );

      for (let i = 0; i < pastMeets.length; i++) {
        const meet = pastMeets[i];
        if (meet.id === dismissedMeetId) continue;
        if (pastResultCounts[i] && pastResultCounts[i].length > 0) {
          setWidgetData({ type: "completed", meet, seasonName: seasonMap[meet.season_id] || "Season" });
          setLoading(false);
          return;
        }
      }

      // 2. Fall back to next upcoming meet
      const upcoming = allMeets
        .filter((m) => m.meet_date >= todayStr)
        .sort((a, b) => a.meet_date.localeCompare(b.meet_date));

      if (upcoming.length === 0) {
        setWidgetData(null);
      } else {
        const meet = upcoming[0];
        setWidgetData({ type: "upcoming", meet, seasonName: seasonMap[meet.season_id] || "Season" });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [teamId, dismissedMeetId]);

  useEffect(() => { load(); }, [load]);

  const handleDismiss = () => {
    if (widgetData?.meet?.id) {
      setDismissedMeetId(widgetData.meet.id);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading meet info...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Unable to load meet info.</p>
      </div>
    );
  }

  if (!widgetData) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Flag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">No upcoming meets</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first meet to get started.</p>
      </div>
    );
  }

  const { type, meet, seasonName } = widgetData;

  // ── Completed meet with results ──────────────────────────────────────────
  if (type === "completed") {
    return (
      <>
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meet Completed</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Results In</span>
            </div>
            <p className="text-sm font-semibold text-foreground truncate mt-0.5">{meet.meet_name}</p>
            <p className="text-xs text-muted-foreground">{seasonName} · {format(parseISO(meet.meet_date), "MMM d, yyyy")}</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setViewingResults(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-full transition-colors"
              >
                <Trophy className="w-3 h-3" />
                View Results
              </button>
              <button
                onClick={handleDismiss}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-3 h-3" />
                Dismiss
              </button>
            </div>
          </div>
        </div>

        {viewingResults && (
          <MeetResultsViewer
            meet={meet}
            athletes={athletes}
            seasonName={seasonName}
            onClose={() => { setViewingResults(false); handleDismiss(); }}
          />
        )}
      </>
    );
  }

  // ── Upcoming meet ────────────────────────────────────────────────────────
  const daysUntil = differenceInCalendarDays(parseISO(meet.meet_date), new Date());
  const countdownText = getCountdownText(daysUntil);
  const isToday = daysUntil === 0;
  const isSoon  = daysUntil <= 3;

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
            isSoon  ? "bg-primary/10 text-primary" :
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