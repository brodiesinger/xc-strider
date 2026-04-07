import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Trophy, UserRound } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getDisplayName } from "@/lib/displayName";

const SECTIONS = [
  { key: "varsity_boys",  label: "Varsity Boys",  emoji: "🏆" },
  { key: "jv_boys",       label: "JV Boys",        emoji: "🔵" },
  { key: "varsity_girls", label: "Varsity Girls",  emoji: "🏆" },
  { key: "jv_girls",      label: "JV Girls",        emoji: "🔴" },
  { key: "unassigned",   label: "Other",            emoji: "📋" },
];

function ResultRow({ athlete, result }) {
  const name = getDisplayName(athlete);
  if (result?.did_not_run) {
    return (
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
            {name[0]?.toUpperCase() || "?"}
          </div>
          <span className="text-sm font-medium text-muted-foreground truncate">{name}</span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 ml-2">DNS</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2.5 min-w-0">
        {result?.place ? (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
            {result.place}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
            {name[0]?.toUpperCase() || "?"}
          </div>
        )}
        <span className="text-sm font-medium text-foreground truncate">{name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-2">
        {result?.time && <span className="text-xs font-mono font-semibold text-foreground">{result.time}</span>}
        {result?.points != null && result.points > 0 && (
          <span className="text-xs text-primary font-medium">{result.points}pts</span>
        )}
        {!result && <span className="text-xs text-muted-foreground">No result</span>}
      </div>
    </div>
  );
}

export default function MeetResultsViewer({ meet, athletes = [], seasonName, onClose }) {
  const [results, setResults] = useState([]);
  const [lineup,  setLineup]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [res, lin] = await Promise.all([
          base44.entities.MeetResult.filter({ meet_id: meet.id }).catch(() => []),
          base44.entities.MeetLineup.filter({ meet_id: meet.id }).catch(() => []),
        ]);
        setResults(res || []);
        setLineup(lin || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [meet.id]);

  // Build a merged athlete list: provided roster + any result athletes not in roster
  const athleteMap = {};
  (athletes || []).forEach(a => { if (a.email) athleteMap[a.email] = a; });
  // Add synthetic entries for result athletes not in roster (athlete dashboard case)
  results.forEach(r => {
    if (!athleteMap[r.athlete_id]) {
      athleteMap[r.athlete_id] = { email: r.athlete_id, full_name: r.athlete_id };
    }
  });
  const mergedAthletes = Object.values(athleteMap);

  const assignmentMap = {};
  lineup.forEach(r => { assignmentMap[r.athlete_id] = r.team_group; });

  const sectionAthletes = { varsity_boys: [], jv_boys: [], varsity_girls: [], jv_girls: [], unassigned: [] };
  const seen = new Set();
  mergedAthletes.forEach(a => {
    if (seen.has(a.email)) return;
    seen.add(a.email);
    const group = assignmentMap[a.email];
    if (group && sectionAthletes[group]) sectionAthletes[group].push(a);
    else sectionAthletes.unassigned.push(a);
  });

  const resultMap = {};
  results.forEach(r => { resultMap[r.athlete_id] = r; });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base leading-tight">{meet.meet_name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {seasonName} · {meet.meet_date ? format(parseISO(meet.meet_date), "MMM d, yyyy") : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground text-center py-8">Unable to load results.</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No results posted yet.</p>
          ) : (
            SECTIONS.map(section => {
              const list = sectionAthletes[section.key] || [];
              if (list.length === 0) return null;
              // Sort by place ascending (no place goes last)
              const sorted = [...list].sort((a, b) => {
                const ra = resultMap[a.email];
                const rb = resultMap[b.email];
                const pa = ra?.place ?? 9999;
                const pb = rb?.place ?? 9999;
                return pa - pb;
              });
              return (
                <div key={section.key} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <span>{section.emoji}</span> {section.label}
                  </p>
                  <div className="space-y-1.5">
                    {sorted.map(athlete => (
                      <ResultRow
                        key={athlete.email}
                        athlete={athlete}
                        result={resultMap[athlete.email] || null}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}