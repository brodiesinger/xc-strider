import React, { useMemo } from "react";
import {
  Users, Activity, AlertTriangle, Megaphone, Plus, Calendar, ChevronRight, TrendingUp
} from "lucide-react";
import { format, subDays, isAfter, parseISO } from "date-fns";
import PostAnnouncement from "./PostAnnouncement";
import AnnouncementFeed from "@/components/shared/AnnouncementFeed";
import WeeklyScheduleManager from "./WeeklyScheduleManager";

function StatCard({ icon: Icon, label, value, sub, color = "text-primary" }) {
  return (
    <div className="flex-1 rounded-2xl bg-card border border-border p-4 flex flex-col gap-1.5">
      <div className={`w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function CoachHomeTab({
  user, team, athletes, announcements, schedule,
  onViewRoster, onOpenAnnouncement, onAnnouncementPosted, onScheduleRefresh,
  workoutsThisWeek = 0, weeklyMiles = 0, injuryAlerts = 0,
}) {
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return schedule
      .filter((s) => {
        try { return isAfter(parseISO(s.date), subDays(today, 1)); } catch { return false; }
      })
      .slice(0, 3);
  }, [schedule]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hey, {user?.full_name?.split(" ")[0] || "Coach"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{team?.name}</p>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3">
        <StatCard icon={Users} label="Athletes" value={athletes.length} />
        <StatCard icon={TrendingUp} label="Mi this week" value={weeklyMiles.toFixed(1)} />
        {injuryAlerts > 0 && (
          <StatCard icon={AlertTriangle} label="Alerts" value={injuryAlerts} color="text-destructive" />
        )}
      </div>

      {/* Roster Card */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Team Roster
          </h2>
          <button
            onClick={onViewRoster}
            className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No athletes yet. Share your join code!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {athletes.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1"
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary">
                    {(a.full_name || a.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs font-medium text-foreground truncate max-w-[80px]">
                  {a.full_name?.split(" ")[0] || a.email.split("@")[0]}
                </span>
              </div>
            ))}
            {athletes.length > 6 && (
              <div className="flex items-center bg-muted rounded-full px-3 py-1">
                <span className="text-xs text-muted-foreground">+{athletes.length - 6} more</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Post Announcement", icon: Megaphone, onClick: onOpenAnnouncement },
            { label: "View Roster", icon: Users, onClick: onViewRoster },
            { label: "Schedule Practice", icon: Calendar, onClick: null },
            { label: "Team Activity", icon: Activity, onClick: null },
          ].map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="rounded-2xl border border-border bg-card p-4 flex flex-col items-start gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Schedule */}
      {upcomingEvents.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Upcoming
          </h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary leading-none">
                    {format(parseISO(event.date), "MMM").toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-primary leading-tight">
                    {format(parseISO(event.date), "d")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  {event.time && <p className="text-xs text-muted-foreground">{event.time}</p>}
                  {event.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      <div className="rounded-2xl bg-card border border-border p-5">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          Announcements
        </h2>
        <PostAnnouncement
          teamId={team.id}
          coachName={user?.full_name || user?.email}
          onPosted={onAnnouncementPosted}
        />
        <div className="mt-4">
          <AnnouncementFeed announcements={announcements} />
        </div>
      </div>

      {/* Schedule Manager */}
      <WeeklyScheduleManager
        teamId={team.id}
        schedule={schedule}
        onRefresh={onScheduleRefresh}
      />
    </div>
  );
}