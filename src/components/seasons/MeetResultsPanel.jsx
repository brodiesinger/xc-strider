import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2, UserRound, Medal } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { ordinal } from "./TeamPlacementEditor";

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDER_TABS = [
  { key: "boys",  label: "Boys" },
  { key: "girls", label: "Girls" },
];

const GENDER_SECTIONS = {
  boys:  [
    { key: "varsity_boys", label: "Varsity Boys",  placeField: "varsity_boys_place" },
    { key: "jv_boys",      label: "JV Boys",       placeField: "jv_boys_place" },
  ],
  girls: [
    { key: "varsity_girls", label: "Varsity Girls", placeField: "varsity_girls_place" },
    { key: "jv_girls",      label: "JV Girls",      placeField: "jv_girls_place" },
  ],
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validateResult(fields) {
  if (fields.did_not_run) {
    if (!fields.reason.trim()) return "Reason is required when athlete did not run.";
    return null;
  }
  if (fields.place !== "" && fields.place !== null) {
    const p = Number(fields.place);
    if (!Number.isInteger(p) || p < 1) return "Place must be a positive whole number.";
  }
  const pts = Number(fields.points);
  if (isNaN(pts) || pts < 0) return "Points must be 0 or greater.";
  return null;
}

// ─── Athlete result row (unchanged logic) ─────────────────────────────────────

function AthleteResultRow({ meetId, athlete, existingResult, onSaved }) {
  const [time, setTime] = useState(existingResult?.time ?? "");
  const [place, setPlace] = useState(existingResult?.place != null ? String(existingResult.place) : "");
  const [points, setPoints] = useState(existingResult?.points != null ? String(existingResult.points) : "0");
  const [didNotRun, setDidNotRun] = useState(existingResult?.did_not_run ?? false);
  const [reason, setReason] = useState(existingResult?.reason ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setTime(existingResult?.time ?? "");
    setPlace(existingResult?.place != null ? String(existingResult.place) : "");
    setPoints(existingResult?.points != null ? String(existingResult.points) : "0");
    setDidNotRun(existingResult?.did_not_run ?? false);
    setReason(existingResult?.reason ?? "");
  }, [existingResult?.id]);

  const handleSave = async () => {
    if (saving) return;
    const fields = {
      time: typeof time === "string" ? time.trim() : "",
      place: place !== "" ? place : null,
      points: points !== "" ? points : "0",
      did_not_run: didNotRun,
      reason: reason.trim(),
    };
    const validationError = validateResult(fields);
    if (validationError) { setErrorMsg(validationError); setStatus("error"); return; }

    const payload = {
      meet_id: meetId,
      athlete_id: athlete.email,
      time: didNotRun ? "" : fields.time,
      place: didNotRun ? null : (fields.place !== null ? Number(fields.place) : null),
      points: Number(fields.points),
      did_not_run: didNotRun,
      reason: didNotRun ? fields.reason : "",
    };

    setSaving(true); setStatus(null); setErrorMsg("");
    try {
      if (existingResult?.id) {
        await base44.entities.MeetResult.update(existingResult.id, payload);
      } else {
        const existing = await base44.entities.MeetResult.filter({ meet_id: meetId, athlete_id: athlete.email });
        if (existing && existing.length > 0) {
          await base44.entities.MeetResult.update(existing[0].id, payload);
        } else {
          await base44.entities.MeetResult.create(payload);
        }
      }
      setStatus("success");
      onSaved();
    } catch {
      setErrorMsg("Failed to save, try again.");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UserRound className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">{getDisplayName(athlete)}</span>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={didNotRun}
          onChange={(e) => { setDidNotRun(e.target.checked); setStatus(null); setErrorMsg(""); }}
          className="w-4 h-4 accent-primary"
        />
        <span className="text-sm text-muted-foreground">Did not run</span>
      </label>

      {didNotRun ? (
        <div className="space-y-1">
          <Label className="text-xs">Reason <span className="text-destructive">*</span></Label>
          <Input
            placeholder="e.g. Injury, illness..."
            value={reason}
            onChange={(e) => { setReason(e.target.value); setStatus(null); setErrorMsg(""); }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Time</Label>
            <Input placeholder="e.g. 18:32" value={time} onChange={(e) => { setTime(e.target.value); setStatus(null); setErrorMsg(""); }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Place</Label>
            <Input type="number" min="1" placeholder="—" value={place} onChange={(e) => { setPlace(e.target.value); setStatus(null); setErrorMsg(""); }} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Points</Label>
            <Input type="number" min="0" placeholder="0" value={points} onChange={(e) => { setPoints(e.target.value); setStatus(null); setErrorMsg(""); }} />
          </div>
        </div>
      )}

      {status === "success" && (
        <p className="flex items-center gap-1.5 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully</p>
      )}
      {status === "error" && (
        <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="w-3.5 h-3.5" /> {errorMsg}</p>
      )}

      <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving...</> : existingResult ? "Update Result" : "Save Result"}
      </Button>
    </div>
  );
}

// ─── Section block (Varsity Boys / JV Boys / etc.) ────────────────────────────

function ResultSection({ section, athletes, results, meetId, meet, onSaved }) {
  const teamPlace = meet[section.placeField];

  if (athletes.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide">{section.label}</p>
          {teamPlace != null && (
            <span className="flex items-center gap-1 text-xs font-semibold text-accent">
              <Medal className="w-3 h-3" /> Team Place: {ordinal(teamPlace)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground py-2 text-center">
          No {section.label.toLowerCase()} results yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          {section.label}
          <span className="text-muted-foreground font-normal ml-1">({athletes.length})</span>
        </p>
        {teamPlace != null && (
          <span className="flex items-center gap-1 text-xs font-semibold text-accent">
            <Medal className="w-3 h-3" /> Team Place: {ordinal(teamPlace)}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {athletes.map((athlete) => {
          const existing = results.find((r) => r.athlete_id === athlete.email) || null;
          return (
            <AthleteResultRow
              key={athlete.email}
              meetId={meetId}
              athlete={athlete}
              existingResult={existing}
              onSaved={onSaved}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MeetResultsPanel({ meet, athletes }) {
  const [results, setResults] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("boys");

  const fetchResults = useCallback(async () => {
    setError(false);
    try {
      const [data, lineupData] = await Promise.all([
        base44.entities.MeetResult.filter({ meet_id: meet.id }),
        base44.entities.MeetLineup.filter({ meet_id: meet.id }),
      ]);
      setResults(data || []);
      setLineup(lineupData || []);
    } catch {
      setResults([]);
      setLineup([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [meet.id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive text-center py-4">Unable to load results.</p>;
  }

  if (!athletes || athletes.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">No athletes on this team yet.</p>;
  }

  // Build assignment map: email -> section key
  const assignmentMap = {};
  (lineup || []).forEach((r) => { assignmentMap[r.athlete_id] = r.team_group; });

  const hasLineup = lineup.length > 0;

  // Bucket athletes into sections (deduped)
  const seen = new Set();
  const sectionAthletes = { varsity_boys: [], jv_boys: [], varsity_girls: [], jv_girls: [], unassigned: [] };
  athletes.forEach((athlete) => {
    if (seen.has(athlete.email)) return;
    seen.add(athlete.email);
    const group = assignmentMap[athlete.email];
    if (group && sectionAthletes[group] !== undefined) {
      sectionAthletes[group].push(athlete);
    } else {
      sectionAthletes.unassigned.push(athlete);
    }
  });

  const sections = GENDER_SECTIONS[activeTab];

  return (
    <div className="space-y-4 pt-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enter Results</p>

      {!hasLineup && (
        <div className="rounded-lg bg-muted/50 border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          No lineup saved — athletes may appear unassigned. Save a lineup first to organize by section.
        </div>
      )}

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

      {/* Sections within active tab */}
      <div className="space-y-5">
        {sections.map((section, i) => (
          <div key={section.key}>
            {i > 0 && <div className="border-t border-border mb-5" />}
            <ResultSection
              section={section}
              athletes={sectionAthletes[section.key] || []}
              results={results}
              meetId={meet.id}
              meet={meet}
              onSaved={fetchResults}
            />
          </div>
        ))}

        {/* Unassigned athletes — shown whenever any athlete has no lineup assignment */}
        {sectionAthletes.unassigned.length > 0 && (
          <div>
            <div className="border-t border-border mb-5" />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Unassigned <span className="font-normal">({sectionAthletes.unassigned.length})</span>
              </p>
              {sectionAthletes.unassigned.map((athlete) => {
                const existing = results.find((r) => r.athlete_id === athlete.email) || null;
                return (
                  <AthleteResultRow
                    key={athlete.email}
                    meetId={meet.id}
                    athlete={athlete}
                    existingResult={existing}
                    onSaved={fetchResults}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}