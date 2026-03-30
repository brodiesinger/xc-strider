import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Ruler, MapPin, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function TodaysWorkoutCard({ schedule }) {
  if (!schedule) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center"
      >
        <p className="text-sm text-muted-foreground font-medium">No workout assigned yet</p>
        <p className="text-xs text-muted-foreground mt-1">Check back soon for today's practice</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/2 p-5 space-y-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's Workout</p>
          <h3 className="text-lg font-bold text-foreground mt-1">{schedule.title}</h3>
        </div>
      </div>

      <div className="space-y-2">
        {schedule.time && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{schedule.time}</span>
          </div>
        )}
        {schedule.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{schedule.location}</span>
          </div>
        )}
        {schedule.notes && (
          <div className="flex gap-2 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground">{schedule.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}