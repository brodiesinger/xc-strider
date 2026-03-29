import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, isAfter, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, CalendarDays, MapPin, Clock } from "lucide-react";

const emptyForm = { title: "", date: "", time: "", location: "", notes: "" };

export default function ScheduleManager({ teamId, schedule, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.PracticeSchedule.create({ ...form, team_id: teamId });
      setForm(emptyForm);
      setShowForm(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await base44.entities.PracticeSchedule.delete(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  const today = startOfToday();
  const upcoming = schedule
    .filter((s) => s.date && !isAfter(today, parseISO(s.date)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = schedule
    .filter((s) => s.date && isAfter(today, parseISO(s.date)))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Practice Schedule</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Practice
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="e.g. Tempo Run" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input placeholder="e.g. 3:30 PM" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input placeholder="e.g. Track, Front Parking Lot" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes / Workout Details</Label>
            <Textarea placeholder="Describe the workout..." value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving..." : "Add Practice"}</Button>
          </div>
        </form>
      )}

      {/* Upcoming */}
      <ScheduleSection
        title="Upcoming"
        icon={CalendarDays}
        items={upcoming}
        onDelete={handleDelete}
        deletingId={deletingId}
        emptyText="No upcoming practices. Add one above."
      />

      {/* Past */}
      {past.length > 0 && (
        <ScheduleSection
          title="Past"
          icon={CalendarDays}
          items={past}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}

function ScheduleSection({ title, icon: Icon, items, onDelete, deletingId, emptyText }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {title}
      </h3>
      {items.length === 0 && emptyText ? (
        <p className="text-sm text-muted-foreground text-center py-4">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground truncate">{s.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{format(parseISO(s.date), "EEE, MMM d")}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {s.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.time}</span>}
                  {s.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>}
                </div>
                {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
              </div>
              <button
                onClick={() => onDelete(s.id)}
                disabled={deletingId === s.id}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}