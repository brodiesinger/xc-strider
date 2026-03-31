import React from "react";
import { ALL_BADGES } from "./useStreakAndBadges";
import { motion } from "framer-motion";

export default function BadgeGrid({ earnedBadgeIds = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ALL_BADGES.map((badge, i) => {
        const earned = earnedBadgeIds.includes(badge.id);
        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              earned
                ? "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm"
                : "border-border bg-muted/30 opacity-50 grayscale"
            }`}
          >
            <span className="text-2xl">{badge.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground leading-tight">{badge.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{badge.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}