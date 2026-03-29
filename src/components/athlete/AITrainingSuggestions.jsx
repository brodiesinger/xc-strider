import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOfWeek, format } from "date-fns";

function buildWorkoutSummary(workouts) {
  if (!workouts.length) return "No workouts logged yet.";
  const recent = workouts.slice(0, 20);
  const lines = recent.map(
    (w) => `Date: ${w.date}, Distance: ${w.distance} mi, Time: ${w.time_minutes} min${w.notes ? `, Notes: ${w.notes}` : ""}`
  );
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekMiles = workouts
    .filter((w) => w.date >= weekStart)
    .reduce((s, w) => s + (w.distance || 0), 0);
  return `Current week mileage: ${weekMiles.toFixed(1)} mi\n\nRecent workouts:\n${lines.join("\n")}`;
}

export default function AITrainingSuggestions({ workouts }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    const summary = buildWorkoutSummary(workouts);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert cross-country running coach. Based on the athlete's recent training data, provide 3 specific, actionable training suggestions for next week. Be concise and practical.\n\nAthlete data:\n${summary}`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                detail: { type: "string" },
                emoji: { type: "string" }
              }
            }
          }
        }
      }
    });
    setSuggestions(result.suggestions || []);
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Training Suggestions
        </h2>
        <Button size="sm" variant={suggestions ? "outline" : "default"} onClick={generate} disabled={loading} className="gap-1.5">
          {loading ? (
            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
          ) : suggestions ? (
            <><RefreshCw className="w-3.5 h-3.5" /> Refresh</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" /> Generate</>
          )}
        </Button>
      </div>

      {!suggestions && !loading && (
        <p className="text-sm text-muted-foreground">
          Get personalized training recommendations based on your workout history.
        </p>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {suggestions && !loading && (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-4 flex gap-3">
              <span className="text-xl shrink-0">{s.emoji || "🏃"}</span>
              <div>
                <p className="font-medium text-foreground text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}