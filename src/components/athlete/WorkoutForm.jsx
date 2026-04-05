import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { getDisplayName } from "@/lib/displayName";

const empty = () => ({
  distance: "",
  time_minutes: "",
  notes: "",
  date: format(new Date(), "yyyy-MM-dd"),
});

export default function WorkoutForm({ onSaved, teamId }) {
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Workout.create({
        distance: parseFloat(form.distance),
        time_minutes: parseFloat(form.time_minutes),
        notes: form.notes,
        date: form.date,
        team_id: teamId || null,
        athlete_email: user?.email || null,
        athlete_name: getDisplayName(user),
      });
      setForm(empty());
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="distance">Distance (mi)</Label>
          <Input
            id="distance"
            type="number"
            min="0"
            step="0.01"
            placeholder="3.1"
            value={form.distance}
            onChange={(e) => set("distance", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="time">Time (min)</Label>
          <Input
            id="time"
            type="number"
            min="0"
            step="0.1"
            placeholder="22"
            value={form.time_minutes}
            onChange={(e) => set("time_minutes", e.target.value)}
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
          onChange={(e) => set("date", e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="How did it feel?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving..." : "Log Workout"}
      </Button>
    </form>
  );
}