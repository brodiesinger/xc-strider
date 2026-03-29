import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Copy, CheckCircle2, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [athleteCode, setAthleteCode] = useState("");
  const [coachCode, setCoachCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coachCreated, setCoachCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);

        if (me.role && me.role !== "") {
          if (me.role === "coach") {
            navigate("/coach");
          } else if (me.role === "athlete") {
            navigate("/athlete");
          }
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleAthleteSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!athleteCode.trim()) {
      setError("Please enter a join code");
      return;
    }
    setSubmitting(true);
    try {
      const teams = await base44.entities.Team.list().catch(() => []);
      const team = teams.find((t) => t.join_code === athleteCode.toUpperCase());
      if (!team) {
        setError("Invalid join code");
        setSubmitting(false);
        return;
      }
      await base44.auth.updateMe({ role: "athlete", team_id: team.id });
      navigate("/athlete");
    } catch (err) {
      setError("Failed to join team");
      setSubmitting(false);
    }
  };

  const handleCoachSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }
    setSubmitting(true);
    try {
      const code = generateCode();
      const newTeam = await base44.entities.Team.create({
        name: teamName,
        join_code: code,
        coach_email: user.email,
      });
      if (newTeam && newTeam.id) {
        await base44.auth.updateMe({ role: "coach", team_id: newTeam.id });
        setCoachCode(code);
        setCoachCreated(true);
        setSubmitting(false);
      } else {
        setError("Team creation failed - invalid response");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Team creation error:", err);
      setError(err.message || "Failed to create team");
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(coachCode);
  };

  const handleContinueAsCoach = () => {
    navigate("/coach");
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <div className="flex items-center gap-2 text-primary font-bold">
            <TreePine className="w-4 h-4" />
            XC Team App
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {!mode ? (
            <div className="space-y-4">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
                <p className="text-muted-foreground mt-2">Choose your role</p>
              </div>

              <button
                onClick={() => setMode("athlete")}
                className="w-full rounded-xl border-2 border-border p-6 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold text-foreground text-lg">Athlete Sign Up</h3>
                <p className="text-sm text-muted-foreground mt-1">Join a team with a coach</p>
              </button>

              <button
                onClick={() => setMode("coach")}
                className="w-full rounded-xl border-2 border-border p-6 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <h3 className="font-semibold text-foreground text-lg">Coach Sign Up</h3>
                <p className="text-sm text-muted-foreground mt-1">Create a team and manage athletes</p>
              </button>
            </div>
          ) : mode === "athlete" ? (
            <div className="space-y-6">
              <button
                onClick={() => setMode(null)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back
              </button>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Athlete Sign Up</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter your team's join code</p>
              </div>

              <form onSubmit={handleAthleteSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Team Join Code</Label>
                  <Input
                    placeholder="E.g. ABC123"
                    value={athleteCode}
                    onChange={(e) => setAthleteCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Joining..." : "Join Team"}
                </Button>
              </form>
            </div>
          ) : mode === "coach" ? (
            <div className="space-y-6">
              <button
                onClick={() => setMode(null)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back
              </button>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Coach Sign Up</h2>
                <p className="text-sm text-muted-foreground mt-1">Create your team</p>
              </div>

              <form onSubmit={handleCoachSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Team Name</Label>
                  <Input
                    placeholder="E.g. varsity XC"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Creating..." : "Create Team"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground">Team Created!</h2>
                <p className="text-sm text-muted-foreground mt-2">Share this code with your athletes</p>
              </div>

              <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground mb-2">Join Code</p>
                <p className="text-4xl font-bold text-primary text-center font-mono">{coachCode}</p>
              </div>

              <Button onClick={copyCode} variant="outline" className="w-full gap-2">
                <Copy className="w-4 h-4" />
                Copy Code
              </Button>

              <Button onClick={handleContinueAsCoach} className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}