import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Target, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startOfWeek, format, parseISO } from "date-fns";

const GOAL_TYPES = [
  { value: "weekly_miles", label: "Weekly Miles", unit: "mi/week" },
  { value: "5k_goal", label: "5K Goal", unit: "minutes" },
  { value: "2mile_goal", label: "2 Mile Goal", unit: "minutes" },
  { value: "1mile_goal", label: "1 Mile Goal", unit: "minutes" },
];

function computeProgress(goal, workouts) {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  switch (goal.type) {
    case "weekly_miles": {
      const val = workouts.filter((w) => w.date && w.date >= weekStart).reduce((s, w) => s + (w.distance || 0), 0);
      return { current: parseFloat(val.toFixed(1)), pct: Math.min(100, (val / goal.target) * 100) };
    }
    case "5k_goal":
    case "2mile_goal":
    case "1mile_goal": {
      const distanceMap = { "5k_goal": 3.1, "2mile_goal": 2, "1mile_goal": 1 };
      const distance = distanceMap[goal.type];
      const best = workouts
        .filter((w) => w.distance === distance && w.time_minutes > 0)
        .reduce((b, w) => !b || w.time_minutes < b ? w.time_minutes : b, null);
      if (!best) return { current: null, pct: 0 };
      const pct = Math.min(100, (goal.target / best) * 100);
      return { current: parseFloat(best.toFixed(2)), pct };
    }
    default:
      return { current: null, pct: 0 };
  }
}

function formatTimeDisplay(minutes) {
  if (!minutes) return "—";
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function GoalTracker({ workouts = [], userEmail }) {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "weekly_miles", target: "", label: "", deadline: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Goal.filter({ athlete_email: userEmail }, "-created_date", 20).then(setGoals);
  }, [userEmail]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const typeConfig = GOAL_TYPES.find((t) => t.value === form.type);
    let targetValue = parseFloat(form.target);

    if (form.type !== "weekly_miles") {
      const parts = form.target.split(":").map(Number);
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        alert("Please enter time in MM:SS format");
        setSaving(false);
        return;
      }
      const [mins, secs] = parts;
      targetValue = mins + secs / 60;
    }

    const newGoal = await base44.entities.Goal.create({
      athlete_email: userEmail,
      type: form.type,
      target: targetValue,
      label: typeConfig.label,
      completed: false,
    });
    setGoals((prev) => [newGoal, ...prev]);
    setForm({ type: "weekly_miles", target: "", label: "", deadline: "" });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Goal.delete(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const goalsWithProgress = useMemo(
    () => goals.map((g) => ({ ...g, progress: computeProgress(g, workouts) })),
    [goals, workouts]
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Goal Tracker
        </h2>
        <Button size="sm" variant={showForm ? "outline" : "default"} onClick={() => setShowForm((v) => !v)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          {showForm ? "Cancel" : "Add Goal"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-3 rounded-xl border border-border bg-background p-4">
          <div className="space-y-1">
            <Label>Goal Type</Label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {GOAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label} ({t.unit})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>
              {form.type === "weekly_miles" ? "Target Value" : "Target Time"}
            </Label>
            {form.type === "weekly_miles" ? (
              <Input type="number" step="0.1" min="0" placeholder="e.g. 30" value={form.target} onChange={(e) => set("target", e.target.value)} required />
            ) : (
              <Input type="text" placeholder="e.g. 24:30" value={form.target} onChange={(e) => set("target", e.target.value)} required />
            )}
          </div>

          <Button type="submit" size="sm" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Add Goal"}
          </Button>
        </form>
      )}

      {goalsWithProgress.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No goals yet. Set one to stay motivated!</p>
      ) : (
        <div className="space-y-3">
          {goalsWithProgress.map((g) => {
            const done = g.progress.pct >= 100;
            return (
              <div key={g.id} className={`rounded-xl border p-4 space-y-2 transition-colors ${done ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {done && <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />}
                    <p className="text-sm font-medium text-foreground">{g.label}</p>
                  </div>
                  <button onClick={() => handleDelete(g.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${done ? "bg-accent" : "bg-primary"}`}
                      style={{ width: `${g.progress.pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(g.type === "5k_goal" || g.type === "2mile_goal" || g.type === "1mile_goal")
                      ? g.progress.current != null
                        ? `${formatTimeDisplay(g.progress.current)} → Goal: ${formatTimeDisplay(g.target)}`
                        : `Goal: ${formatTimeDisplay(g.target)}`
                      : `${g.progress.current ?? 0} / ${g.target} mi`}
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}