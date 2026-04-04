import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ChevronRight, ChevronLeft, UserRound, Trophy } from "lucide-react";

// Parse "MM:SS" or "H:MM:SS" to total seconds for comparison. Returns null if unparseable.
function timeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.trim()) return null;
  const parts = timeStr.trim().split(":").map(Number);
  if (parts.some((n) => isNaN(n))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

/**
 * For a given athlete email, deduplicate across all meets.
 * Rules: one result per (meet_id + athlete_id) pair — keep first.
 */
function buildAthleteSeasonStats(allResults, athleteEmail, meetMap) {
  // Filter to this athlete only, group by meet_id keeping first
  const seenMeets = new Set();
  const validResults = [];
  for (const r of allResults) {
    if (r.athlete_id !== athleteEmail) continue;
    if (!r.meet_id) continue;
    if (seenMeets.has(r.meet_id)) continue; // deduplicate per meet
    seenMeets.add(r.meet_id);
    validResults.push(r);
  }

  const ran = validResults.filter((r) => !r.did_not_run);
  const totalPoints = ran.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
  const meetsRun = ran.length;

  // Best time = lowest seconds
  let bestTime = null;
  let bestTimeSecs = Infinity;
  for (const r of ran) {
    if (!r.time) continue;
    const secs = timeToSeconds(r.time);
    if (secs !== null && secs < bestTimeSecs) {
      bestTimeSecs = secs;
      bestTime = r.time;
    }
  }

  // Per-meet breakdown (all results including DNR)
  const meetBreakdown = validResults.map((r) => ({
    meetName: meetMap[r.meet_id]?.meet_name || r.meet_id,
    meetDate: meetMap[r.meet_id]?.meet_date || null,
    time: r.time || null,
    place: r.place != null ? r.place : null,
    points: !r.did_not_run ? (Number(r.points) || 0) : null,
    didNotRun: r.did_not_run,
    reason: r.reason || null,
  }));

  return { totalPoints, meetsRun, bestTime, meetBreakdown };
}

function AthleteDetailView({ athlete, stats, onBack }) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Season Summary
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <UserRound className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{athlete.full_name || athlete.email}</p>
          <p className="text-xs text-muted-foreground">{stats.meetsRun} meet{stats.meetsRun !== 1 ? "s" : ""} run · {stats.totalPoints} pts{stats.bestTime ? ` · Best: ${stats.bestTime}` : ""}</p>
        </div>
      </div>

      {stats.meetBreakdown.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No results yet.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {stats.meetBreakdown.map((m, i) => (
            <div key={i} className="px-3 py-2.5 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{m.meetName}</p>
                  {m.meetDate && <p className="text-xs text-muted-foreground">{m.meetDate}</p>}
                </div>
                {m.didNotRun ? (
                  <span className="text-xs text-muted-foreground italic shrink-0">DNR{m.reason ? ` — ${m.reason}` : ""}</span>
                ) : (
                  <div className="flex gap-3 text-right shrink-0">
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-mono text-foreground">{m.time || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Place</p>
                      <p className="text-sm text-foreground">{m.place != null ? `#${m.place}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pts</p>
                      <p className="text-sm text-foreground">{m.points ?? 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SeasonSummary({ season, meets, athletes }) {
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  // Use a stable key (comma-joined meet IDs) to avoid infinite refetch loops
  const meetIdsKey = meets.map((m) => m.id).join(",");
  const meetsRef = useRef(meets);
  meetsRef.current = meets;

  // meetMap for quick lookup
  const meetMap = useMemo(() => {
    const m = {};
    for (const meet of meets) m[meet.id] = meet;
    return m;
  }, [meetIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAllResults = useCallback(async () => {
    const currentMeets = meetsRef.current;
    if (currentMeets.length === 0) { setLoading(false); return; }
    setLoading(true);
    try {
      // Load in chunks of 5 meets to avoid large queries freezing UI
      const CHUNK = 5;
      const chunks = [];
      for (let i = 0; i < currentMeets.length; i += CHUNK) {
        chunks.push(currentMeets.slice(i, i + CHUNK));
      }
      const collected = [];
      for (const chunk of chunks) {
        const results = await Promise.all(
          chunk.map((m) => base44.entities.MeetResult.filter({ meet_id: m.id }).catch(() => []))
        );
        results.forEach((r) => collected.push(...(r || [])));
      }
      setAllResults(collected);
    } catch {
      setAllResults([]);
    } finally {
      setLoading(false);
    }
  }, []); // stable — uses meetsRef internally

  useEffect(() => {
    fetchAllResults();
  }, [meetIdsKey]); // re-fetch only when actual meet IDs change

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (selectedAthlete) {
    const stats = buildAthleteSeasonStats(allResults, selectedAthlete.email, meetMap);
    return (
      <AthleteDetailView
        athlete={selectedAthlete}
        stats={stats}
        onBack={() => setSelectedAthlete(null)}
      />
    );
  }

  if (!athletes || athletes.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No athletes on this team yet.</p>;
  }

  // Build summary rows for all athletes — deduplicated per athlete per meet
  const rows = athletes.map((athlete) => {
    const stats = buildAthleteSeasonStats(allResults, athlete.email, meetMap);
    return { athlete, ...stats };
  });

  // Sort by total points desc, then best time asc
  const sorted = [...rows].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    const aS = timeToSeconds(a.bestTime);
    const bS = timeToSeconds(b.bestTime);
    if (aS !== null && bS !== null) return aS - bS;
    if (aS !== null) return -1;
    if (bS !== null) return 1;
    return 0;
  });

  const hasAnyData = rows.some((r) => r.meetsRun > 0);

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 mb-1">
        <Trophy className="w-4 h-4 text-accent" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Season Summary — {season.season_name}</p>
      </div>

      {!hasAnyData ? (
        <p className="text-xs text-muted-foreground text-center py-4">No results recorded yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-2 mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Athlete</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Meets</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Best</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Pts</span>
            <span className="text-xs text-transparent">›</span>
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {sorted.map(({ athlete, totalPoints, meetsRun, bestTime }) => (
              <button
                key={athlete.email}
                onClick={() => setSelectedAthlete(athlete)}
                className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-2.5 bg-card hover:bg-muted/40 transition-colors items-center text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserRound className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground truncate">{athlete.full_name || athlete.email}</span>
                </div>
                <span className="text-sm text-foreground text-right">{meetsRun}</span>
                <span className="text-sm font-mono text-foreground text-right">{bestTime || "—"}</span>
                <span className="text-sm text-foreground text-right">{totalPoints}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}