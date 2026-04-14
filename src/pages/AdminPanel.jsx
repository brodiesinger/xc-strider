import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import { Shield, RefreshCw, Check, ChevronDown, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const BILLING_STATUSES = ["trial", "active", "demo", "inactive"];
const PLANS = ["starter", "team", "elite"];

const STATUS_COLORS = {
  active:   "bg-green-100 text-green-700",
  trial:    "bg-blue-100 text-blue-700",
  demo:     "bg-purple-100 text-purple-700",
  inactive: "bg-red-100 text-red-700",
};

function TeamRow({ team, onSaved }) {
  const [status, setStatus] = useState(team.billing_status || "trial");
  const [plan, setPlan] = useState(team.plan || "starter");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toggling, setToggling] = useState(false);

  const dirty = status !== (team.billing_status || "trial") || plan !== (team.plan || "starter");
  const isDemo = status === "demo";

  const handleSave = async (overrideStatus, overridePlan) => {
    const newStatus = overrideStatus ?? status;
    const newPlan = overridePlan ?? plan;
    setSaving(true);
    try {
      await base44.entities.Team.update(team.id, { billing_status: newStatus, plan: newPlan });
      setStatus(newStatus);
      setPlan(newPlan);
      setSaved(true);
      onSaved(team.id, { billing_status: newStatus, plan: newPlan });
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDemoToggle = async () => {
    setToggling(true);
    const next = isDemo ? "active" : "demo";
    await handleSave(next, plan);
    setToggling(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border last:border-0">
      {/* Team info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{team.name}</p>
        <p className="text-xs text-muted-foreground truncate">{team.coach_email}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Demo toggle — one click */}
        <button
          onClick={handleDemoToggle}
          disabled={toggling}
          title={isDemo ? "Switch to active" : "Switch to demo"}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all ${
            isDemo
              ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"
              : "bg-muted text-muted-foreground border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
          }`}
        >
          {isDemo ? <RotateCcw className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          {toggling ? "..." : isDemo ? "→ active" : "demo"}
        </button>

        {/* Billing Status */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
            className={`appearance-none text-xs font-semibold pl-2.5 pr-6 py-1.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring ${STATUS_COLORS[status]} border-transparent`}
          >
            {BILLING_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
        </div>

        {/* Plan */}
        <div className="relative">
          <select
            value={plan}
            onChange={(e) => { setPlan(e.target.value); setSaved(false); }}
            className="appearance-none text-xs font-medium pl-2.5 pr-6 py-1.5 rounded-full border border-border bg-muted text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PLANS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
        </div>

        {/* Save button */}
        <Button
          size="sm"
          onClick={() => handleSave()}
          disabled={saving || !dirty}
          className="text-xs h-7 px-3 rounded-full"
          variant={saved ? "outline" : "default"}
        >
          {saved ? (
            <><Check className="w-3 h-3 mr-1 text-green-600" /><span className="text-green-600">Saved</span></>
          ) : saving ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!currentUser) { navigate("/"); return; }
    if (currentUser.role !== "admin") { navigate("/"); return; }
  }, [currentUser]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Team.list("-created_date", 200);
      setTeams(all || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") loadTeams();
  }, [currentUser]);

  const handleSaved = (id, updates) => {
    setTeams((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  };

  const filtered = teams.filter((t) =>
    !search ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.coach_email?.toLowerCase().includes(search.toLowerCase())
  );

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">{teams.length} teams</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={loadTeams} disabled={loading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search teams or coaches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />

        {/* Teams list */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No teams found.</p>
          ) : (
            filtered.map((team) => (
              <TeamRow key={team.id} team={team} onSaved={handleSaved} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}