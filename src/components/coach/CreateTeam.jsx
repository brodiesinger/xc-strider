import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateTeam({ user, onTeamCreated }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const join_code = generateCode();
    const team = await base44.entities.Team.create({
      name,
      join_code,
      coach_email: user.email,
    });
    await base44.auth.updateMe({ team_id: team.id });
    onTeamCreated(team);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-semibold text-foreground mb-1">Create a Team</h2>
      <p className="text-sm text-muted-foreground mb-5">
        You're not on a team yet. Create one and share the join code with your athletes.
      </p>
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="team-name">Team Name</Label>
          <Input
            id="team-name"
            placeholder="e.g. Lincoln XC 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Creating..." : "Create Team"}
        </Button>
      </form>
    </div>
  );
}