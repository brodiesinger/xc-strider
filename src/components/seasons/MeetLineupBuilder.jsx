import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle2, AlertCircle, Check, Copy } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { deduplicateLineup, validateNoDualAssignment } from "@/lib/lineupValidation";
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
  const [copying, setCopying]             = useState(false);
  const [saveStatus, setSaveStatus]       = useState(null); // "success" | "error" | "load_error"
  const [gender, setGender]               = useState("boys");
  const [level, setLevel]                 = useState("varsity");
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);

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
      const deduped = deduplicateLineup(records || []);
      const assignMap = {};
      const recordMap = {};
      deduped.forEach(r => {
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

  const findPreviousMeetWithLineup = useCallback(async () => {
    try {
      // Get the season for the current meet
      const currentMeet = meet;
      const season = await base44.entities.Season.get(currentMeet.season_id);
      if (!season) return null;

      // Get all meets in the same season, sorted by date descending
      const allMeets = await base44.entities.Meet.filter({ season_id: season.id }, "-meet_date", 100);
      
      // Filter to meets before the current one and in descending date order
      const previousMeets = allMeets
        .filter(m => m.id !== currentMeet.id && m.meet_date && m.meet_date < currentMeet.meet_date)
        .sort((a, b) => (b.meet_date || "").localeCompare(a.meet_date || ""));

      // Find the first one with a lineup
      for (const prevMeet of previousMeets) {
        const lineups = await base44.entities.MeetLineup.filter({ meet_id: prevMeet.id });
        if (lineups && lineups.length > 0) {
          return { meet: prevMeet, lineups };
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [meet]);

  const handleCopyPreviousLineup = async () => {
    setSaveStatus(null);
    const currentLineupCount = Object.keys(assignments).length;
    
    if (currentLineupCount > 0) {
      setShowCopyConfirm(true);
      return;
    }

    await proceedWithCopy();
  };

  const proceedWithCopy = async () => {
    setCopying(true);
    try {
      const prevData = await findPreviousMeetWithLineup();
      if (!prevData) {
        setSaveStatus("no_previous");
        setCopying(false);
        return;
      }

      const { lineups: prevLineups } = prevData;
      const currentRosterEmails = new Set((athletes || []).map(a => a.email));

      // Build new assignments from previous lineup, filtering by current roster
      const newAssignments = {};
      prevLineups.forEach(lineup => {
        if (currentRosterEmails.has(lineup.athlete_id)) {
          newAssignments[lineup.athlete_id] = lineup.team_group;
        }
      });

      // Prepare operations: create/update
      const ops = [];
      const newRecordMap = { ...lineupRecords };

      Object.entries(newAssignments).forEach(([athleteEmail, teamGroup]) => {
        const existing = lineupRecords[athleteEmail];
        if (existing) {
          ops.push(
            base44.entities.MeetLineup.update(existing.id, { team_group: teamGroup })
          );
          newRecordMap[athleteEmail] = { id: existing.id, team_group: teamGroup };
        } else {
          ops.push(
            base44.entities.MeetLineup.create({
              meet_id: meet.id,
              athlete_id: athleteEmail,
              team_group: teamGroup,
            })
          );
          newRecordMap[athleteEmail] = { id: athleteEmail, team_group: teamGroup };
        }
      });

      await Promise.all(ops);
      setAssignments(newAssignments);
      setLineupRecords(newRecordMap);
      setSaveStatus("copy_success");
      setShowCopyConfirm(false);
    } catch {
      setSaveStatus("copy_error");
    } finally {
      setCopying(false);
    }
  };

  useEffect(() => { loadLineup(); }, [loadLineup]);

  const handleToggle = (email) => {
    setSaveStatus(null);
    setAssignments(prev => {
      if (prev[email] === activeKey) {
        const next = { ...prev };
        delete next[email];
        return next;
      }
      // Before assigning to activeKey, remove any other assignment for this athlete
      // to prevent dual JV/Varsity assignments within same gender
      const next = { ...prev, [email]: activeKey };
      
      // Clean up opposite level assignment (only for same gender)
      if (next[email] === activeKey) {
        const oppositeGroup = GROUP_KEY[gender][level === "varsity" ? "jv" : "varsity"];
        if (next[email] === oppositeGroup) {
          delete next[email];
        }
      }
      
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const ops = [];
      
      // Build full assignments including existing records for validation
      const allRecords = await base44.entities.MeetLineup.filter({ meet_id: meet.id });
      const deduped = deduplicateLineup(allRecords || []);
      
      // Validate no dual assignments in final state
      for (const athlete of (athletes || [])) {
        const email = athlete.email;
        const newGroup = assignments[email] || null;
        
        if (newGroup) {
          // Check for dual assignment: validate against ALL other groups for same gender
          const genderGroups = gender === "boys" ? ["varsity_boys", "jv_boys"] : ["varsity_girls", "jv_girls"];
          const otherGroup = genderGroups.find(g => g !== newGroup);
          
          // Remove athlete from opposite level if they're assigned there
          const existingInOther = deduped.find(r => r.athlete_id === email && r.team_group === otherGroup);
          if (existingInOther) {
            ops.push(base44.entities.MeetLineup.delete(existingInOther.id));
          }
        }
      }
      
      // Now proceed with normal CRUD operations
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
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopyPreviousLineup}
              disabled={copying || loading}
              title="Copy previous meet's lineup"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
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

        {/* Copy Confirmation Modal */}
      {showCopyConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm">
            <h3 className="font-semibold text-foreground mb-2">Replace Current Lineup?</h3>
            <p className="text-sm text-muted-foreground mb-4">This will replace the current lineup with the previous meet's lineup.</p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCopyConfirm(false)}
                disabled={copying}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={proceedWithCopy}
                disabled={copying}
              >
                {copying ? "Copying..." : "Replace"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
            {saveStatus === "copy_success" && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Previous lineup copied
              </span>
            )}
            {saveStatus === "no_previous" && (
              <span className="flex items-center gap-1 text-muted-foreground font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> No previous lineup available
              </span>
            )}
            {(saveStatus === "error" || saveStatus === "copy_error") && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {saveStatus === "copy_error" ? "Copy failed" : "Save failed"}
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