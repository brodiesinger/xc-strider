import React from "react";
import PostAnnouncement from "./PostAnnouncement";
import AnnouncementFeed from "@/components/shared/AnnouncementFeed";
import ScheduleManager from "./ScheduleManager";
import { Megaphone } from "lucide-react";

export default function CoachTeamDashboard({ team, user, announcements, schedule, onAnnouncementPosted, onScheduleRefresh }) {
  return (
    <div className="space-y-8">
      {/* Announcements */}
      <section>
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Megaphone className="w-4 h-4 text-primary" />
          Announcements
        </h2>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <PostAnnouncement
            teamId={team.id}
            coachName={user?.full_name || user?.email}
            onPosted={onAnnouncementPosted}
          />
          <AnnouncementFeed announcements={announcements} />
        </div>
      </section>

      {/* Schedule */}
      <ScheduleManager teamId={team.id} schedule={schedule} onRefresh={onScheduleRefresh} />
    </div>
  );
}