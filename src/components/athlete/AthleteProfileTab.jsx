import React, { useState } from "react";
import { LogOut, Users, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TeamDashboardView from "@/components/shared/TeamDashboardView";
import DarkModeToggle from "@/components/shared/DarkModeToggle";
import { getDisplayName } from "@/lib/displayName";

export default function AthleteProfileTab({ user, team, announcements, schedule, isDark, onToggleDark, onUserUpdated }) {
  const [copied, setCopied] = useState(false);

  const handleLogout = () => base44.auth.logout("/");

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(team?.join_code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
      </div>

      {/* Profile */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Profile</h2>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-semibold text-foreground">{getDisplayName(user)}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
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