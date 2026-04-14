import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teamHasAccess, accessBlockedReason } from "@/lib/billing";

/**
 * Wraps content that requires an active subscription.
 * If access is blocked, renders an upgrade prompt instead.
 *
 * Usage:
 *   <BillingGate team={team}>
 *     <ProtectedContent />
 *   </BillingGate>
 */
export default function BillingGate({ team, children }) {
  if (teamHasAccess(team)) {
    return <>{children}</>;
  }

  const reason = accessBlockedReason(team);

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-5">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <Lock className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{reason}</p>
      </div>
      <Link to="/pricing">
        <Button className="font-semibold px-6">View Plans</Button>
      </Link>
    </div>
  );
}