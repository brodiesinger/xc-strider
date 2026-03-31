import React, { useState } from "react";
import { Users, Activity, Megaphone, ShieldAlert, ChevronRight, CalendarDays } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { format, startOfWeek } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import RosterDrawer from "./RosterDrawer";
import PostAnnouncement from "./PostAnnouncement";
import AnnouncementFeed from "@/components/shared/AnnouncementFeed";
import WeeklyScheduleManager from "./WeeklyScheduleManager";
import TeamAlerts from "./TeamAlerts";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-card p-4 flex flex-col gap-1">
      <Icon className="w-5 h-5 text-primary mb-1" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function QuickActionBtn({ icon: Icon, label, onClick, color = "bg-primary/10 text-primary" }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors"
    >
      <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium text-foreground text-center leading-tight">{label}</span>
    </motion.button>
  );
}

export default function CoachHomeTab({
  user,
  team,
  athletes = [],
  announcements = [],
  schedule = [],
  workouts = [],
  checkins = {},
  onAnnouncementPosted,
  onScheduleRefresh,
  onSelectAthlete,
  onOpenInsights,
}) {
  const [rosterOpen, setRosterOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  // Weekly mileage across all athletes
  const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const nextWeekStart = format(new Date(startOfWeek(new Date(), { weekStartsOn: 1 }).getTime() + 7 * 86400000), "yyyy-MM-dd");
  const weekMiles = workouts
    .filter((w) => w.date && w.date >= thisWeekStart && w.date < nextWeekStart)
    .reduce((s, w) => s + (w.distance || 0), 0);

  const recentWorkouts = [...workouts].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 3);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="pt-2">
        <p className="text-sm text-muted-foreground">Good to see you,</p>
        <h1 className="text-2xl font-bold text-foreground">{getDisplayName(user)} 👋</h1>
        {team && <p className="text-sm text-primary font-medium mt-0.5">{team.name}</p>}
      </div>

      {/* Team Alerts */}
      <TeamAlerts
        athletes={athletes}
        workouts={workouts}
        checkins={checkins}
        schedule={schedule}
        onAthleteClick={onSelectAthlete}
      />

      {/* Stats Row */}
      <div className="flex gap-3">
        <StatCard icon={Users} label="Athletes" value={athletes.length} />
        <StatCard icon={Activity} label="Team Miles" value={`${weekMiles.toFixed(1)}`} sub="this week" />
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          <QuickActionBtn
            icon={Megaphone}
            label="Announce"
            onClick={() => setShowAnnouncement((v) => !v)}
            color="bg-accent/20 text-accent"
          />
          <QuickActionBtn
            icon={Users}
            label="Roster"
            onClick={() => setRosterOpen(true)}
          />
          <QuickActionBtn
            icon={ShieldAlert}
            label="Injury Alerts"
            onClick={onOpenInsights}
            color="bg-orange-100 text-orange-500"
          />
          <QuickActionBtn
            icon={CalendarDays}
            label="Schedule"
            onClick={() => document.getElementById("schedule-section")?.scrollIntoView({ behavior: "smooth" })}
            color="bg-blue-100 text-blue-500"
          />
        </div>
      </section>

      {/* Post Announcement (collapsible) */}
      <AnimatePresence>
        {showAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" /> Post Announcement
          </h3>
          <PostAnnouncement
            teamId={team.id}
            coachName={getDisplayName(user)}
            onPosted={() => { onAnnouncementPosted(); setShowAnnouncement(false); }}
          />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No workouts logged yet.</p>
          ) : (
            recentWorkouts.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{w.athlete_name || w.athlete_email}</p>
                  <p className="text-xs text-muted-foreground">{w.date} · {w.distance} mi</p>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {w.time_minutes} min
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Schedule Section */}
      {team && (
        <section id="schedule-section">
          <WeeklyScheduleManager teamId={team.id} schedule={schedule} onRefresh={onScheduleRefresh} />
        </section>
      )}

      {/* Announcements Feed */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Announcements</h2>
        <div className="rounded-2xl border border-border bg-card p-5">
          <AnnouncementFeed announcements={announcements} />
        </div>
      </section>

      {/* Roster Drawer */}
      <RosterDrawer
        athletes={athletes}
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        onSelectAthlete={onSelectAthlete}
      />
    </div>
  );
}