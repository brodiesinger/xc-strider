import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreePine } from "lucide-react";

export default function JoinTeam({ onTeamJoined }) {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const teams = await base44.entities.Team.filter({ join_code: code.trim().toUpperCase() });
      if (teams.length === 0) {
        setError("Invalid join code. Please check with your coach.");
        return;
      }
      const team = teams[0];
      await base44.auth.updateMe({ team_id: team.id });
      onTeamJoined(team);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2 text-primary font-bold mb-8">
        <TreePine className="w-5 h-5" />
        XC Team App
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-sm">
        <h1 className="text-xl font-bold text-foreground mb-1">Join Your Team</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter the join code from your coach to get started.
        </p>
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Join Code</Label>
            <Input
              id="code"
              placeholder="e.g. ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="font-mono uppercase tracking-widest"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Joining..." : "Join Team"}
          </Button>
        </form>
      </div>
    </div>
  );
}