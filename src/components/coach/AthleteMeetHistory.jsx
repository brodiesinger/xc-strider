import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Trophy, Calendar, Flag } from "lucide-react";

export default function AthleteMeetHistory({ athlete, teamId }) {
  const [groups, setGroups] = useState([]); // [{ seasonName, results: [...] }]
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const INITIAL_LIMIT = 10;

  useEffect(() => {
    if (!athlete?.email) return;

    const load = async () => {
      setLoading(true);
      try {
        // Fetch results for this athlete
        const results = await base44.entities.MeetResult.filter(
          { athlete_id: athlete.email },
          "-created_date",
          200
        ).catch(() => []);

        if (!results || results.length === 0) {
          setGroups([]);
          setLoading(false);
          return;
        }

        // Fetch meets for the result meet_ids
        const meetIds = [...new Set(results.map((r) => r.meet_id).filter(Boolean))];
        const allMeets = await base44.entities.Meet.list("-meet_date", 500).catch(() => []);
        const meetMap = {};
        allMeets.forEach((m) => { meetMap[m.id] = m; });

        // Fetch seasons for teamId
        const allSeasons = teamId
          ? await base44.entities.Season.filter({ team_id: teamId }, "-created_date", 100).catch(() => [])
          : [];
        const seasonMap = {};
        allSeasons.forEach((s) => { seasonMap[s.id] = s; });

        // Build enriched results
        const enriched = results
          .map((r) => {
            const meet = meetMap[r.meet_id] || null;
            const season = meet ? seasonMap[meet.season_id] || null : null;
            return {
              ...r,
              meet_name: meet?.meet_name || "—",
              meet_date: meet?.meet_date || null,
              season_name: season?.season_name || "Unknown Season",
              season_id: meet?.season_id || "unknown",
              _sort_date: meet?.meet_date || "0000-00-00",
            };
          })
          // Sort: most recent first
          .sort((a, b) => b._sort_date.localeCompare(a._sort_date));

        // Group by season
        const seasonOrder = [];
        const seasonGroups = {};
        enriched.forEach((r) => {
          if (!seasonGroups[r.season_id]) {
            seasonGroups[r.season_id] = { seasonName: r.season_name, results: [] };
            seasonOrder.push(r.season_id);
          }
          seasonGroups[r.season_id].results.push(r);
        });

        setGroups(seasonOrder.map((id) => seasonGroups[id]));
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [athlete?.email, teamId]);

  // Flatten for limit logic
  const allResults = groups.flatMap((g) => g.results);
  const totalCount = allResults.length;
  const limitedIds = new Set(!showAll ? allResults.slice(0, INITIAL_LIMIT).map((r) => r.id) : null);

  const visibleGroups = showAll
    ? groups
    : groups
        .map((g) => ({
          ...g,
          results: g.results.filter((r) => limitedIds.has(r.id)),
        }))
        .filter((g) => g.results.length > 0);

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="font-bold text-foreground text-base mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        Meet History
      </h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : totalCount === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No meet history yet.
        </p>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.seasonName}>
              {/* Season header */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {group.seasonName}
              </p>
              <div className="space-y-2">
                {group.results.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-border bg-card p-3.5 flex flex-col gap-1.5"
                  >
                    {/* Meet name + date */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-foreground text-sm leading-tight">
                        {r.meet_name}
                      </span>
                      {r.meet_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Calendar className="w-3 h-3" />
                          {(() => {
                            try { return format(parseISO(r.meet_date), "MMM d, yyyy"); }
                            catch { return r.meet_date; }
                          })()}
                        </span>
                      )}
                    </div>

                    {/* Result */}
                    {r.did_not_run ? (
                      <p className="text-xs text-muted-foreground italic">
                        Did Not Run{r.reason ? ` — ${r.reason}` : ""}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Flag className="w-3 h-3" />
                          {r.time || "—"}
                        </span>
                        <span>
                          Place: <span className="text-foreground font-medium">{r.place ?? "—"}</span>
                        </span>
                        <span>
                          Points: <span className="text-foreground font-medium">{r.points ?? "—"}</span>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!showAll && totalCount > INITIAL_LIMIT && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full text-sm text-primary font-medium py-2 rounded-xl border border-border hover:bg-primary/5 transition-colors"
            >
              View All ({totalCount} results)
            </button>
          )}
        </div>
      )}
    </div>
  );
}