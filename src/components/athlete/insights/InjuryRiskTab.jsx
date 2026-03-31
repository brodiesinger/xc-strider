import React, { useMemo, useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";
import { startOfWeek, subWeeks, parseISO, format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

// ── helpers ──────────────────────────────────────────────────────────────────

function getWeekMiles(workouts, weekStart) {
  const start = format(weekStart, "yyyy-MM-dd");
  const end = format(new Date(weekStart.getTime() + 7 * 86400000), "yyyy-MM-dd");
  return workouts
    .filter((w) => w.date && w.date >= start && w.date < end)
    .reduce((s, w) => s + (w.distance || 0), 0);
}

function calcRisk(workouts, checkin) {
  const warnings = [];
  let score = 0;

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const twoWeeksStart = subWeeks(thisWeekStart, 2);

  const thisWeek = getWeekMiles(workouts, thisWeekStart);
  const lastWeek = getWeekMiles(workouts, lastWeekStart);
  const twoWeeks = getWeekMiles(workouts, twoWeeksStart);

  // ACWR-inspired mileage spike
  if (lastWeek > 0 && thisWeek > lastWeek * 1.2) {
    const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    warnings.push(`Mileage jumped ${pct}% this week (${thisWeek.toFixed(1)} vs ${lastWeek.toFixed(1)} mi). Sudden increases raise injury risk.`);
    score += 3;
  } else if (lastWeek > 0 && thisWeek > lastWeek * 1.1) {
    const pct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    warnings.push(`Mileage increased ${pct}% this week. Stay mindful of recovery.`);
    score += 1;
  }

  // 3-week upward trend
  if (thisWeek > lastWeek && lastWeek > twoWeeks && twoWeeks > 0) {
    warnings.push("3 consecutive weeks of increasing mileage. A down week soon is recommended.");
    score += 1;
  }

  // No rest days last 7 days
  const recent7 = workouts.filter((w) => {
    if (!w.date) return false;
    return (now - parseISO(w.date)) / 86400000 <= 7;
  });
  if (recent7.length >= 7) {
    warnings.push("No rest days logged in the past 7 days. Rest is part of training.");
    score += 2;
  }

  // Long run spike
  const sampleSize = Math.min(workouts.length, 20);
  const avg = sampleSize > 0 ? workouts.slice(0, 20).reduce((s, w) => s + (w.distance || 0), 0) / sampleSize : 0;
  const spike = recent7.find((w) => w.distance > avg * 1.8);
  if (spike) {
    warnings.push(`A recent ${spike.distance} mi run is well above your average (${avg.toFixed(1)} mi). Allow extra recovery.`);
    score += 2;
  }

  // Soreness / pain from check-in
  if (checkin) {
    if (checkin.soreness >= 7) { warnings.push(`Soreness is high (${checkin.soreness}/10). Consider reducing intensity.`); score += 2; }
    else if (checkin.soreness >= 5) { warnings.push(`Moderate soreness reported (${checkin.soreness}/10). Listen to your body.`); score += 1; }
    if (checkin.pain >= 5) { warnings.push(`Pain level is elevated (${checkin.pain}/10). Rest and consult your coach.`); score += 3; }
    if (checkin.energy <= 3) { warnings.push(`Low energy today (${checkin.energy}/10). Fatigue can increase injury risk.`); score += 1; }
  }

  const level = score >= 5 ? "high" : score >= 3 ? "medium" : score >= 1 ? "low" : "safe";
  return { level, warnings, score };
}

const LEVEL = {
  safe:   { label: "Low Risk",       color: "text-primary",  bg: "bg-primary/5 border-primary/20",       Icon: ShieldCheck  },
  low:    { label: "Minor Risk",      color: "text-accent", bg: "bg-accent/5 border-accent/20",     Icon: AlertTriangle },
  medium: { label: "Moderate Risk",   color: "text-accent", bg: "bg-accent/10 border-accent/30",     Icon: ShieldAlert  },
  high:   { label: "High Risk",       color: "text-destructive",    bg: "bg-destructive/5 border-destructive/20",           Icon: ShieldAlert  },
};

// ── Slider ────────────────────────────────────────────────────────────────────
function ScaleSlider({ label, emoji, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-foreground">{emoji} {label}</span>
        <span className="font-bold text-primary">{value}/10</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
        <span>1 – Low</span><span>10 – High</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InjuryRiskTab({ workouts, userEmail }) {
  const [checkin, setCheckin] = useState(null);
  const [form, setForm] = useState({ soreness: 3, pain: 1, energy: 7 });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    base44.entities.DailyCheckin.filter({ athlete_email: userEmail, date: todayStr }, "-created_date", 1)
      .then((res) => {
        if (res[0]) {
          setCheckin(res[0]);
          setForm({ soreness: res[0].soreness ?? 3, pain: res[0].pain ?? 1, energy: res[0].energy ?? 7 });
        } else {
          setShowForm(true);
        }
      })
      .catch(() => setShowForm(true));
  }, [userEmail]);

  const { level, warnings } = useMemo(() => calcRisk(workouts, checkin), [workouts, checkin]);
  const cfg = LEVEL[level];

  const handleSave = async () => {
    setSaving(true);
    try {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      let record;
      if (checkin?.id) {
        record = await base44.entities.DailyCheckin.update(checkin.id, form);
      } else {
        record = await base44.entities.DailyCheckin.create({ athlete_email: userEmail, date: todayStr, ...form });
      }
      setCheckin(record);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Risk Card */}
      <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
        <div className="flex items-center gap-2 mb-2">
          <cfg.Icon className={`w-5 h-5 ${cfg.color}`} />
          <span className={`font-bold text-base ${cfg.color}`}>{cfg.label}</span>
        </div>
        {warnings.length === 0 && (
          <p className="text-sm text-muted-foreground">Your training load looks healthy. Keep it up!</p>
        )}
        <ul className="space-y-1.5">
          {warnings.map((w, i) => (
            <li key={i} className="text-sm text-foreground/80 flex gap-2">
              <span className="shrink-0 mt-0.5">•</span><span>{w}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Daily Check-in */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Daily Check-in</h3>
          {checkin && !showForm && (
            <button onClick={() => setShowForm(true)} className="text-xs text-primary underline">Update</button>
          )}
        </div>

        {checkin && !showForm ? (
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Soreness", checkin.soreness, "😣"], ["Pain", checkin.pain, "🤕"], ["Energy", checkin.energy, "⚡"]].map(([lbl, val, em]) => (
              <div key={lbl} className="rounded-xl bg-muted p-3">
                <p className="text-lg">{em}</p>
                <p className="font-bold text-foreground text-lg">{typeof val === "number" ? `${val}/10` : val ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{lbl}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <ScaleSlider label="Soreness" emoji="😣" value={form.soreness} onChange={(v) => setForm(f => ({ ...f, soreness: v }))} />
            <ScaleSlider label="Pain" emoji="🤕" value={form.pain} onChange={(v) => setForm(f => ({ ...f, pain: v }))} />
            <ScaleSlider label="Energy" emoji="⚡" value={form.energy} onChange={(v) => setForm(f => ({ ...f, energy: v }))} />
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Check-in"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}