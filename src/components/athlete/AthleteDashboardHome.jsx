import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Ruler, TrendingUp, Activity, BarChart2, Lightbulb, Users, Zap, Plus, Trophy, ChevronRight } from "lucide-react";
import { startOfWeek, format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import NotificationBell from "@/components/shared/NotificationBell";
import NextMeetCountdown from "@/components/shared/NextMeetCountdown";
import WorkoutList from "@/components/athlete/WorkoutList";
import AnnouncementCard from "@/components/athlete/AnnouncementCard";
import TodaysWorkoutCard from "@/components/athlete/TodaysWorkoutCard";
import DailyCheckInCard from "@/components/athlete/DailyCheckInCard";
import { base44 } from "@/api/base44Client";
import { getDisplayName } from "@/lib/displayName";

function getWeeklyChartData(workouts, numWeeks = 8) {
  const now = new Date();
  return Array.from({ length: numWeeks }, (_, i) => {
    const weekStart = startOfWeek(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - (numWeeks - 1 - i) * 7),
      { weekStartsOn: 1 }
    );
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(weekEnd, "yyyy-MM-dd");
    const miles = workouts
      .filter((w) => w.date && w.date >= startStr && w.date < endStr)
      .reduce((sum, w) => sum + (w.distance || 0), 0);
    return { week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`, miles: parseFloat(miles.toFixed(1)) };
  });
}

export default function AthleteDashboardHome({ user, team, workouts = [], announcements = [], schedule = [], streak = 0, earnedBadgeIds = [], onLogWorkout, onNavigate }) {
  const [dismissedAnnouncements, setDismissedAnnouncements] = React.useState([]);
  const [loadingDismissals, setLoadingDismissals] = React.useState(true);
  const [todayCheckIn, setTodayCheckIn] = React.useState(null);
  const [checkInLoading, setCheckInLoading] = React.useState(true);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = React.useState(false);

  // Load dismissed announcements and today's check-in on mount
  React.useEffect(() => {
    if (!user?.email) return;
    const loadData = async () => {
      try {
        const [dismissed, checkIns] = await Promise.all([
          base44.entities.DismissedAnnouncement.filter(
            { user_email: user.email },
            "-created_date",
            100
          ).catch(() => []),
          base44.entities.DailyCheckin.filter(
            { athlete_email: user.email, date: format(new Date(), "yyyy-MM-dd") }
          ).catch(() => []),
        ]);
        setDismissedAnnouncements(dismissed.map((d) => d.announcement_id));
        setTodayCheckIn(checkIns.length > 0 ? checkIns[0] : null);
      } catch {
        // Continue if entity doesn't exist yet
      } finally {
        setCheckInLoading(false);
        setLoadingDismissals(false);
      }
    };
    loadData();
  }, [user?.email]);

  // Handle announcement dismissal
  const handleDismissAnnouncement = async (announcementId) => {
    if (!user?.email) return;
    try {
      await base44.entities.DismissedAnnouncement.create({
        user_email: user.email,
        announcement_id: announcementId,
      });
      setDismissedAnnouncements((prev) => [...prev, announcementId]);
    } catch (err) {
      console.error("Failed to dismiss announcement:", err);
    }
  };

  // Handle daily check-in submission
  const handleCheckInSubmit = async (data) => {
    if (!user?.email) return;
    setIsSubmittingCheckIn(true);
    try {
      await base44.entities.DailyCheckin.create({
        athlete_email: user.email,
        date: format(new Date(), "yyyy-MM-dd"),
        soreness: data.soreness,
        energy: data.energy,
        pain: data.pain,
      });
      setTodayCheckIn({ id: "temp" }); // Mark as submitted
    } catch (err) {
      console.error("Failed to submit check-in:", err);
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // Filter announcements: show only non-dismissed, sorted by newest first
  const activeAnnouncements = announcements
    .filter((a) => !dismissedAnnouncements.includes(a.id))
    .sort((a, b) => (b.created_date || "").localeCompare(a.created_date || ""));
  const thisWeek = useMemo(() => {
    const startStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    return workouts.filter((w) => w.date && w.date >= startStr).reduce((s, w) => s + (w.distance || 0), 0);
  }, [workouts]);

  const total = useMemo(() => workouts.reduce((s, w) => s + (w.distance || 0), 0), [workouts]);

  const avgWeekly = useMemo(() => {
    const data = getWeeklyChartData(workouts);
    const withMiles = data.filter((d) => d.miles > 0);
    return withMiles.length ? withMiles.reduce((s, d) => s + d.miles, 0) / withMiles.length : 0;
  }, [workouts]);

  const chartData = useMemo(() => getWeeklyChartData(workouts), [workouts]);

  const recentWorkouts = useMemo(() =>
    [...workouts].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5),
  [workouts]);

  // Get today's workout
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayWorkout = schedule.find((s) => s.date === todayStr);

  // isLoading guards sections that depend on both fetch results
  const isDataLoading = loadingDismissals || checkInLoading;

  if (!user) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Unable to load dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-3 pt-2"
      >
        <div>
          <p className="text-sm text-muted-foreground">Good to see you,</p>
          <h1 className="text-2xl font-bold text-foreground">
            {getDisplayName(user)} 👋
          </h1>
          {team && <p className="text-sm text-primary font-medium mt-0.5">{team.name}</p>}
        </div>
        {user && <NotificationBell userEmail={user.email} />}
      </motion.div>

      {/* Streak + Leaderboard Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        {/* Streak pill */}
        {streak > 0 ? (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl flex-1"
            style={{ background: "linear-gradient(135deg,#dc2626,#ea580c)" }}
          >
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{streak} Day Streak</p>
              <p className="text-white/70 text-[10px]">Keep it going!</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 border border-dashed border-border rounded-2xl px-4 py-2.5 bg-muted/40 flex-1">
            <span className="text-xl">🔥</span>
            <p className="text-xs text-muted-foreground">Log a workout to start your streak!</p>
          </div>
        )}
        {/* Leaderboard shortcut */}
        <button
          onClick={() => onNavigate("leaderboard")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
        >
          <Trophy className="w-4 h-4 text-primary shrink-0" />
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground leading-tight">Leaderboard</p>
            <p className="text-[10px] text-muted-foreground">View ranking →</p>
          </div>
        </button>
      </motion.div>

      {/* Announcements */}
      {!loadingDismissals && activeAnnouncements.length > 0 && (
        <AnimatePresence>
          <div className="space-y-2">
            {activeAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onDismiss={handleDismissAnnouncement}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Next Meet Countdown */}
      {team?.id && <NextMeetCountdown teamId={team.id} />}

      {/* Today's Workout */}
      <TodaysWorkoutCard schedule={todayWorkout} />

      {/* Daily Check-In */}
      {!checkInLoading && !todayCheckIn && (
        <DailyCheckInCard
          onSubmit={handleCheckInSubmit}
          isLoading={isSubmittingCheckIn}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { Icon: Ruler, label: "This Week", value: `${thisWeek.toFixed(1)}`, unit: "mi" },
          { Icon: Activity, label: "Avg / Week", value: `${avgWeekly.toFixed(1)}`, unit: "mi" },
          { Icon: TrendingUp, label: "Total", value: `${total.toFixed(1)}`, unit: "mi" },
        ].map(({ Icon, label, value, unit }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/90 p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-1">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-foreground leading-tight">
              {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Log Workout CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogWorkout}
        className="w-full rounded-2xl bg-primary text-primary-foreground p-5 flex items-center gap-4 shadow-md transition-transform"
      >
        <div className="w-12 h-12 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
          <Plus className="w-6 h-6" />
        </div>
        <div className="text-left">
          <p className="font-bold text-lg leading-tight">Log Workout</p>
          <p className="text-sm text-primary-foreground/70">Tap to record today's run</p>
        </div>
      </motion.button>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { Icon: BarChart2, label: "Performance", color: "bg-blue-100 text-blue-600", action: () => onNavigate("performance") },
            { Icon: Users, label: "Team", color: "bg-accent/15 text-accent", action: () => onNavigate("profile") },
            { Icon: Zap, label: "Recovery", color: "bg-orange-100 text-orange-500", action: () => onNavigate("insights") },
          ].map(({ Icon, label, color, action }) => (
            <motion.button
              key={label}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={action}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors"
            >
              <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight">{label}</span>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-5"
      >
        <p className="text-sm font-semibold text-foreground mb-4">Weekly Mileage</p>
         <ResponsiveContainer width="100%" height={150}>
           <BarChart data={chartData} barSize={22}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
             <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
             <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
             <Tooltip
               formatter={(v) => [`${v} mi`, "Miles"]}
               contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: 12 }}
             />
             <Bar dataKey="miles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
           </BarChart>
         </ResponsiveContainer>
         </motion.div>

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</h2>
          <WorkoutList workouts={recentWorkouts} />
        </section>
      )}
    </div>
  );
}