import React from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Package, ChevronRight } from "lucide-react";

export default function DashboardNav({ isCoach = false, onTabChange }) {
  const links = isCoach
    ? [
        { IconComponent: Calendar, label: "Meets", action: () => onTabChange?.("seasons"), href: null },
        { IconComponent: Users, label: "Roster", action: () => onTabChange?.("dashboard"), href: null },
        { IconComponent: Package, label: "Packet", href: "/packet" },
      ]
    : [
        { IconComponent: Calendar, label: "Meets", action: () => onTabChange?.("seasons"), href: null },
        { IconComponent: Users, label: "Team", action: () => onTabChange?.("profile"), href: null },
        { IconComponent: Package, label: "Stats", action: () => onTabChange?.("performance"), href: null },
      ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {links.map(({ IconComponent, label, action, href }) =>
        href ? (
          <Link
            key={label}
            to={href}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors group"
          >
            <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            <span className="text-xs font-medium text-foreground flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
          </Link>
        ) : (
          <button
            key={label}
            onClick={action}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors group"
          >
            <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
            <span className="text-xs font-medium text-foreground flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
          </button>
        )
      )}
    </div>
  );
}