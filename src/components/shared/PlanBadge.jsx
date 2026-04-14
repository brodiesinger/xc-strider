import React from "react";
import { Sparkles, FlaskConical, CheckCircle2 } from "lucide-react";

const PLAN_CONFIG = {
  starter: {
    label: "Starter",
    color: "bg-secondary text-secondary-foreground border-border",
    price: "$69/mo",
  },
  team: {
    label: "Team",
    color: "bg-primary/10 text-primary border-primary/20",
    price: "$129/mo",
  },
  elite: {
    label: "Elite",
    color: "bg-accent/10 text-accent border-accent/20",
    price: "$189/mo",
  },
};

const STATUS_CONFIG = {
  trial: {
    icon: FlaskConical,
    label: "14-day free trial",
    color: "text-primary",
  },
  demo: {
    icon: Sparkles,
    label: "Demo access",
    color: "text-accent",
  },
  active: {
    icon: CheckCircle2,
    label: "Active",
    color: "text-green-600",
  },
};

/**
 * Shows a plan + billing-status badge.
 * plan: "starter" | "team" | "elite"
 * status: "trial" | "demo" | "active"
 */
export default function PlanBadge({ plan = "starter", status = "trial", className = "" }) {
  const planCfg = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.trial;
  const StatusIcon = statusCfg.icon;

  return (
    <div className={`w-full rounded-2xl border p-4 flex items-center justify-between gap-3 ${planCfg.color} ${className}`}>
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-widest opacity-60">Selected Plan</span>
        <span className="text-lg font-extrabold leading-tight">{planCfg.label}</span>
        <span className="text-xs font-medium opacity-60">{planCfg.price}</span>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusCfg.color}`}>
        <StatusIcon className="w-3.5 h-3.5" />
        {statusCfg.label}
      </div>
    </div>
  );
}