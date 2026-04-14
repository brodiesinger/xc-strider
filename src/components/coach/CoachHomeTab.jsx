import React, { useState } from "react";
import { Users, Activity, Megaphone, ShieldAlert, ChevronRight, CalendarDays, Calendar, Package } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import { format, startOfWeek } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import RosterDrawer from "./RosterDrawer";
import PostAnnouncement from "./PostAnnouncement";
import AnnouncementFeed from "@/components/shared/AnnouncementFeed";
import WeeklyScheduleManager from "./WeeklyScheduleManager";
import TeamAlerts from "./TeamAlerts";
import TeamGroupFilter from "@/components/shared/TeamGroupFilter";
import NextMeetCountdown from "@/components/shared/NextMeetCountdown";
import MeetLineupBuilder from "@/components/seasons/MeetLineupBuilder";

import DashboardHighlight from "@/components/shared/DashboardHighlight";
import FeatureGate from "@/components/shared/FeatureGate";
import { planHasFeature } from "@/lib/billing";
import { Lock } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-1 rounded-2xl border border-border bg-card p-4 flex flex-col gap-1 hover:shadow-md transition-shadow">
      <Icon className="w-5 h-5 text-primary mb-1" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

function QuickActionBtn({ icon: Icon, label, onClick, color = "bg-primary/10 text-primary" }) {
  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
      whileTap={{ y: 0, scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors shadow-sm"
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
  team = null,
  athletes = [],
  announcements = [],
  schedule = [],
  workouts = [],
  checkins = {},
  onAnnouncementPosted,
  onScheduleRefresh,
  onSelectAthlete,
  onOpenInsights,
  onTabChange,
}) {
  const [rosterOpen, setRosterOpen] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [teamGroupFilter, setTeamGroupFilter] = useState("all");
  const [lineupMeet, setLineupMeet] = useState(null);

  // Filter athletes by team_group
  const filteredAthletes = teamGroupFilter === "all"
    ? athletes
    : athletes.filter((a) => a.team_group === teamGroupFilter);

  // Weekly mileage across filtered athletes
  const thisWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const nextWeekStart = format(new Date(startOfWeek(new Date(), { weekStartsOn: 1 }).getTime() + 7 * 86400000), "yyyy-MM-dd");
  const weekMiles = workouts
    .filter((w) => w.date && w.date >= thisWeekStart && w.date < nextWeekStart && filteredAthletes.some((a) => a.email === w.athlete_email))
    .reduce((s, w) => s + (w.distance || 0), 0);

  const recentWorkouts = [...workouts].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 3);

  const getAthleteName = (workout) => {
    const athlete = athletes.find((a) => a.email === workout.athlete_email);
    if (athlete) return getDisplayName(athlete);
    return workout.athlete_name || "Athlete";
  };

  return (
    <div className="space-y-6 pb-24 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <p className="text-sm text-muted-foreground">Good to see you,</p>
        <h1 className="text-2xl font-bold text-foreground leading-tight mt-0.5">{getDisplayName(user)} 👋</h1>
        {team && <p className="text-sm text-primary font-medium mt-1">{team.name}</p>}
      </motion.div>



      {/* Team Alerts */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <TeamAlerts
          athletes={athletes}
          workouts={workouts}
          checkins={checkins}
          schedule={schedule}
          onAthleteClick={onSelectAthlete}
        />
      </motion.div>

      {/* Team Group Filter */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Filter</p>
        <TeamGroupFilter value={teamGroupFilter} onChange={setTeamGroupFilter} />
      </motion.div>

      {/* Next Meet Countdown - Highlighted */}
      {team?.id && planHasFeature(team, "meet_results") && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <DashboardHighlight 
            title="Upcoming Meet"
            description="Set lineups and track results"
          >
            <NextMeetCountdown
              teamId={team.id}
              isCoach={true}
              athletes={athletes}
              onOpenLineup={(meet) => setLineupMeet(meet)}
            />
          </DashboardHighlight>
        </motion.div>
      )}

      {/* Lineup Builder Modal */}
      {lineupMeet && (
        <MeetLineupBuilder
          meet={lineupMeet}
          athletes={athletes}
          onClose={() => setLineupMeet(null)}
        />
      )}

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Athletes" value={filteredAthletes.length} />
        <StatCard icon={Activity} label="Team Miles" value={`${weekMiles.toFixed(1)}`} sub="this week" />
      </motion.div>

      {/* Quick Actions */}
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          <QuickActionBtn
            icon={Calendar}
            label="Meets"
            onClick={() => onTabChange("seasons")}
          />
          <QuickActionBtn
            icon={Users}
            label="Roster"
            onClick={() => setRosterOpen(true)}
          />
          {planHasFeature(team, "packet_builder") ? (
            <QuickActionBtn
              icon={Package}
              label="Packet"
              onClick={() => window.location.href = "/packet"}
            />
          ) : (
            <QuickActionBtn
              icon={Lock}
              label="Packet"
              onClick={() => window.location.href = "/pricing"}
              color="bg-muted text-muted-foreground"
            />
          )}
          <QuickActionBtn
            icon={Megaphone}
            label="Announce"
            onClick={() => setShowAnnouncement((v) => !v)}
            color="bg-accent/20 text-accent"
          />
          <QuickActionBtn
            icon={ShieldAlert}
            label="Alerts"
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
      </motion.section>

      {/* Post Announcement (collapsible) */}
      <AnimatePresence>
        {showAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
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
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-6 text-center">No recent activity yet. Athletes will log workouts here.</p>
          ) : (
            recentWorkouts.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{getAthleteName(w)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{w.date} · {w.distance} mi</p>
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0 ml-3">
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
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Announcements</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <AnnouncementFeed announcements={announcements} />
        </div>
      </section>

      {/* Roster Drawer */}
      <RosterDrawer
        athletes={filteredAthletes}
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        onSelectAthlete={onSelectAthlete}
      />
    </div>
  );
}