import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Flag, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

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

export default function AthleteLineupCard({ meet, athleteEmail }) {
  const [assignment, setAssignment] = useState(undefined); // undefined=loading, null=not assigned, string=group key
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!meet?.id || !athleteEmail) return;
    base44.entities.MeetLineup.filter({ meet_id: meet.id, athlete_id: athleteEmail })
      .then((records) => {
        setAssignment(records && records.length > 0 ? records[0].team_group : null);
      })
      .catch(() => {
        setError(true);
        setAssignment(null);
      });
  }, [meet?.id, athleteEmail]);

  if (error) return null;
  if (assignment === undefined) return null; // loading silently

  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 flex items-center justify-between gap-3 mt-2">
      <div className="flex items-center gap-2 min-w-0">
        <Flag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{meet.meet_name}</p>
          {meet.meet_date && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5" />
              {format(parseISO(meet.meet_date), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {assignment ? (
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${GROUP_COLORS[assignment] || "bg-muted text-muted-foreground"}`}>
            {GROUP_LABELS[assignment] || assignment}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">Lineup not posted yet</span>
        )}
      </div>
    </div>
  );
}