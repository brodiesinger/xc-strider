import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import { TreePine, UserCircle, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function OnboardingShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground text-center">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, refresh } = useCurrentUser();

  // step: "name" | "role" | "create-team" | "join-team"
  const [step, setStep] = useState(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(null); // "coach" | "athlete"
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    // Determine where to start based on what's already set
    const hasName = isRealName(currentUser.full_name);
    const hasRole = currentUser.user_type === "coach" || currentUser.user_type === "athlete";

    if (!hasName) {
      setStep("name");
    } else if (!hasRole) {
      setFullName(currentUser.full_name);
      setStep("role");
    } else if (currentUser.user_type === "coach" && !currentUser.team_id) {
      setFullName(currentUser.full_name);
      setRole("coach");
      setStep("create-team");
    } else if (currentUser.user_type === "athlete" && !currentUser.team_id) {
      setFullName(currentUser.full_name);
      setRole("athlete");
      setStep("join-team");
    } else {
      // Fully onboarded — route to dashboard
      routeToDashboard(currentUser.user_type);
    }
  }, [currentUser]);

  const isRealName = (name) => {
    const n = name?.trim();
    return n && !n.includes("@") && n.includes(" ");
  };

  const routeToDashboard = (userType) => {
    navigate(userType === "coach" ? "/coach" : "/athlete");
  };

  // Step 1: Save full name
  const handleNameSubmit = async (e) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed.includes(" ")) {
      setError("Please enter your first and last name.");
      return;
    }
    setError("");
    setSaving(true);
    await base44.auth.updateMe({ full_name: trimmed });
    await refresh();
    setStep("role");
    setSaving(false);
  };

  // Step 2: Select role
  const handleRoleSelect = async (selectedRole) => {
    setRole(selectedRole);
    setSaving(true);
    await base44.auth.updateMe({ user_type: selectedRole });
    await refresh();
    setSaving(false);
    if (selectedRole === "coach") {
      setStep("create-team");
    } else {
      setStep("join-team");
    }
  };

  // Step 3a: Coach creates team
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const name = teamName.trim();
    if (!name) return;
    setError("");
    setSaving(true);
    // Generate a random 6-char join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const team = await base44.entities.Team.create({
      name,
      join_code: joinCode,
      coach_email: currentUser.email,
    });
    await base44.auth.updateMe({ team_id: team.id });
    await refresh();
    navigate("/coach");
  };

  // Step 3b: Athlete joins team
  const handleJoinTeam = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setError("");
    setSaving(true);
    const teams = await base44.entities.Team.filter({ join_code: code });
    if (!teams || teams.length === 0) {
      setError("Invalid join code. Check with your coach and try again.");
      setSaving(false);
      return;
    }
    await base44.auth.updateMe({ team_id: teams[0].id });
    await refresh();
    navigate("/athlete");
  };

  if (step === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (step === "name") {
    return (
      <OnboardingShell title="What's your name?" subtitle="Enter your full name so your team can recognize you.">
        <form onSubmit={handleNameSubmit} className="w-full space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              type="text"
              placeholder="e.g. Sarah Johnson"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(""); }}
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving || !fullName.trim()} className="w-full h-11">
            {saving ? "Saving..." : "Continue"}
          </Button>
        </form>
      </OnboardingShell>
    );
  }

  if (step === "role") {
    return (
      <OnboardingShell title="Who are you?" subtitle="Select your role to get started.">
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => !saving && handleRoleSelect("coach")}
            disabled={saving}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">I'm a Coach</p>
              <p className="text-sm text-muted-foreground">Create and manage your team</p>
            </div>
          </button>

          <button
            onClick={() => !saving && handleRoleSelect("athlete")}
            disabled={saving}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">I'm an Athlete</p>
              <p className="text-sm text-muted-foreground">Join your coach's team</p>
            </div>
          </button>
        </div>
      </OnboardingShell>
    );
  }

  if (step === "create-team") {
    return (
      <OnboardingShell title="Create Your Team" subtitle="Set up your team so athletes can join.">
        <form onSubmit={handleCreateTeam} className="w-full space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              type="text"
              placeholder="e.g. Lincoln High XC"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving || !teamName.trim()} className="w-full h-11">
            {saving ? "Creating..." : "Create Team"}
          </Button>
        </form>
      </OnboardingShell>
    );
  }

  if (step === "join-team") {
    return (
      <OnboardingShell title="Join Your Team" subtitle="Enter the join code your coach gave you.">
        <form onSubmit={handleJoinTeam} className="w-full space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="join-code">Team Join Code</Label>
            <Input
              id="join-code"
              type="text"
              placeholder="e.g. ABC123"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value); setError(""); }}
              className="text-center text-lg font-bold tracking-widest uppercase"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving || !joinCode.trim()} className="w-full h-11">
            {saving ? "Joining..." : "Join Team"}
          </Button>
        </form>
      </OnboardingShell>
    );
  }

  return null;
}