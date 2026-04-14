import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { planHasFeature } from "@/lib/billing";

const PLAN_LABELS = {
  performance_tracking: "Performance Tracking",
  meet_results: "Meet Results",
  pr_tracking: "PR Tracking",
  season_overview: "Season Overview",
  injury_alerts: "Injury Alerts",
  ai_insights: "AI Injury Insights",
  advanced_analytics: "Advanced Analytics",
  overtraining_detection: "Overtraining Detection",
  packet_builder: "Packet Builder",
  exportable_reports: "Exportable Reports",
};

const FEATURE_PLAN = {
  performance_tracking: "Team",
  meet_results: "Team",
  pr_tracking: "Team",
  season_overview: "Team",
  injury_alerts: "Team",
  ai_insights: "Elite",
  advanced_analytics: "Elite",
  overtraining_detection: "Elite",
  packet_builder: "Elite",
  exportable_reports: "Elite",
};

/**
 * Wraps content that requires a specific plan feature.
 * If the team's plan doesn't include the feature, renders a clean upgrade prompt.
 *
 * Usage:
 *   <FeatureGate team={team} feature="ai_insights">
 *     <AiContent />
 *   </FeatureGate>
 */
export default function FeatureGate({ team, feature, children }) {
  if (planHasFeature(team, feature)) {
    return <>{children}</>;
  }

  const featureLabel = PLAN_LABELS[feature] || feature;
  const requiredPlan = FEATURE_PLAN[feature] || "Team";

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 gap-4 rounded-2xl border border-border bg-card">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
        <Lock className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-base font-bold text-foreground">{featureLabel}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This feature is available on the <span className="font-semibold text-foreground">{requiredPlan} plan</span> and above.
        </p>
      </div>
      <Link to="/pricing">
        <Button size="sm" className="font-semibold px-5">Upgrade Plan</Button>
      </Link>
    </div>
  );
}