import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser, getOnboardingStep } from "@/lib/CurrentUserContext";
import { generateDisplayName } from "@/lib/displayName";
import { TreePine, Users, Trophy } from "lucide-react";
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

  // Pre-fill with existing full_name only if it doesn't look like an email
  const existingName = currentUser?.full_name ?? "";
  const [fullName, setFullName] = useState(existingName.includes("@") ? "" : existingName);
  const resolvedFullName = fullName.trim() || currentUser?.full_name?.trim() || "";
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Derive step directly from currentUser every render — no stale local step state
  const step = getOnboardingStep(currentUser);

  useEffect(() => {
    if (step === "unauthenticated") {
      navigate("/");
      return;
    }
    if (step === null) {
      // Fully onboarded — go to dashboard
      navigate(currentUser.user_type === "coach" ? "/coach" : "/athlete");
    }
  }, [step, currentUser]);

  // ── Step 1: Full name ──────────────────────────────────────────
  const handleNameSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      // Generate display_name using current role if already set
      await base44.auth.updateMe({
        full_name: trimmed,
        name_confirmed: true,
        display_name: generateDisplayName(trimmed, currentUser?.user_type),
      });
      await refresh(); // refresh context → useEffect drives navigation
    } catch (err) {
      console.error("Failed to save name:", err);
      setError("Failed to save name. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Step 2: Role selection ─────────────────────────────────────
  const handleRoleSelect = async (selectedRole) => {
    if (saving) return;
    setSaving(true);
    try {
      // Also regenerate display_name now that we know the role
      await base44.auth.updateMe({
        user_type: selectedRole,
        full_name: resolvedFullName || currentUser?.full_name,
        name_confirmed: true,
        display_name: generateDisplayName(resolvedFullName || currentUser?.full_name, selectedRole),
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  // ── Step 3a: Coach creates team ────────────────────────────────
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const name = teamName.trim();
    if (!name) return;
    setError("");
    setSaving(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const team = await base44.entities.Team.create({
        name,
        join_code: code,
        coach_email: currentUser.email,
      });
      if (!team?.id) throw new Error("Team creation failed.");
      await base44.auth.updateMe({ team_id: team.id });
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to create team. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Step 3b: Athlete joins team ────────────────────────────────
  const handleJoinTeam = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setError("");
    setSaving(true);
    try {
      const teams = await base44.entities.Team.filter({ join_code: code });
      if (!teams || teams.length === 0) {
        setError("Invalid join code. Check with your coach and try again.");
        setSaving(false);
        return;
      }
      await base44.auth.updateMe({ team_id: teams[0].id });
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to join team. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // While saving, show a subtle spinner overlay so the user knows something is happening
  // but we don't unmount the current step view (prevents flicker)
  if (step === null || step === "unauthenticated") {
    // Navigating — show nothing to avoid a flash
    return null;
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
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={saving || !fullName.trim()}
            className="w-full h-11"
          >
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
            onClick={() => handleRoleSelect("coach")}
            disabled={saving}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50"
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
            onClick={() => handleRoleSelect("athlete")}
            disabled={saving}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">I'm an Athlete</p>
              <p className="text-sm text-muted-foreground">Join your coach's team</p>
            </div>
          </button>

          {saving && <p className="text-sm text-center text-muted-foreground">Saving...</p>}
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
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
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