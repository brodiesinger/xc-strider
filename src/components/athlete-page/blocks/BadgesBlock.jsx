import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ALL_BADGES, computeStreak, computeEarnedBadges } from "@/components/athlete/gamification/useStreakAndBadges";

export default function BadgesBlock({ athleteEmail }) {
  const [earnedIds, setEarnedIds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!athleteEmail) { setLoaded(true); return; }
    base44.entities.Workout.filter({ athlete_email: athleteEmail })
      .then((workouts) => {
        const streak = computeStreak(workouts || []);
        const ids = computeEarnedBadges(workouts || [], streak);
        setEarnedIds(ids);
      })
      .catch(() => setEarnedIds([]))
      .finally(() => setLoaded(true));
  }, [athleteEmail]);

  if (!loaded) return <p className="text-gray-400 text-sm py-2">Loading badges...</p>;

  const earned = ALL_BADGES.filter((b) => earnedIds.includes(b.id));
  if (earned.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">Badges Earned</h3>
      <div className="flex flex-wrap gap-3">
        {earned.map((b) => (
          <div key={b.id} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <span className="text-xl">{b.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">{b.label}</p>
              <p className="text-xs text-gray-400">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}