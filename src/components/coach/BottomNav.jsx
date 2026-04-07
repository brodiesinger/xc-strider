import React from "react";
import { Home, BarChart2, Lightbulb, CalendarRange, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", Icon: Home },
  { id: "performance", label: "Performance", Icon: BarChart2 },
  { id: "insights", label: "Insights", Icon: Lightbulb },
  { id: "seasons", label: "Seasons", Icon: CalendarRange },
  { id: "settings", label: "Settings", Icon: Settings },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-2xl mx-auto flex items-stretch h-16">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id;
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
              <Icon className={cn("w-5 h-5", isActive && "fill-primary/10")} />
              <span className={cn("text-[10px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}