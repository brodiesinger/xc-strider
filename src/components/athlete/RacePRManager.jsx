import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DISTANCES = ["5K", "2 Mile", "1 Mile"];

function formatTime(minutes) {
  if (!minutes) return "—";
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RacePRManager({ userEmail }) {
  const [prs, setPRs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ distance: "5K", time_minutes: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    base44.entities.RacePR.filter({ athlete_email: userEmail }, "-created_date", 20)
      .then(setPRs)
      .catch(() => setPRs([]))
      .finally(() => setLoading(false));
  }, [userEmail]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.time_minutes) return;
    setSaving(true);
    try {
      const parts = form.time_minutes.split(":").map(Number);
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        alert("Please enter time in MM:SS format");
        setSaving(false);
        return;
      }
      const [mins, secs] = parts;
      const totalMinutes = mins + secs / 60;
      const newPR = await base44.entities.RacePR.create({
        athlete_email: userEmail,
        distance: form.distance,
        time_minutes: totalMinutes,
      });
      setPRs((prev) => [newPR, ...prev]);
      setForm({ distance: "5K", time_minutes: "" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.RacePR.delete(id);
    setPRs((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-5 h-5 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Race PRs
        </h2>
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm((v) => !v)}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? "Cancel" : "Add PR"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 rounded-xl border border-border bg-background p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Distance</label>
            <select
              value={form.distance}
              onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DISTANCES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Time (MM:SS)</label>
            <Input
              type="text"
              placeholder="e.g. 24:30"
              value={form.time_minutes}
              onChange={(e) => setForm((f) => ({ ...f, time_minutes: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Add Race PR"}
          </Button>
        </form>
      )}

      {prs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No race PRs yet. Add your fastest race times!</p>
      ) : (
        <div className="space-y-2">
          {prs.map((pr) => (
            <div key={pr.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div>
                <p className="font-medium text-foreground">{pr.distance}</p>
                <p className="text-sm text-primary">{formatTime(pr.time_minutes)}</p>
              </div>
              <button
                onClick={() => handleDelete(pr.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}