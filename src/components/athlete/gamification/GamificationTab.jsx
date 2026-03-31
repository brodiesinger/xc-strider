import React, { useState } from "react";
import { Trophy } from "lucide-react";
import ConsistencyLeaderboard from "./ConsistencyLeaderboard";
import BadgeGrid from "./BadgeGrid";
import { ALL_BADGES } from "./useStreakAndBadges";
import { motion } from "framer-motion";

export default function GamificationTab({ user, team, athletes, streak, earnedBadgeIds }) {
  const [section, setSection] = useState("leaderboard");

  return (
    <div className="space-y-5 pb-28 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" /> Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Compete, earn badges, and stay consistent</p>
      </div>

      {/* Streak Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #dc2626, #ea580c)" }}
      >
        <div className="text-4xl">🔥</div>
        <div>
          <p className="text-white font-extrabold text-xl leading-tight">{streak} Day Streak</p>
          <p className="text-white/70 text-sm">
            {streak === 0 ? "Log a workout to start your streak!" : "Keep logging daily to maintain it!"}
          </p>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {[
          { id: "leaderboard", label: "🏆 Consistency" },
          { id: "badges", label: "🏅 Badges" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
              section === t.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === "leaderboard" && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Ranked by % of assigned workouts completed this week. Resets every Monday.
          </p>
          <ConsistencyLeaderboard
            teamId={team?.id}
            currentUserEmail={user?.email}
            athletes={athletes || []}
          />
        </div>
      )}

      {section === "badges" && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            {earnedBadgeIds.length} / {ALL_BADGES.length} badges earned. Keep training to unlock more!
          </p>
          <BadgeGrid earnedBadgeIds={earnedBadgeIds} />
        </div>
      )}
    </div>
  );
}