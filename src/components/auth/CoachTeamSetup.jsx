import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CoachTeamSetup({ onComplete, onBack }) {
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSaving(true);
    try {
      const user = await base44.auth.me();
      const joinCode = generateJoinCode();
      const team = await base44.entities.Team.create({
        name: teamName.trim(),
        join_code: joinCode,
        coach_email: user.email,
      });
      await base44.auth.updateMe({ role: "coach", team_id: team.id });
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create Your Team</h1>
        <p className="text-muted-foreground mt-2">Set up your coaching team to get started.</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Team Name</label>
          <Input
            placeholder="e.g. Central High XC"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="text-muted-foreground">
            Athletes will use a <span className="font-semibold text-foreground">unique join code</span> to connect to your team.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!teamName.trim() || saving}
        >
          {saving ? "Creating..." : "Create Team"}
        </Button>
      </form>
    </motion.div>
  );
}