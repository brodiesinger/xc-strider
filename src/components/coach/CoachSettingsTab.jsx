import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Copy, Check, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function CoachSettingsTab({ user, team }) {
  const [copied, setCopied] = React.useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(team?.join_code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleLogout = () => base44.auth.logout("/");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
      </div>

      {/* Team Info */}
      {team && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-foreground">Team Info</h2>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Team Name</p>
            <p className="text-sm font-medium text-foreground">{team.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Join Code</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary tracking-widest">{team.join_code}</span>
              <button
                onClick={copyCode}
                className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-primary" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Share with athletes to join your team.</p>
          </div>
          <Link
            to="/team-settings"
            className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
          >
            <Settings className="w-4 h-4" />
            Edit Team Settings
          </Link>
        </div>
      )}

      {/* Account */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Account</h2>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Name</p>
          <p className="text-sm font-medium text-foreground">{user?.full_name || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Email</p>
          <p className="text-sm font-medium text-foreground">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Role</p>
          <p className="text-sm font-medium text-foreground capitalize">{user?.user_type || "Coach"}</p>
        </div>
      </div>

      <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleLogout}>
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}