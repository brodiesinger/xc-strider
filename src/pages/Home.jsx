import React, { useState } from "react";
import { motion } from "framer-motion";
import { TreePine, Timer, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const features = [
  {
    icon: Timer,
    title: "Race Tracking",
    description: "Log times, splits, and personal records across every meet.",
  },
  {
    icon: Users,
    title: "Team Roster",
    description: "Manage athletes, coaches, and season rosters in one place.",
  },
  {
    icon: TrendingUp,
    title: "Performance",
    description: "Visualize progress and trends throughout the season.",
  },
];

export default function Home() {
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [setupStep, setSetupStep] = useState(null); // "role", "teamName", or null

  const handleGetStarted = () => {
    setShowRoleSelect(true);
    setSetupStep("role");
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === "coach") {
      setSetupStep("teamName");
    } else {
      // Athletes go straight to login
      sessionStorage.setItem("selectedRole", "athlete");
      base44.auth.redirectToLogin("/athlete");
    }
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    sessionStorage.setItem("selectedRole", "coach");
    sessionStorage.setItem("teamName", teamName);
    try {
      await base44.auth.updateMe({ role: "coach" });
    } catch (err) {
      // User not authenticated yet, will set role after login
    }
    base44.auth.redirectToLogin("/coach");
  };

  if (showRoleSelect && setupStep) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold text-base">
              <TreePine className="w-4 h-4" />
              XC Team App
            </div>
            <Button size="sm" onClick={() => base44.auth.redirectToLogin("/")} className="rounded-lg">
              Sign in
            </Button>
          </div>
        </header>

        <section className="flex-1 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-6"
          >
            <button
              onClick={() => {
                setShowRoleSelect(false);
                setSetupStep(null);
                setSelectedRole(null);
                setTeamName("");
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>

            {setupStep === "role" && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Choose your role</h1>
                  <p className="text-muted-foreground mt-1">What are you signing up as?</p>
                </div>

                <button
                  onClick={() => handleRoleSelect("athlete")}
                  className="w-full rounded-xl border-2 border-border p-6 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <h3 className="font-semibold text-foreground text-lg">Athlete</h3>
                  <p className="text-sm text-muted-foreground mt-1">Join a team with a coach</p>
                </button>

                <button
                  onClick={() => handleRoleSelect("coach")}
                  className="w-full rounded-xl border-2 border-border p-6 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <h3 className="font-semibold text-foreground text-lg">Coach</h3>
                  <p className="text-sm text-muted-foreground mt-1">Create a team and manage athletes</p>
                </button>
              </div>
            )}

            {setupStep === "teamName" && (
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Create Your Team</h2>
                  <p className="text-sm text-muted-foreground mt-1">What's your team name?</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Team Name</label>
                  <input
                    type="text"
                    placeholder="E.g. Varsity XC"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm"
                    required
                  />
                </div>

                <Button type="submit" className="w-full rounded-lg">
                  Continue to Sign Up
                </Button>
              </form>
            )}
          </motion.div>
        </section>
      </div>
    );
  }

  const signup = () => handleGetStarted();
  const login = () => base44.auth.redirectToLogin("/");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <TreePine className="w-4 h-4" />
            XC Team App
          </div>
          <Button size="sm" onClick={login} className="rounded-lg">
            Sign in
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-wide uppercase">
            <TreePine className="w-3.5 h-3.5" />
            Cross Country
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Your team's home base
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Track workouts, manage your roster, and watch your runners improve — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={signup} className="w-full sm:w-auto px-8 rounded-xl gap-2">
              Get started
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={login} className="w-full sm:w-auto px-8 rounded-xl">
              Sign in
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Choose your role and you'll be directed to the right dashboard.
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 XC Team App</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Connected
          </span>
        </div>
      </footer>
    </div>
  );
}