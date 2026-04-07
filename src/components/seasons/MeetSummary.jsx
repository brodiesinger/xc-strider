import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, UserRound, ChevronDown, ChevronRight, Medal } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { motion, AnimatePresence } from "framer-motion";
import { FIELDS, ordinal } from "./TeamPlacementEditor";

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
  const [expandedGroup, setExpandedGroup] = useState("boys");

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
  const allRunners = deduped.filter((r) => !r.did_not_run);
  const allDnrs = deduped.filter((r) => r.did_not_run);

  if (deduped.length === 0) {
    return <p className="text-xs text-muted-foreground py-3 text-center">No results yet.</p>;
  }

  // Organize by team_group
  const boysRunners = allRunners.filter((r) => getAthleteInfo(athletes, r.athlete_id)?.team_group === "boys");
  const girlsRunners = allRunners.filter((r) => getAthleteInfo(athletes, r.athlete_id)?.team_group === "girls");
  const boysDnrs = allDnrs.filter((r) => getAthleteInfo(athletes, r.athlete_id)?.team_group === "boys");
  const girlsDnrs = allDnrs.filter((r) => getAthleteInfo(athletes, r.athlete_id)?.team_group === "girls");

  // Sort runners by place
  const sortRunners = (runners) => [...runners].sort((a, b) => {
    if (a.place != null && b.place != null) return a.place - b.place;
    if (a.place != null) return -1;
    if (b.place != null) return 1;
    return (a.time || "").localeCompare(b.time || "");
  });

  const renderGroup = (label, runners, dnrs) => (
    <div>
      <button
        onClick={() => setExpandedGroup(expandedGroup === label ? null : label)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors text-left mb-2"
      >
        {expandedGroup === label ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-xs text-muted-foreground ml-auto">({runners.length + dnrs.length})</span>
      </button>

      <AnimatePresence>
        {expandedGroup === label && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Runners table */}
            {runners.length > 0 && (
              <div>
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Athlete</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Time</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Place</span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Pts</span>
                </div>
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {sortRunners(runners).map((r) => {
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Team placement pills — only show fields with a value
  const placementFields = FIELDS.filter(({ key }) => meet[key] != null && meet[key] !== "");
  const TeamPlacementBadges = placementFields.length > 0 ? (
    <div className="flex flex-wrap gap-1.5 pb-2">
      <Medal className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
      {placementFields.map(({ key, label }) => (
        <span key={key} className="text-xs font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
          {label} — {ordinal(meet[key])}
        </span>
      ))}
    </div>
  ) : null;

  return (
    <div className="space-y-3 pt-2">
      {TeamPlacementBadges}
      {boysRunners.length > 0 || boysDnrs.length > 0 ? renderGroup("👦 Boys Team", boysRunners, boysDnrs) : null}
      {girlsRunners.length > 0 || girlsDnrs.length > 0 ? renderGroup("👩 Girls Team", girlsRunners, girlsDnrs) : null}
    </div>
  );
}