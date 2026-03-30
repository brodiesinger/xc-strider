import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SelectRole() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("role"); // "role" | "join"
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  const handleCoach = async () => {
    setSaving(true);
    await base44.auth.updateMe({ user_type: "coach" });
    navigate("/coach");
  };

  const handleAthleteRole = () => {
    setStep("join");
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // Find team by join code
      const teams = await base44.entities.Team.filter({ join_code: joinCode.trim().toUpperCase() });
      if (!teams || teams.length === 0) {
        setError("Invalid join code. Please check with your coach and try again.");
        setSaving(false);
        return;
      }
      const team = teams[0];
      // Save user type and team_id
      await base44.auth.updateMe({ user_type: "athlete", team_id: team.id });
      navigate("/athlete");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  if (step === "join") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-xs">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <TreePine className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Join Your Team</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter the join code your coach gave you
            </p>
          </div>

          <form onSubmit={handleJoinTeam} className="w-full space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="join-code">Team Join Code</Label>
              <Input
                id="join-code"
                type="text"
                placeholder="e.g. ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="text-center text-lg font-bold tracking-widest uppercase"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={saving || !joinCode.trim()} className="w-full h-12">
              {saving ? "Joining..." : "Join Team"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => { setStep("role"); setError(""); setJoinCode(""); }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Who are you?</h1>
          <p className="text-sm text-muted-foreground text-center">Select your role to continue</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={handleCoach}
            disabled={saving}
            className="w-full h-14 text-base"
          >
            I am a Coach
          </Button>
          <Button
            onClick={handleAthleteRole}
            disabled={saving}
            variant="outline"
            className="w-full h-14 text-base"
          >
            I am an Athlete
          </Button>
        </div>
      </div>
    </div>
  );
}