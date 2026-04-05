import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { computeStreak } from "@/components/athlete/gamification/useStreakAndBadges";

export default function StreakBlock({ athleteEmail }) {
  const [streak, setStreak] = useState(0);
  const [totalMiles, setTotalMiles] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!athleteEmail) { setLoaded(true); return; }
    base44.entities.Workout.filter({ athlete_email: athleteEmail })
      .then((workouts) => {
        const w = workouts || [];
        setStreak(computeStreak(w));
        setTotalMiles(w.reduce((s, x) => s + (x.distance || 0), 0));
        setTotalWorkouts(w.length);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [athleteEmail]);

  if (!loaded) return <p className="text-gray-400 text-sm py-2">Loading streak data...</p>;
  if (totalWorkouts === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">Training Consistency</h3>
      <div className="flex gap-6">
        <div className="text-center border border-gray-200 rounded-lg px-5 py-3">
          <p className="text-3xl font-bold text-gray-900">🔥 {streak}</p>
          <p className="text-xs text-gray-500 mt-1">Day Streak</p>
        </div>
        <div className="text-center border border-gray-200 rounded-lg px-5 py-3">
          <p className="text-3xl font-bold text-gray-900">{totalWorkouts}</p>
          <p className="text-xs text-gray-500 mt-1">Total Workouts</p>
        </div>
        <div className="text-center border border-gray-200 rounded-lg px-5 py-3">
          <p className="text-3xl font-bold text-gray-900">{totalMiles.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Miles</p>
        </div>
      </div>
    </div>
  );
}