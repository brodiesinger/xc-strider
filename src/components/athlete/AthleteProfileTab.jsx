import React, { useState } from "react";
import { LogOut, Users, Copy, Pencil, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TeamDashboardView from "@/components/shared/TeamDashboardView";
import DarkModeToggle from "@/components/shared/DarkModeToggle";
import { Input } from "@/components/ui/input";

export default function AthleteProfileTab({ user, team, announcements, schedule, isDark, onToggleDark, onUserUpdated }) {
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.full_name || "");
  const [savingName, setSavingName] = useState(false);

  const handleLogout = () => base44.auth.logout("/");

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(team?.join_code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    try {
      const newName = nameValue.trim();
      await base44.auth.updateMe({ full_name: newName });
      // Update athlete_name on all existing workout records so coach sees updated name
      if (user?.email) {
        const workouts = await base44.entities.Workout.filter({ athlete_email: user.email }, "-date", 500);
        await Promise.all(workouts.map((w) => base44.entities.Workout.update(w.id, { athlete_name: newName })));
      }
      onUserUpdated?.({ ...user, full_name: newName });
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
      </div>

      {/* Profile Name */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Profile</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Display Name</p>
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
              />
              <button onClick={handleSaveName} disabled={savingName} className="text-primary hover:opacity-70">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => { setEditingName(false); setNameValue(user?.full_name || ""); }} className="text-muted-foreground hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{user?.full_name || <span className="text-muted-foreground italic">Not set</span>}</p>
              <button onClick={() => { setNameValue(user?.full_name || ""); setEditingName(true); }} className="text-primary hover:opacity-70">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Team Info */}
      {team && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Team</h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Team</p>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> {team.name}
                </p>
              </div>
            </div>
            {team.join_code && (
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Join Code</p>
                  <p className="font-bold text-primary tracking-widest text-lg">{team.join_code}</p>
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Team Dashboard */}
      {team && (
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Team Updates</h2>
          <TeamDashboardView announcements={announcements} schedule={schedule} />
        </section>
      )}

      {/* Appearance */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Appearance</h2>
        <div className="rounded-2xl border border-border bg-card">
          <DarkModeToggle isDark={isDark} onToggle={onToggleDark} />
        </div>
      </section>

      {/* Sign Out */}
      <section>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Sign Out</span>
          </button>
        </div>
      </section>
    </div>
  );
}