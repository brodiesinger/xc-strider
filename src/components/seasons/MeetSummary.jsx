import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, UserRound } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";

/**
 * Deduplicates results: one entry per athlete_id (keep first encountered).
 * Filters out entries with no athlete_id or where did_not_run is true (for display rows).
 */
function deduplicateResults(rawResults) {
  const seen = new Set();
  const deduped = [];
  for (const r of rawResults) {
    if (!r.athlete_id) continue; // skip invalid
    if (seen.has(r.athlete_id)) continue; // skip duplicate
    seen.add(r.athlete_id);
    deduped.push(r);
  }
  return deduped;
}

function getAthleteInfo(athletes, email) {
  return athletes.find((a) => a.email === email) || null;
}

export default function MeetSummary({ meet, athletes }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MeetResult.filter({ meet_id: meet.id });
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [meet.id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const deduped = deduplicateResults(results);
  const runners = deduped.filter((r) => !r.did_not_run);
  const dnrs = deduped.filter((r) => r.did_not_run);

  if (deduped.length === 0) {
    return <p className="text-xs text-muted-foreground py-3 text-center">No results yet.</p>;
  }

  // Sort runners by place (nulls last), then by time string
  const sorted = [...runners].sort((a, b) => {
    if (a.place != null && b.place != null) return a.place - b.place;
    if (a.place != null) return -1;
    if (b.place != null) return 1;
    return (a.time || "").localeCompare(b.time || "");
  });

  return (
    <div className="space-y-3 pt-2">
      {/* Runners table */}
      {sorted.length > 0 && (
        <div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2 mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Athlete</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Time</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Place</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Pts</span>
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {sorted.map((r) => {
                const info = getAthleteInfo(athletes, r.athlete_id);
                const name = info ? getDisplayName(info) : r.athlete_id;
                return (
                <div key={r.athlete_id} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 bg-card items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <UserRound className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground truncate">{name}</span>
                  </div>
                  <span className="text-sm text-foreground text-right font-mono">{r.time || "—"}</span>
                  <span className="text-sm text-foreground text-right">{r.place != null ? `#${r.place}` : "—"}</span>
                  <span className="text-sm text-foreground text-right">{r.points != null ? r.points : 0}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DNR section */}
      {dnrs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Did Not Run</p>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {dnrs.map((r) => {
                const info = getAthleteInfo(athletes, r.athlete_id);
                const name = info ? getDisplayName(info) : r.athlete_id;
                return (
                <div key={r.athlete_id} className="flex items-center justify-between px-3 py-2 bg-card">
                  <span className="text-sm text-muted-foreground">{name}</span>
                  {r.reason && <span className="text-xs text-muted-foreground ml-2 truncate max-w-[60%]">{r.reason}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}