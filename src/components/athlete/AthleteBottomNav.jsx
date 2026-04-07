import React from "react";
import { Home, Plus, BarChart2, Lightbulb, User, Trophy, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "dashboard", label: "Home", Icon: Home },
  { id: "log", label: "Log", Icon: Plus },
  { id: "performance", label: "Stats", Icon: BarChart2 },
  { id: "insights", label: "Insights", Icon: Lightbulb },
  { id: "seasons", label: "Seasons", Icon: CalendarRange },
  { id: "leaderboard", label: "Leaderboard", Icon: Trophy },
  { id: "profile", label: "Profile", Icon: User },
];

export default function AthleteBottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-2xl mx-auto flex items-stretch h-16">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          const isLog = id === "log";
          return (
            <motion.button
              key={id}
              onClick={() => onChange(id)}
              whileTap={{ scale: 0.85 }}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isLog ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md mb-0.5 -mt-4"
                >
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </motion.div>
              ) : (
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "fill-primary/10")} />
              )}
              {!isLog && (
                <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                  {label}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}