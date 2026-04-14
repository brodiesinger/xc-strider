import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Settings, Copy, LogOut, ChevronRight, FileText, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TeamCustomization from "@/components/coach/TeamCustomization";
import DarkModeToggle from "@/components/shared/DarkModeToggle";
import { getDisplayName, generateDisplayName } from "@/lib/displayName";
import { isDemo } from "@/lib/billing";

export default function CoachSettingsTab({ user, team, onTeamUpdated, onUserUpdated, isDark, onToggleDark }) {
  const [copied, setCopied] = useState(false);
  const [editName, setEditName] = useState("");
  const [showEditName, setShowEditName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async (e) => {
    e.preventDefault();
    const parts = editName.trim().split(/\s+/);
    if (parts.length < 2) {
      alert("Please enter both first and last name.");
      return;
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    setSavingName(true);
    try {
      const updated = await base44.auth.updateMe({
        first_name: firstName,
        last_name: lastName,
        display_name: generateDisplayName(firstName, lastName, user?.user_type),
      });
      onUserUpdated?.(updated);
      setShowEditName(false);
      setEditName("");
    } finally {
      setSavingName(false);
    }
  };

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{getDisplayName(user)}</p>
        </div>
        {isDemo(team) && (
          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mt-1 shrink-0">
            <Zap className="w-3 h-3" /> Demo
          </span>
        )}
      </div>

      {/* Profile */}
       <section>
         <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Profile</h2>
         <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
           <div className="space-y-1">
             <p className="text-xs text-muted-foreground">Display Name</p>
             <p className="font-semibold text-foreground">{getDisplayName(user)}</p>
           </div>
           {showEditName ? (
             <form onSubmit={handleSaveName} className="space-y-2 pt-2 border-t border-border">
               <Input
                 type="text"
                 placeholder="e.g. John Smith"
                 value={editName}
                 onChange={(e) => setEditName(e.target.value)}
                 defaultValue={`${user?.first_name || ""} ${user?.last_name || ""}`.trim()}
                 autoFocus
               />
               <div className="flex gap-2">
                 <Button type="submit" size="sm" disabled={savingName || !editName.trim()}>
                   {savingName ? "Saving..." : "Save Name"}
                 </Button>
                 <Button type="button" size="sm" variant="outline" onClick={() => { setShowEditName(false); setEditName(""); }}>
                   Cancel
                 </Button>
               </div>
             </form>
           ) : (
             <Button type="button" size="sm" variant="outline" onClick={() => { setEditName(`${user?.first_name || ""} ${user?.last_name || ""}`.trim()); setShowEditName(true); }} className="w-full mt-2">
               Edit Name
             </Button>
             )}
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
          {team && (
            <Link
              to="/packet"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">End-of-Season Packet</span>
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