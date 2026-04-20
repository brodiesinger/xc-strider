import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import { Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPanel() {
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [pricingEnabled, setPricingEnabled] = useState(false);
  const [configId, setConfigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate("/"); return; }
    if (currentUser.role !== "admin") { navigate("/"); return; }
  }, [currentUser]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const configs = await base44.entities.AppConfig.filter({ key: "global" });
      if (configs && configs.length > 0) {
        setPricingEnabled(configs[0].pricing_enabled ?? false);
        setConfigId(configs[0].id);
      } else {
        // Create the singleton config record
        const created = await base44.entities.AppConfig.create({ key: "global", pricing_enabled: false });
        setPricingEnabled(false);
        setConfigId(created.id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") loadConfig();
  }, [currentUser]);

  const handleToggle = async () => {
    const next = !pricingEnabled;
    setSaving(true);
    try {
      await base44.entities.AppConfig.update(configId, { pricing_enabled: next });
      setPricingEnabled(next);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Global settings</p>
          </div>
          <Button size="sm" variant="outline" onClick={loadConfig} disabled={loading} className="ml-auto gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Pricing toggle card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Pricing Enforcement</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {pricingEnabled
                ? "Pricing is ON — users are gated by their plan. Only features included in their plan are accessible."
                : "Pricing is OFF — all users have full access to every feature regardless of plan."}
            </p>
          </div>

          {loading ? (
            <div className="h-12 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`w-full h-12 rounded-xl font-semibold text-sm transition-all ${
                pricingEnabled
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {saving ? "Saving..." : pricingEnabled ? "Turn Pricing OFF" : "Turn Pricing ON"}
            </button>
          )}

          <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${
            pricingEnabled ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"
          }`}>
            <div className={`w-2 h-2 rounded-full ${pricingEnabled ? "bg-green-500" : "bg-muted-foreground/50"}`} />
            {pricingEnabled ? "Pricing is active" : "Pricing is disabled — open access"}
          </div>
        </div>
      </div>
    </div>
  );
}