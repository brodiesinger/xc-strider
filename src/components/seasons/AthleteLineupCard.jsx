import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const GROUP_LABELS = {
  varsity_boys: "Varsity Boys",
  jv_boys: "JV Boys",
  varsity_girls: "Varsity Girls",
  jv_girls: "JV Girls",
};

const GROUP_COLORS = {
  varsity_boys: "bg-blue-100 text-blue-700",
  jv_boys: "bg-sky-100 text-sky-700",
  varsity_girls: "bg-pink-100 text-pink-700",
  jv_girls: "bg-rose-100 text-rose-700",
};

// inline=true: renders just a compact badge (used inside the meet header row)
export default function AthleteLineupCard({ meet, athleteEmail, inline = false }) {
  const [assignment, setAssignment] = useState(undefined); // undefined=loading, null=not assigned, string=group key

  useEffect(() => {
    if (!meet?.id || !athleteEmail) return;
    base44.entities.MeetLineup.filter({ meet_id: meet.id, athlete_id: athleteEmail })
      .then((records) => {
        setAssignment(records && records.length > 0 ? records[0].team_group : null);
      })
      .catch(() => {
        setAssignment(null);
      });
  }, [meet?.id, athleteEmail]);

  // Still loading — render nothing
  if (assignment === undefined) return null;

  if (inline) {
    if (!assignment) {
      return (
        <span className="text-[10px] text-muted-foreground italic">Lineup not posted</span>
      );
    }
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${GROUP_COLORS[assignment] || "bg-muted text-muted-foreground"}`}>
        {GROUP_LABELS[assignment] || assignment}
      </span>
    );
  }

  // Full card mode (not currently used but kept for future use)
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 flex items-center justify-between gap-3 mt-1">
      <span className="text-xs font-medium text-foreground">Your lineup</span>
      {assignment ? (
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${GROUP_COLORS[assignment] || "bg-muted text-muted-foreground"}`}>
          {GROUP_LABELS[assignment] || assignment}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground italic">Not posted yet</span>
      )}
    </div>
  );
}