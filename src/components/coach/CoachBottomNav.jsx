import React from "react";
import { LayoutDashboard, BarChart2, Lightbulb, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "performance", label: "Performance", icon: BarChart2 },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function CoachBottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
              active === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5", active === id && "stroke-[2.5px]")} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}