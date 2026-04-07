import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, UserRound, Medal } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { ordinal } from "./TeamPlacementEditor";

const GENDER_TABS = [
  { key: "boys",  label: "Boys" },
  { key: "girls", label: "Girls" },
];

const SECTIONS = {
  boys: [
    { key: "varsity_boys", label: "Varsity Boys", placeField: "varsity_boys_place" },
    { key: "jv_boys",      label: "JV Boys",      placeField: "jv_boys_place" },
  ],
  girls: [
    { key: "varsity_girls", label: "Varsity Girls", placeField: "varsity_girls_place" },
    { key: "jv_girls",      label: "JV Girls",      placeField: "jv_girls_place" },
  ],
};

function sortByPlace(results) {
  return [...results].sort((a, b) => {
    if (a.place != null && b.place != null) return a.place - b.place;
    if (a.place != null) return -1;
    if (b.place != null) return 1;
    return (a.time || "").localeCompare(b.time || "");
  });
}

function ResultRow({ r, athletes }) {
  const info = athletes.find((a) => a.email === r.athlete_id) || null;
  const name = info ? getDisplayName(info) : (r.athlete_id?.split("@")[0] || r.athlete_id || "Unknown");

  if (r.did_not_run) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
            <UserRound className="w-3 h-3 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground truncate">{name}</span>
        </div>
        <span className="text-xs text-muted-foreground italic ml-2 shrink-0">
          DNR{r.reason ? ` — ${r.reason}` : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-2 bg-card items-center">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UserRound className="w-3 h-3 text-primary" />
        </div>
        <span className="text-sm text-foreground truncate">{name}</span>
      </div>
      <span className="text-sm text-foreground text-right font-mono">{r.time || "—"}</span>
      <span className="text-sm text-foreground text-right">{r.place != null ? `#${r.place}` : "—"}</span>
      <span className="text-sm text-foreground text-right">{r.points != null ? r.points : 0}</span>
    </div>
  );
}

function SectionBlock({ section, results, athletes, meet }) {
  const teamPlace = meet[section.placeField];
  const sectionResults = results.filter((r) => r._group === section.key);
  const runners = sortByPlace(sectionResults.filter((r) => !r.did_not_run));
  const dnrs = sectionResults.filter((r) => r.did_not_run);
  const total = runners.length + dnrs.length;

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {section.label}
          {total > 0 && <span className="font-normal ml-1">({total})</span>}
        </p>
        {teamPlace != null && (
          <span className="flex items-center gap-1 text-xs font-semibold text-accent">
            <Medal className="w-3 h-3" />
            {ordinal(teamPlace)}
          </span>
        )}
      </div>

      {total === 0 ? (
        <p className="text-xs text-muted-foreground py-1 pl-1">
          No {section.label.toLowerCase()} results yet
        </p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {/* Column headers — only for runner rows */}
          {runners.length > 0 && (
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 bg-muted/40">
              <span className="text-xs text-muted-foreground">Athlete</span>
              <span className="text-xs text-muted-foreground text-right">Time</span>
              <span className="text-xs text-muted-foreground text-right">Place</span>
              <span className="text-xs text-muted-foreground text-right">Pts</span>
            </div>
          )}
          {runners.map((r) => <ResultRow key={r.athlete_id} r={r} athletes={athletes} />)}
          {dnrs.map((r) => <ResultRow key={r.athlete_id} r={r} athletes={athletes} />)}
        </div>
      )}
    </div>
  );
}

export default function MeetSummary({ meet, athletes }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState("boys");

  const fetchResults = useCallback(async () => {
    setLoadError(false);
    try {
      const [data, lineupData] = await Promise.all([
        base44.entities.MeetResult.filter({ meet_id: meet.id }),
        base44.entities.MeetLineup.filter({ meet_id: meet.id }),
      ]);

      // Build assignment map: athlete_id -> lineup group key
      const assignmentMap = {};
      (lineupData || []).forEach((l) => { assignmentMap[l.athlete_id] = l.team_group; });

      // Deduplicate results (one per athlete_id)
      const seen = new Set();
      const deduped = [];
      for (const r of (data || [])) {
        if (!r.athlete_id || seen.has(r.athlete_id)) continue;
        seen.add(r.athlete_id);
        // Attach group from lineup
        deduped.push({ ...r, _group: assignmentMap[r.athlete_id] || null });
      }
      setResults(deduped);
    } catch {
      setLoadError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [meet.id]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return <p className="text-xs text-destructive text-center py-3">Unable to load results.</p>;
  }

  if (results.length === 0) {
    return <p className="text-xs text-muted-foreground py-3 text-center">No results yet.</p>;
  }

  const sections = SECTIONS[activeTab];

  // Athletes with no lineup assignment — show below tabs regardless of active tab
  const unassigned = results.filter((r) => r._group === null || r._group === undefined);

  return (
    <div className="space-y-3 pt-2">
      {/* Boys / Girls tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {GENDER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${
              activeTab === tab.key
                ? "bg-card shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Varsity + JV sections for active tab */}
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={section.key}>
            {i > 0 && <div className="border-t border-border pt-4" />}
            <SectionBlock
              section={section}
              results={results}
              athletes={athletes || []}
              meet={meet}
            />
          </div>
        ))}

        {/* Unassigned results (no lineup match) — always visible */}
        {unassigned.length > 0 && (
          <div>
            <div className="border-t border-border pt-4" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Unassigned <span className="font-normal">({unassigned.length})</span>
              </p>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 py-1.5 bg-muted/40">
                  <span className="text-xs text-muted-foreground">Athlete</span>
                  <span className="text-xs text-muted-foreground text-right">Time</span>
                  <span className="text-xs text-muted-foreground text-right">Place</span>
                  <span className="text-xs text-muted-foreground text-right">Pts</span>
                </div>
                {unassigned.map((r) => (
                  <ResultRow key={r.athlete_id} r={r} athletes={athletes || []} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}