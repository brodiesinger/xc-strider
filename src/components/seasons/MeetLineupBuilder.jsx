import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { motion, AnimatePresence } from "framer-motion";

// Group keys — unchanged, used by MeetResults, Packet, AthleteLineupCard
const GROUP_KEY = {
  boys:  { varsity: "varsity_boys",  jv: "jv_boys"  },
  girls: { varsity: "varsity_girls", jv: "jv_girls" },
};

function AthleteRow({ athlete, activeKey, oppositeKey, assignments, onToggle }) {
  const email = athlete.email;
  const current = assignments[email];
  const isSelected = current === activeKey;
  const isBlocked  = current === oppositeKey;
  const oppositeLabel = oppositeKey?.startsWith("varsity") ? "Varsity" : "JV";

  return (
    <button
      onClick={() => !isBlocked && onToggle(email)}
      disabled={isBlocked}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left
        ${isSelected
          ? "bg-primary/10 border-primary/40"
          : isBlocked
          ? "bg-muted/40 border-border opacity-50 cursor-not-allowed"
          : "bg-card border-border hover:border-primary/30 hover:bg-primary/5"
        }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
          ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {getDisplayName(athlete)[0]?.toUpperCase() || "?"}
        </div>
        <span className={`text-sm font-medium truncate ${isBlocked ? "text-muted-foreground" : "text-foreground"}`}>
          {getDisplayName(athlete)}
        </span>
        {isBlocked && (
          <span className="text-[10px] text-muted-foreground shrink-0">· Assigned to {oppositeLabel}</span>
        )}
      </div>
      {isSelected && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-2">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

export default function MeetLineupBuilder({ meet, athletes, onClose }) {
  const [assignments, setAssignments]     = useState({});
  const [lineupRecords, setLineupRecords] = useState({});
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [saveStatus, setSaveStatus]       = useState(null); // "success" | "error" | "load_error"
  const [gender, setGender]               = useState("boys");
  const [level, setLevel]                 = useState("varsity");

  // Reset level to varsity when switching gender
  const handleGenderChange = (g) => { setGender(g); setLevel("varsity"); };

  const boyAthletes  = (athletes || []).filter(a => a.team_group === "boys"  || !a.team_group);
  const girlAthletes = (athletes || []).filter(a => a.team_group === "girls" || !a.team_group);
  const rosterForGender = gender === "boys" ? boyAthletes : girlAthletes;

  const activeKey   = GROUP_KEY[gender][level];
  const oppositeKey = GROUP_KEY[gender][level === "varsity" ? "jv" : "varsity"];

  // Sort: selected first, then blocked, then unassigned
  const sortedRoster = [...rosterForGender].sort((a, b) => {
    const aSelected = assignments[a.email] === activeKey;
    const bSelected = assignments[b.email] === activeKey;
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

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

  const handleToggle = (email) => {
    setSaveStatus(null);
    setAssignments(prev => {
      if (prev[email] === activeKey) {
        const next = { ...prev };
        delete next[email];
        return next;
      }
      return { ...prev, [email]: activeKey };
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const ops = [];
      for (const athlete of (athletes || [])) {
        const email    = athlete.email;
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

  const assignedCount   = Object.values(assignments).filter(Boolean).length;
  const activeCount     = rosterForGender.filter(a => assignments[a.email] === activeKey).length;

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

        {/* Top Tabs: Boys / Girls */}
        <div className="px-5 pb-2 shrink-0">
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {[{ id: "boys", label: "👦 Boys" }, { id: "girls", label: "👩 Girls" }].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleGenderChange(tab.id)}
                className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
                  gender === tab.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Second Tabs: Varsity / JV */}
        <div className="px-5 pb-3 shrink-0">
          <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
            {[{ id: "varsity", label: "Varsity" }, { id: "jv", label: "JV" }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLevel(tab.id)}
                className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${
                  level === tab.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {(() => {
                  const cnt = rosterForGender.filter(a => assignments[a.email] === GROUP_KEY[gender][tab.id]).length;
                  return cnt > 0 ? (
                    <span className="ml-1.5 text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                      {cnt}
                    </span>
                  ) : null;
                })()}
              </button>
            ))}
          </div>
        </div>

        {/* Roster Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : saveStatus === "load_error" ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Unable to load roster. Please try again.</p>
            </div>
          ) : rosterForGender.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No {gender === "boys" ? "boys" : "girls"} athletes on this team yet.
            </p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${gender}-${level}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-1.5 py-1"
              >
                {sortedRoster.map(athlete => (
                  <AthleteRow
                    key={athlete.email}
                    athlete={athlete}
                    activeKey={activeKey}
                    oppositeKey={oppositeKey}
                    assignments={assignments}
                    onToggle={handleToggle}
                  />
                ))}
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