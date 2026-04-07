import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Loader2, UserRound } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import TeamGroupFilter from "@/components/shared/TeamGroupFilter";

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

function AthleteResultRow({ meetId, athlete, existingResult, onSaved }) {
  const [time, setTime] = useState(existingResult?.time ?? "");
  const [place, setPlace] = useState(existingResult?.place != null ? String(existingResult.place) : "");
  const [points, setPoints] = useState(existingResult?.points != null ? String(existingResult.points) : "0");
  const [didNotRun, setDidNotRun] = useState(existingResult?.did_not_run ?? false);
  const [reason, setReason] = useState(existingResult?.reason ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  // Sync if external result changes (e.g. on refresh)
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
    if (validationError) {
      setErrorMsg(validationError);
      setStatus("error");
      return;
    }

    const payload = {
      meet_id: meetId,
      athlete_id: athlete.email,
      time: didNotRun ? "" : fields.time,
      place: didNotRun ? null : (fields.place !== null ? Number(fields.place) : null),
      points: Number(fields.points),
      did_not_run: didNotRun,
      reason: didNotRun ? fields.reason : "",
    };

    setSaving(true);
    setStatus(null);
    setErrorMsg("");

    try {
      if (existingResult?.id) {
        console.log("[MeetResults] Updating result for", athlete.email, "meet", meetId);
        await base44.entities.MeetResult.update(existingResult.id, payload);
      } else {
        // Double-check uniqueness before create
        console.log("[MeetResults] Saving result for", athlete.email, "meet", meetId);
        const existing = await base44.entities.MeetResult.filter({ meet_id: meetId, athlete_id: athlete.email });
        if (existing && existing.length > 0) {
          console.log("[MeetResults] Found existing on double-check, updating instead");
          await base44.entities.MeetResult.update(existing[0].id, payload);
        } else {
          await base44.entities.MeetResult.create(payload);
        }
      }
      setStatus("success");
      onSaved();
    } catch (err) {
      console.error("[MeetResults] Error saving result for", athlete.email, err);
      setErrorMsg("Failed to save, try again.");
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
      {/* Athlete name header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UserRound className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">{getDisplayName(athlete)}</span>
      </div>

      {/* DNR toggle */}
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
            <Input
              placeholder="e.g. 18:32"
              value={time}
              onChange={(e) => { setTime(e.target.value); setStatus(null); setErrorMsg(""); }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Place</Label>
            <Input
              type="number"
              min="1"
              placeholder="—"
              value={place}
              onChange={(e) => { setPlace(e.target.value); setStatus(null); setErrorMsg(""); }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Points</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={points}
              onChange={(e) => { setPoints(e.target.value); setStatus(null); setErrorMsg(""); }}
            />
          </div>
        </div>
      )}

      {/* Status feedback */}
      {status === "success" && (
        <p className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle2 className="w-3.5 h-3.5" /> Saved successfully
        </p>
      )}
      {status === "error" && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
        </p>
      )}

      <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving...</>
        ) : existingResult ? "Update Result" : "Save Result"}
      </Button>
    </div>
  );
}

export default function MeetResultsPanel({ meet, athletes }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamGroupFilter, setTeamGroupFilter] = useState("all");

  const fetchResults = useCallback(async () => {
    try {
      const data = await base44.entities.MeetResult.filter({ meet_id: meet.id });
      setResults(data || []);
    } catch (err) {
      console.error("[MeetResults] Failed to load results:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [meet.id]);

  // Filter athletes by team_group
  const filteredAthletes = teamGroupFilter === "all"
    ? athletes
    : athletes.filter((a) => a.team_group === teamGroupFilter);

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

  if (!athletes || athletes.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No athletes on this team yet.
      </p>
    );
  }

  // Organize by team_group — athletes without team_group default to "boys"
  const boys = filteredAthletes.filter((a) => (a.team_group || "boys") === "boys");
  const girls = filteredAthletes.filter((a) => a.team_group === "girls");

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Enter Results</p>
        <TeamGroupFilter value={teamGroupFilter} onChange={setTeamGroupFilter} className="!gap-1" />
      </div>

      {filteredAthletes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No athletes in selected team group.</p>
      ) : (
        <>
          {/* Boys Results */}
          {boys.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 px-1 font-medium">👦 Boys</p>
              <div className="space-y-2">
                {boys.map((athlete) => {
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

          {/* Girls Results */}
          {girls.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 px-1 font-medium">👩 Girls</p>
              <div className="space-y-2">
                {girls.map((athlete) => {
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
        </>
      )}
    </div>
  );
}