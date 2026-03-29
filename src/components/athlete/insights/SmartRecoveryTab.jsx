import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, RefreshCw, Zap, Moon, Droplets, Dumbbell, Wind } from "lucide-react";
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
  const [aiRecs, setAiRecs] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    base44.entities.DailyCheckin.filter({ athlete_email: userEmail, date: todayStr }, "-created_date", 1)
      .then((res) => { if (res[0]) setCheckin(res[0]); })
      .catch(() => {});
  }, [userEmail]);

  const ruleRecs = useMemo(() => buildRulesRecommendations(workouts, checkin), [workouts, checkin]);

  const fetchAI = async () => {
    setLoading(true);
    setAiRecs(null);
    try {
      const now = new Date();
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const thisWeek = getWeekMiles(workouts, thisWeekStart);
      const lastWeek = getWeekMiles(workouts, subWeeks(thisWeekStart, 1));
      const recent = workouts.slice(0, 7).map(w => `${w.date}: ${w.distance}mi in ${w.time_minutes}min`).join("; ");

      const prompt = `You are a running coach giving recovery advice to a cross-country athlete.

Recent workouts (last 7): ${recent || "none"}
This week mileage: ${thisWeek.toFixed(1)} mi, Last week: ${lastWeek.toFixed(1)} mi
Today's check-in: ${checkin ? `Soreness ${checkin.soreness}/10, Pain ${checkin.pain}/10, Energy ${checkin.energy}/10` : "Not completed"}

Give 3-4 specific, practical recovery recommendations for tomorrow. Be concise and direct. Output as a JSON array like:
[{"text": "recommendation here"}, ...]`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: { recommendations: { type: "array", items: { type: "object", properties: { text: { type: "string" } } } } }
        }
      });
      setAiRecs(result.recommendations || []);
    } finally {
      setLoading(false);
    }
  };

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

      {/* AI Recs */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Coach Suggestions
          </h3>
          <Button variant="outline" size="sm" onClick={fetchAI} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {aiRecs ? "Refresh" : "Generate"}
          </Button>
        </div>

        {!aiRecs && !loading && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Tap "Generate" to get personalized AI recovery suggestions based on your training.
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {aiRecs && (
          <div className="space-y-2">
            {aiRecs.map((r, i) => (
              <div key={i} className="flex gap-3 items-start rounded-xl bg-muted p-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}