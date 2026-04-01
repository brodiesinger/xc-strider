import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import NavBar from "@/components/shared/NavBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TeamSettings() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user?.team_id) { setLoading(false); return; }
    base44.entities.Team.get(user.team_id)
      .then((t) => { if (t) { setTeam(t); setName(t.name); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.team_id]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !team) return;
    setSaving(true);
    await base44.entities.Team.update(team.id, { name: name.trim() });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar title="Team Settings" />
      <main className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link
          to="/coach"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-6">Team Settings</h1>

        {!team ? (
          <p className="text-sm text-muted-foreground">No team found. Create a team first from the dashboard.</p>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lincoln XC 2026"
                  required
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </Button>
            </form>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-1">Join Code</p>
              <p className="text-2xl font-bold text-primary tracking-widest">{team.join_code}</p>
              <p className="text-xs text-muted-foreground mt-1">Share this code with athletes to join your team.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}