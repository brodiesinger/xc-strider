import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, UserRound } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";

const SECTIONS = [
  { key: "varsity_boys", label: "Varsity Boys", emoji: "🏆" },
  { key: "jv_boys",      label: "JV Boys",      emoji: "🔵" },
  { key: "varsity_girls", label: "Varsity Girls", emoji: "🏆" },
  { key: "jv_girls",     label: "JV Girls",     emoji: "🔴" },
];

export default function CoachLineupView({ meet, athletes }) {
  const [lineup, setLineup] = useState(null); // null=loading, []= loaded
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!meet?.id) return;
    base44.entities.MeetLineup.filter({ meet_id: meet.id })
      .then((records) => setLineup(records || []))
      .catch(() => { setError(true); setLineup([]); });
  }, [meet?.id]);

  if (lineup === null) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading lineup...</span>
      </div>
    );
  }

  if (error || lineup.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic py-2">No lineup saved yet.</p>
    );
  }

  // Build a map: email -> athlete
  const athleteMap = {};
  (athletes || []).forEach((a) => { athleteMap[a.email] = a; });

  // Build a map: email -> group key
  const assignmentMap = {};
  lineup.forEach((r) => { assignmentMap[r.athlete_id] = r.team_group; });

  return (
    <div className="space-y-4 pt-1">
      {SECTIONS.map((section) => {
        const sectionAthletes = lineup
          .filter((r) => r.team_group === section.key)
          .map((r) => athleteMap[r.athlete_id])
          .filter(Boolean);

        if (sectionAthletes.length === 0) return null;
        return (
          <div key={section.key}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {section.emoji} {section.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {sectionAthletes.map((athlete) => (
                <div
                  key={athlete.email}
                  className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground"
                >
                  <UserRound className="w-3 h-3 text-muted-foreground shrink-0" />
                  {getDisplayName(athlete)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}