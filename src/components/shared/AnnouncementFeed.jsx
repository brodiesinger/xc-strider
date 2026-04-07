import React from "react";
import { format, parseISO } from "date-fns";

export default function AnnouncementFeed({ announcements = [] }) {
  if (announcements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No announcements yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-foreground leading-relaxed">{a.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {a.coach_name || "Coach"} ·{" "}
            {a.created_date ? (() => { try { return format(parseISO(a.created_date), "MMM d, yyyy"); } catch { return ""; } })() : ""}
          </p>
        </div>
      ))}
    </div>
  );
}