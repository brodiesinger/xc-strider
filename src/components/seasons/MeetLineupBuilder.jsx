import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle2, AlertCircle, UserRound } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";

const GROUPS = [
  { key: "varsity_boys", label: "Varsity Boys", gender: "boys" },
  { key: "jv_boys",      label: "JV Boys",      gender: "boys" },
  { key: "varsity_girls", label: "Varsity Girls", gender: "girls" },
  { key: "jv_girls",     label: "JV Girls",     gender: "girls" },
];

function AthleteChip({ athlete, groupKey, assignment, onAssign }) {
  const isAssigned = assignment === groupKey;
  // Assigned to a different group in the same gender section
  const isAssignedElsewhere = assignment && assignment !== groupKey;
  return (
    <button
      onClick={() => onAssign(athlete.email, isAssigned ? null : groupKey)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
        isAssigned
          ? "bg-primary text-primary-foreground border-primary"
          : isAssignedElsewhere
          ? "bg-muted border-border text-muted-foreground opacity-50"
          : "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
      }`}
      title={isAssignedElsewhere ? `Already assigned to ${assignment.replace("_", " ")}` : ""}
    >
      <UserRound className="w-3.5 h-3.5 shrink-0" />
      {getDisplayName(athlete)}
    </button>
  );
}

export default function MeetLineupBuilder({ meet, athletes, onClose }) {
  // assignments: { [athlete_email]: groupKey | null }
  const [assignments, setAssignments] = useState({});
  // lineupRecords: { [athlete_email]: { id, team_group } }
  const [lineupRecords, setLineupRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "success" | "error"

  // Strict gender split — only include athletes explicitly tagged, plus untagged shown in both
  const boyAthletes = (athletes || []).filter((a) => a.team_group === "boys" || !a.team_group);
  const girlAthletes = (athletes || []).filter((a) => a.team_group === "girls" || !a.team_group);

  const loadLineup = useCallback(async () => {
    console.log("[MeetLineupBuilder] Loading lineup for meet:", meet.id);
    setLoading(true);
    try {
      const records = await base44.entities.MeetLineup.filter({ meet_id: meet.id });
      const assignMap = {};
      const recordMap = {};
      (records || []).forEach((r) => {
        assignMap[r.athlete_id] = r.team_group;
        recordMap[r.athlete_id] = { id: r.id, team_group: r.team_group };
      });
      setAssignments(assignMap);
      setLineupRecords(recordMap);
      console.log("[MeetLineupBuilder] Loaded", (records || []).length, "lineup entries");
    } catch (err) {
      console.error("[MeetLineupBuilder] Failed to load lineup:", err);
    } finally {
      setLoading(false);
    }
  }, [meet.id]);

  useEffect(() => {
    loadLineup();
  }, [loadLineup]);

  const handleAssign = (athleteEmail, groupKey) => {
    setAssignments((prev) => ({ ...prev, [athleteEmail]: groupKey }));
    setSaveStatus(null);
  };

  const handleSave = async () => {
    if (saving) return;
    console.log("[MeetLineupBuilder] Saving lineup for meet:", meet.id);
    setSaving(true);
    setSaveStatus(null);
    try {
      const ops = [];
      for (const athlete of (athletes || [])) {
        const email = athlete.email;
        const newGroup = assignments[email] || null;
        const existing = lineupRecords[email];

        if (newGroup && existing) {
          // Update if group changed
          if (existing.team_group !== newGroup) {
            console.log("[MeetLineupBuilder] Updating", email, "->", newGroup);
            ops.push(base44.entities.MeetLineup.update(existing.id, { team_group: newGroup }));
          }
        } else if (newGroup && !existing) {
          // Create new
          console.log("[MeetLineupBuilder] Creating lineup for", email, "->", newGroup);
          ops.push(base44.entities.MeetLineup.create({
            meet_id: meet.id,
            athlete_id: email,
            team_group: newGroup,
          }));
        } else if (!newGroup && existing) {
          // Remove assignment
          console.log("[MeetLineupBuilder] Removing lineup for", email);
          ops.push(base44.entities.MeetLineup.delete(existing.id));
        }
      }
      await Promise.all(ops);
      // Reload to get fresh record IDs
      await loadLineup();
      setSaveStatus("success");
      console.log("[MeetLineupBuilder] Lineup saved successfully");
    } catch (err) {
      console.error("[MeetLineupBuilder] Failed to save lineup:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = Object.values(assignments).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-base">Meet Lineup</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{meet.meet_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : athletes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No athletes on this team yet.</p>
          ) : (
            <>
              {/* Boys Section */}
              {boyAthletes.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">👦 Boys</p>
                  {[GROUPS[0], GROUPS[1]].map((group) => (
                    <div key={group.key} className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {boyAthletes.map((athlete) => (
                          <AthleteChip
                            key={athlete.email}
                            athlete={athlete}
                            groupKey={group.key}
                            assignment={assignments[athlete.email]}
                            onAssign={handleAssign}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Girls Section */}
              {girlAthletes.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">👩 Girls</p>
                  {[GROUPS[2], GROUPS[3]].map((group) => (
                    <div key={group.key} className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {girlAthletes.map((athlete) => (
                          <AthleteChip
                            key={athlete.email}
                            athlete={athlete}
                            groupKey={group.key}
                            assignment={assignments[athlete.email]}
                            onAssign={handleAssign}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Assignment summary */}
              <div className="rounded-xl bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground">
                {assignedCount} of {athletes.length} athlete{athletes.length !== 1 ? "s" : ""} assigned
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0 space-y-3">
          {saveStatus === "success" && (
            <p className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Lineup saved successfully
            </p>
          )}
          {saveStatus === "error" && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5" /> Failed to save lineup. Please try again.
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || loading} className="flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Saving...</> : "Save Lineup"}
            </Button>
            <Button variant="outline" onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}