import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, X, Copy } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function WeeklyScheduleManager({ teamId, schedule, onRefresh }) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [editingDay, setEditingDay] = useState(null);
  const [form, setForm] = useState({ title: "", time: "", location: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const weekDates = useMemo(() => {
    return DAYS.map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const scheduleByDate = useMemo(() => {
    const map = {};
    weekDates.forEach((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      map[dateStr] = schedule.find((s) => s.date === dateStr) || null;
    });
    return map;
  }, [schedule, weekDates]);

  const handleOpenEdit = (dayIndex) => {
    const dateStr = format(weekDates[dayIndex], "yyyy-MM-dd");
    const existing = scheduleByDate[dateStr];
    if (existing) {
      setForm({ title: existing.title, time: existing.time || "", location: existing.location || "", notes: existing.notes || "" });
      setEditingDay({ index: dayIndex, date: dateStr, id: existing.id });
    } else {
      setForm({ title: "", time: "", location: "", notes: "" });
      setEditingDay({ index: dayIndex, date: dateStr, id: null });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingDay.id) {
        // Update existing
        await base44.entities.PracticeSchedule.update(editingDay.id, form);
        toast.success("Practice updated!");
      } else {
        // Create new
        await base44.entities.PracticeSchedule.create({
          ...form,
          team_id: teamId,
          date: editingDay.date,
        });
        toast.success("Practice added!");
      }
      setEditingDay(null);
      setForm({ title: "", time: "", location: "", notes: "" });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingDay.id) return;
    setSaving(true);
    try {
      await base44.entities.PracticeSchedule.delete(editingDay.id);
      toast.success("Practice removed");
      setEditingDay(null);
      setForm({ title: "", time: "", location: "", notes: "" });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLastWeek = async () => {
    const lastWeekStart = addDays(currentWeekStart, -7);
    const lastWeekDates = DAYS.map((_, i) => addDays(lastWeekStart, i));

    // Get last week's schedule
    const lastWeekSchedule = lastWeekDates.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      return schedule.find((s) => s.date === dateStr);
    }).filter(Boolean);

    if (lastWeekSchedule.length === 0) {
      toast.error("No previous week schedule to copy");
      return;
    }

    // Check if current week has schedule entries
    const currentWeekEntries = weekDates.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      return schedule.find((s) => s.date === dateStr);
    }).filter(Boolean);

    if (currentWeekEntries.length > 0) {
      setShowCopyConfirm(true);
      return;
    }

    // Proceed with copy
    await proceedWithCopy(lastWeekSchedule);
  };

  const proceedWithCopy = async (lastWeekSchedule) => {
    setCopying(true);
    try {
      // Map last week's schedule to current week dates
      const ops = [];
      lastWeekSchedule.forEach((practice, idx) => {
        const targetDate = weekDates[idx];
        const targetDateStr = format(targetDate, "yyyy-MM-dd");
        const existing = scheduleByDate[targetDateStr];

        if (existing) {
          // Update existing entry
          ops.push(
            base44.entities.PracticeSchedule.update(existing.id, {
              title: practice.title,
              time: practice.time || "",
              location: practice.location || "",
              notes: practice.notes || "",
            })
          );
        } else {
          // Create new entry
          ops.push(
            base44.entities.PracticeSchedule.create({
              title: practice.title,
              time: practice.time || "",
              location: practice.location || "",
              notes: practice.notes || "",
              date: targetDateStr,
              team_id: teamId,
            })
          );
        }
      });

      await Promise.all(ops);
      toast.success("Last week's schedule copied");
      setShowCopyConfirm(false);
      onRefresh();
    } catch (err) {
      toast.error("Unable to copy schedule");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Week Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-foreground">Weekly Schedule</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center min-w-max">
            <span className="hidden sm:inline">{format(currentWeekStart, "MMM d")} – {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}</span>
            <span className="sm:hidden">{format(currentWeekStart, "M/d")}–{format(addDays(currentWeekStart, 6), "M/d")}</span>
          </span>
          <Button size="sm" variant="outline" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleCopyLastWeek}
          disabled={copying}
          className="gap-1.5"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Copy Last Week</span>
          <span className="sm:hidden">Copy</span>
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {DAYS.map((day, i) => {
          const date = weekDates[i];
          const dateStr = format(date, "yyyy-MM-dd");
          const practice = scheduleByDate[dateStr];
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;

          return (
           <motion.div
             key={i}
             whileHover={{ scale: 1.02, y: -2 }}
             whileTap={{ scale: 0.98 }}
             className={`rounded-lg border-2 p-3 min-h-32 flex flex-col cursor-pointer transition-all shadow-sm ${
               isToday
                 ? "border-primary bg-primary/5"
                 : practice
                 ? "border-primary/30 bg-card"
                 : "border-border hover:border-primary/50"
             }`}
             onClick={() => handleOpenEdit(i)}
           >
              <p className="text-xs font-semibold text-muted-foreground truncate">{day}</p>
              <p className="text-xs text-muted-foreground font-medium">{format(date, "d")}</p>
              {practice ? (
                <div className="mt-2 flex-1 flex flex-col gap-1">
                  <p className="text-xs font-semibold text-foreground line-clamp-2">{practice.title}</p>
                  {practice.time && <p className="text-xs text-muted-foreground">{practice.time}</p>}
                  {practice.location && <p className="text-xs text-muted-foreground truncate">{practice.location}</p>}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">No practice</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Copy Confirmation Modal */}
      {showCopyConfirm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm">
            <h3 className="font-semibold text-foreground mb-2">Replace This Week's Schedule?</h3>
            <p className="text-sm text-muted-foreground mb-4">This will overwrite the current week's schedule with last week's practices.</p>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCopyConfirm(false)}
                disabled={copying}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => {
                  const lastWeekStart = addDays(currentWeekStart, -7);
                  const lastWeekDates = DAYS.map((_, i) => addDays(lastWeekStart, i));
                  const lastWeekSchedule = lastWeekDates.map((d) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    return schedule.find((s) => s.date === dateStr);
                  }).filter(Boolean);
                  proceedWithCopy(lastWeekSchedule);
                }}
                disabled={copying}
              >
                {copying ? "Copying..." : "Replace"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Edit Modal */}
      {editingDay && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {DAYS[editingDay.index]} – {format(parseISO(editingDay.date), "MMM d")}
              </h3>
              <button onClick={() => setEditingDay(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label>Practice Title</Label>
                <Input placeholder="e.g. Tempo Run" value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input placeholder="e.g. 3:30 PM" value={form.time} onChange={(e) => set("time", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input placeholder="e.g. Track" value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea placeholder="Workout details..." value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingDay(null)}>
                  Cancel
                </Button>
                {editingDay.id && (
                  <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
                    Delete
                  </Button>
                )}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </motion.div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}