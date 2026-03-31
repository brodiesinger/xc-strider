import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LogWorkoutDrawer({ open, onClose, onSaved, teamId }) {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ distance: "", time_minutes: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) setForm({ distance: "", time_minutes: "", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.distance || !form.time_minutes) return;
    setSaving(true);
    try {
      await base44.entities.Workout.create({
        distance: parseFloat(form.distance),
        time_minutes: parseFloat(form.time_minutes),
        date: form.date,
        notes: form.notes,
        team_id: teamId || null,
        athlete_email: user?.email || null,
        athlete_name: user?.full_name || user?.email?.split("@")[0] || null,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h2 className="text-lg font-bold text-foreground">Log Workout</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="distance">Distance (mi)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.1"
                    placeholder="3.1"
                    value={form.distance}
                    onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time">Time (min)</Label>
                  <Input
                    id="time"
                    type="number"
                    step="0.1"
                    placeholder="24"
                    value={form.time_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, time_minutes: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="How did it feel?"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full h-12 text-base font-semibold mt-2">
                {saving ? "Saving..." : "Save Workout"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}