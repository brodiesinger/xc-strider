import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { motion, AnimatePresence } from "framer-motion";

// These keys must stay unchanged — used by MeetResults, Packet, and AthleteLineupCard
const VARSITY_KEY = { boys: "varsity_boys", girls: "varsity_girls" };
const JV_KEY      = { boys: "jv_boys",      girls: "jv_girls" };

function AthleteRow({ athlete, section, assignments, onToggle }) {
  const email = athlete.email;
  const currentAssignment = assignments[email];

  // Which key corresponds to this row's section
  const thisKey = section === "varsity"
    ? (currentAssignment?.startsWith("varsity") ? currentAssignment : null)
    : (currentAssignment?.startsWith("jv") ? currentAssignment : null);

  const isSelected = thisKey !== null && thisKey !== undefined && currentAssignment &&
    ((section === "varsity" && currentAssignment.startsWith("varsity")) ||
     (section === "jv" && currentAssignment.startsWith("jv")));

  // Greyed out if assigned to the OTHER section
  const isBlockedByOther = currentAssignment && !isSelected;

  return (
    <motion.button
      layout
      onClick={() => onToggle(email, section)}
      disabled={false}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left
        ${isSelected
          ? "bg-primary/10 border-primary/40 text-foreground"
          : isBlockedByOther
          ? "bg-muted/40 border-border text-muted-foreground opacity-50 cursor-default"
          : "bg-card border-border text-foreground hover:border-primary/30 hover:bg-primary/5"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
          ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {getDisplayName(athlete)[0]?.toUpperCase()}
        </div>
        <span className="text-sm font-medium">{getDisplayName(athlete)}</span>
        {isBlockedByOther && (
          <span className="text-[10px] text-muted-foreground ml-1">
            ({currentAssignment.startsWith("varsity") ? "Varsity" : "JV"})
          </span>
        )}
      </div>
      {isSelected && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </motion.button>
  );
}

function GenderPanel({ genderAthletes, gender, assignments, onToggle }) {
  // Sort: selected first within each section display
  const sortedAthletes = (section) => {
    const key = section === "varsity" ? VARSITY_KEY[gender] : JV_KEY[gender];
    return [...genderAthletes].sort((a, b) => {
      const aSelected = assignments[a.email] === key;
      const bSelected = assignments[b.email] === key;
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });
  };

  const varsityCount = genderAthletes.filter(a => assignments[a.email] === VARSITY_KEY[gender]).length;
  const jvCount = genderAthletes.filter(a => assignments[a.email] === JV_KEY[gender]).length;

  return (
    <div className="space-y-5">
      {/* Varsity Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Varsity</p>
          {varsityCount > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {varsityCount} selected
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {sortedAthletes("varsity").map(athlete => (
            <AthleteRow
              key={athlete.email}
              athlete={athlete}
              section="varsity"
              assignments={assignments}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* JV Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">JV</p>
          {jvCount > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {jvCount} selected
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {sortedAthletes("jv").map(athlete => (
            <AthleteRow
              key={athlete.email}
              athlete={athlete}
              section="jv"
              assignments={assignments}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MeetLineupBuilder({ meet, athletes, onClose }) {
  const [assignments, setAssignments] = useState({});
  const [lineupRecords, setLineupRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "success" | "error"
  const [activeGender, setActiveGender] = useState("boys");

  const boyAthletes  = (athletes || []).filter(a => a.team_group === "boys"  || !a.team_group);
  const girlAthletes = (athletes || []).filter(a => a.team_group === "girls" || !a.team_group);

  const loadLineup = useCallback(async () => {
    setLoading(true);
    try {
      const records = await base44.entities.MeetLineup.filter({ meet_id: meet.id });
      const assignMap = {};
      const recordMap = {};
      (records || []).forEach(r => {
        assignMap[r.athlete_id] = r.team_group;
        recordMap[r.athlete_id] = { id: r.id, team_group: r.team_group };
      });
      setAssignments(assignMap);
      setLineupRecords(recordMap);
    } catch {
      setSaveStatus("load_error");
    } finally {
      setLoading(false);
    }
  }, [meet.id]);

  useEffect(() => { loadLineup(); }, [loadLineup]);

  // Toggle athlete in a section — enforces mutual exclusivity
  const handleToggle = (email, section) => {
    setSaveStatus(null);
    setAssignments(prev => {
      const current = prev[email];
      const targetKey = section === "varsity" ? VARSITY_KEY[activeGender] : JV_KEY[activeGender];
      const alreadyInTarget = current === targetKey;

      if (alreadyInTarget) {
        // Deselect
        const next = { ...prev };
        delete next[email];
        return next;
      }

      // Block if assigned to the other section in this gender
      const otherKey = section === "varsity" ? JV_KEY[activeGender] : VARSITY_KEY[activeGender];
      if (current === otherKey) {
        // Silently block — athlete is in the other section
        return prev;
      }

      return { ...prev, [email]: targetKey };
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const ops = [];
      for (const athlete of (athletes || [])) {
        const email = athlete.email;
        const newGroup = assignments[email] || null;
        const existing = lineupRecords[email];

        if (newGroup && existing) {
          if (existing.team_group !== newGroup)
            ops.push(base44.entities.MeetLineup.update(existing.id, { team_group: newGroup }));
        } else if (newGroup && !existing) {
          ops.push(base44.entities.MeetLineup.create({ meet_id: meet.id, athlete_id: email, team_group: newGroup }));
        } else if (!newGroup && existing) {
          ops.push(base44.entities.MeetLineup.delete(existing.id));
        }
      }
      await Promise.all(ops);
      await loadLineup();
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = Object.values(assignments).filter(Boolean).length;
  const currentAthletes = activeGender === "boys" ? boyAthletes : girlAthletes;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-base">Meet Lineup</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{meet.meet_name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gender Tabs */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {[
              { id: "boys",  label: "👦 Boys" },
              { id: "girls", label: "👩 Girls" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveGender(tab.id)}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
                  activeGender === tab.id
                    ? "bg-card shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : saveStatus === "load_error" ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Unable to load roster. Please try again.</p>
            </div>
          ) : currentAthletes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No {activeGender === "boys" ? "boys" : "girls"} on this team yet.
            </p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeGender}
                initial={{ opacity: 0, x: activeGender === "boys" ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <GenderPanel
                  genderAthletes={currentAthletes}
                  gender={activeGender}
                  assignments={assignments}
                  onToggle={handleToggle}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{assignedCount} of {athletes.length} athlete{athletes.length !== 1 ? "s" : ""} assigned</span>
            {saveStatus === "success" && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Save failed
              </span>
            )}
          </div>
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