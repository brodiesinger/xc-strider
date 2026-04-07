import React from "react";
import { format, parseISO } from "date-fns";
import { Megaphone } from "lucide-react";

export default function AnnouncementFeed({ announcements = [] }) {
  if (announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Megaphone className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-foreground">No announcements yet</p>
        <p className="text-xs text-muted-foreground">Check back for team updates.</p>
      </div>
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