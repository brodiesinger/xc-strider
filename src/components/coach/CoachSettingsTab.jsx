import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Copy, LogOut, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TeamCustomization from "@/components/coach/TeamCustomization";
import DarkModeToggle from "@/components/shared/DarkModeToggle";
import { getDisplayName } from "@/lib/displayName";

export default function CoachSettingsTab({ user, team, onTeamUpdated, onUserUpdated, isDark, onToggleDark }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(team?.join_code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleLogout = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{getDisplayName(user)}</p>
      </div>

      {/* Profile */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Profile</h2>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-semibold text-foreground">{getDisplayName(user)}</p>
          <p className="text-xs text-muted-foreground">{user?.full_name || "Unnamed User"}</p>
        </div>
      </section>

      {/* Join Code */}
      {team && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Team</h2>
          <div className="rounded-2xl border border-border bg-card">
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
          </div>
        </section>
      )}

      {/* Team Customization */}
      {team && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Team Customization</h2>
          <TeamCustomization team={team} onSaved={onTeamUpdated} />
        </section>
      )}

      {/* Appearance */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Appearance</h2>
        <div className="rounded-2xl border border-border bg-card">
          <DarkModeToggle isDark={isDark} onToggle={onToggleDark} />
        </div>
      </section>

      {/* Account Actions */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Account</h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {team && (
            <Link
              to="/team-settings"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Team Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
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