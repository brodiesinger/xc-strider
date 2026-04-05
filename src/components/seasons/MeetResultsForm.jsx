import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";

function validateResult(fields) {
  if (fields.did_not_run) {
    if (!fields.reason.trim()) return "Reason is required when athlete did not run.";
    return null;
  }
  if (fields.time.trim() === "") return "Time is required.";
  if (fields.place !== "" && (isNaN(Number(fields.place)) || Number(fields.place) <= 0)) {
    return "Place must be a positive number.";
  }
  if (fields.points !== "" && (isNaN(Number(fields.points)) || Number(fields.points) < 0)) {
    return "Points must be 0 or greater.";
  }
  return null;
}

export default function MeetResultsForm({ meetId, athlete, existingResult, onSaved }) {
  const [fields, setFields] = useState({
    time: "",
    place: "",
    points: "",
    did_not_run: false,
    reason: "",
  });

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | null
  const [statusMsg, setStatusMsg] = useState("");
  const [validationError, setValidationError] = useState("");

  // Populate form if existing result loaded
  useEffect(() => {
    if (existingResult) {
      setFields({
        time: existingResult.time || "",
        place: existingResult.place != null ? String(existingResult.place) : "",
        points: existingResult.points != null ? String(existingResult.points) : "",
        did_not_run: existingResult.did_not_run || false,
        reason: existingResult.reason || "",
      });
    }
  }, [existingResult]);

  const set = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setValidationError("");
    setStatus(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    const err = validateResult(fields);
    if (err) { setValidationError(err); return; }

    const payload = {
      meet_id: meetId,
      athlete_id: athlete.email,
      athlete_name: getDisplayName(athlete),
      time: fields.did_not_run ? "" : fields.time.trim(),
      place: fields.did_not_run ? null : (fields.place !== "" ? Number(fields.place) : null),
      points: fields.did_not_run ? 0 : (fields.points !== "" ? Number(fields.points) : 0),
      did_not_run: fields.did_not_run,
      reason: fields.did_not_run ? fields.reason.trim() : "",
    };

    setSaving(true);
    setStatus(null);
    setStatusMsg("");

    try {
      if (existingResult?.id) {
        console.log("[MeetResults] Updating result", existingResult.id, payload);
        await base44.entities.MeetResult.update(existingResult.id, payload);
      } else {
        console.log("[MeetResults] Saving new result", payload);
        await base44.entities.MeetResult.create(payload);
      }
      setStatus("success");
      setStatusMsg("Saved!");
      if (onSaved) onSaved();
    } catch (err) {
      console.error("[MeetResults] Failed to save result:", err);
      setStatus("error");
      setStatusMsg("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-3 py-2 px-1">
      {/* DNR toggle */}
      <div className="flex items-center gap-2">
        <input
          id={`dnr-${athlete.email}`}
          type="checkbox"
          checked={fields.did_not_run}
          onChange={(e) => set("did_not_run", e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <Label htmlFor={`dnr-${athlete.email}`} className="text-sm cursor-pointer">
          Did not run
        </Label>
      </div>

      {fields.did_not_run ? (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Reason *</Label>
          <Input
            placeholder="e.g. Injury, illness, etc."
            value={fields.reason}
            onChange={(e) => set("reason", e.target.value)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Time *</Label>
            <Input
              placeholder="18:34"
              value={fields.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Place</Label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={fields.place}
              onChange={(e) => set("place", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Points</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={fields.points}
              onChange={(e) => set("points", e.target.value)}
            />
          </div>
        </div>
      )}

      {validationError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {validationError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving} className="flex items-center gap-1.5">
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          {saving ? "Saving..." : existingResult ? "Update Result" : "Save Result"}
        </Button>
        {status === "success" && (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {statusMsg}
          </span>
        )}
        {status === "error" && (
          <span className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {statusMsg}
          </span>
        )}
      </div>
    </form>
  );
}