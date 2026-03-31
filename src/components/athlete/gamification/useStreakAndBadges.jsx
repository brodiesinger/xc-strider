import { useMemo } from "react";
import { differenceInCalendarDays, parseISO, format, startOfWeek } from "date-fns";

// All 10 badges athletes can earn
export const ALL_BADGES = [
  { id: "first_run",      emoji: "👟", label: "First Step",       desc: "Log your first workout",         check: (w) => w.length >= 1 },
  { id: "miles_20",       emoji: "🏃", label: "20 Mile Club",     desc: "Run 20 total miles",              check: (w) => w.reduce((s,x) => s+(x.distance||0),0) >= 20 },
  { id: "miles_50",       emoji: "⭐", label: "50 Mile Mark",     desc: "Run 50 total miles",              check: (w) => w.reduce((s,x) => s+(x.distance||0),0) >= 50 },
  { id: "miles_100",      emoji: "💯", label: "Century Runner",   desc: "Run 100 total miles",             check: (w) => w.reduce((s,x) => s+(x.distance||0),0) >= 100 },
  { id: "miles_500",      emoji: "🦅", label: "500 Mile Eagle",   desc: "Run 500 total miles",             check: (w) => w.reduce((s,x) => s+(x.distance||0),0) >= 500 },
  { id: "miles_1000",     emoji: "🌟", label: "1000 Mile Legend", desc: "Run 1000 total miles",            check: (w) => w.reduce((s,x) => s+(x.distance||0),0) >= 1000 },
  { id: "week_20",        emoji: "📅", label: "20 Mile Week",     desc: "Log 20+ miles in one week",       check: (w) => getMaxWeekMiles(w) >= 20 },
  { id: "week_50",        emoji: "🚀", label: "50 Mile Week",     desc: "Log 50+ miles in one week",       check: (w) => getMaxWeekMiles(w) >= 50 },
  { id: "streak_7",       emoji: "🔥", label: "Week on Fire",     desc: "Maintain a 7-day streak",         check: (w, streak) => streak >= 7 },
  { id: "streak_30",      emoji: "🏆", label: "Iron Consistency", desc: "Maintain a 30-day streak",        check: (w, streak) => streak >= 30 },
];

function getMaxWeekMiles(workouts) {
  const byWeek = {};
  workouts.forEach((w) => {
    if (!w.date) return;
    const weekKey = format(startOfWeek(parseISO(w.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    byWeek[weekKey] = (byWeek[weekKey] || 0) + (w.distance || 0);
  });
  return Math.max(0, ...Object.values(byWeek));
}

export function computeStreak(workouts) {
  if (!workouts.length) return 0;
  const uniqueDays = [...new Set(workouts.map((w) => w.date).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  if (!uniqueDays.length) return 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");

  // Streak must start from today or yesterday
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = differenceInCalendarDays(parseISO(uniqueDays[i - 1]), parseISO(uniqueDays[i]));
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export function computeEarnedBadges(workouts, streak) {
  return ALL_BADGES.filter((b) => b.check(workouts, streak)).map((b) => b.id);
}

export function useGamification(workouts) {
  const streak = useMemo(() => computeStreak(workouts), [workouts]);
  const earnedBadgeIds = useMemo(() => computeEarnedBadges(workouts, streak), [workouts, streak]);
  return { streak, earnedBadgeIds };
}