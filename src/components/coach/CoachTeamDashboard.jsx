import React, { useState } from "react";
import PostAnnouncement from "./PostAnnouncement";
import AnnouncementFeed from "@/components/shared/AnnouncementFeed";
import ScheduleManager from "./ScheduleManager";
import { Megaphone, Pencil, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";

export default function CoachTeamDashboard({ team, user, announcements, schedule, onAnnouncementPosted, onScheduleRefresh }) {
  const [editing, setEditing] = useState(false);
  const [teamName, setTeamName] = useState(team.name);
  const [saving, setSaving] = useState(false);

  const saveTeamName = async () => {
    if (!teamName.trim() || teamName === team.name) { setEditing(false); return; }
    setSaving(true);
    await base44.entities.Team.update(team.id, { name: teamName.trim() });
    team.name = teamName.trim();
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Team Name */}
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="text-base font-semibold h-8 max-w-xs"
              autoFocus
            />
            <button onClick={saveTeamName} disabled={saving} className="text-primary hover:opacity-70">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setTeamName(team.name); setEditing(false); }} className="text-muted-foreground hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">{teamName}</span>
            <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

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