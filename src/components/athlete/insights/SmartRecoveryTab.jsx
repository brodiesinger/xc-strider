import React, { useState, useEffect, useMemo } from "react";
import { Zap, Moon, Droplets, Dumbbell, Wind } from "lucide-react";
import { startOfWeek, subWeeks, parseISO, format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

function getWeekMiles(workouts, weekStart) {
  const start = format(weekStart, "yyyy-MM-dd");
  const end = format(new Date(weekStart.getTime() + 7 * 86400000), "yyyy-MM-dd");
  return workouts
    .filter((w) => w.date && w.date >= start && w.date < end)
    .reduce((s, w) => s + (w.distance || 0), 0);
}

const ICON_MAP = {
  rest: Moon,
  easy: Wind,
  cross: Dumbbell,
  hydration: Droplets,
  energy: Zap,
};

function buildRulesRecommendations(workouts, checkin) {
  const recs = [];
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(thisWeekStart, 1);
  const thisWeek = getWeekMiles(workouts, thisWeekStart);
  const lastWeek = getWeekMiles(workouts, lastWeekStart);

  const recent7 = workouts.filter((w) => w.date && (now - parseISO(w.date)) / 86400000 <= 7);

  // No rest days
  if (recent7.length >= 6) {
    recs.push({ type: "rest", text: "You've been running daily. Schedule a rest day tomorrow to let your body recover." });
  }

  // Mileage spike
  if (lastWeek > 0 && thisWeek > lastWeek * 1.15) {
    recs.push({ type: "easy", text: "Mileage spiked this week. Keep tomorrow easy — a short, slow run or walk is ideal." });
  }

  // Soreness
  if (checkin?.soreness >= 7) {
    recs.push({ type: "rest", text: `Soreness is high (${checkin.soreness}/10). Rest or very light activity recommended today.` });
  } else if (checkin?.soreness >= 5) {
    recs.push({ type: "easy", text: "Moderate soreness reported. An easy effort run with extra stretching would help recovery." });
  }

  // Pain
  if (checkin?.pain >= 5) {
    recs.push({ type: "rest", text: `Pain level is ${checkin.pain}/10. Avoid running — rest and consult your coach or a medical professional.` });
  }

  // Low energy
  if (checkin?.energy <= 3) {
    recs.push({ type: "energy", text: "Energy is low. Prioritize sleep tonight (8–9 hrs) and stay hydrated throughout the day." });
  }

  // Hydration (always helpful)
  recs.push({ type: "hydration", text: "Drink at least 64 oz of water today. Proper hydration accelerates muscle repair." });

  // 3-week trend
  const twoWeeks = getWeekMiles(workouts, subWeeks(thisWeekStart, 2));
  if (thisWeek > lastWeek && lastWeek > twoWeeks && twoWeeks > 0) {
    recs.push({ type: "cross", text: "Three weeks of increasing load. Consider cross-training (bike, swim, yoga) instead of another run." });
  }

  if (recs.length <= 1) {
    recs.unshift({ type: "easy", text: "Training looks balanced! Keep up the consistent work and stay on top of recovery habits." });
  }

  return recs;
}

export default function SmartRecoveryTab({ workouts, userEmail }) {
  const [checkin, setCheckin] = useState(null);


  useEffect(() => {
    if (!userEmail) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    base44.entities.DailyCheckin.filter({ athlete_email: userEmail, date: todayStr }, "-created_date", 1)
      .then((res) => { if (res[0]) setCheckin(res[0]); })
      .catch(() => {});
  }, [userEmail]);

  const ruleRecs = useMemo(() => buildRulesRecommendations(workouts, checkin), [workouts, checkin]);



  return (
    <div className="space-y-5">
      {/* Rule-based recs */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-primary" />
          Today's Recovery Plan
        </h3>
        <div className="space-y-3">
          {ruleRecs.map((rec, i) => {
            const Icon = ICON_MAP[rec.type] || Zap;
            return (
              <div key={i} className="flex gap-3 items-start rounded-xl bg-muted p-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{rec.text}</p>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}