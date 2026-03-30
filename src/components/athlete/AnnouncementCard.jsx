import React from "react";
import { motion } from "framer-motion";
import { X, Megaphone } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function AnnouncementCard({ announcement, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="rounded-2xl border border-border bg-card p-4 flex gap-3 relative"
    >
      <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
        <Megaphone className="w-5 h-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {announcement.coach_name || "Coach"}
        </p>
        <p className="text-sm text-foreground leading-snug line-clamp-2 mt-0.5">
          {announcement.message}
        </p>
        {announcement.created_date && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {format(parseISO(announcement.created_date), "MMM d, h:mm a")}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(announcement.id)}
        className="shrink-0 p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}