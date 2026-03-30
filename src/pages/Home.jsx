import React from "react";
import { TreePine, Users, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const handleCoachSignIn = async () => {
    sessionStorage.setItem("intended_role", "coach");
    base44.auth.redirectToLogin("/coach");
  };

  const handleAthleteSignIn = async () => {
    sessionStorage.setItem("intended_role", "athlete");
    base44.auth.redirectToLogin("/athlete");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-sm w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">XC Team App</h1>
          <p className="text-muted-foreground text-sm">
            Track workouts, manage your roster, and crush your season.
          </p>
        </div>

        {/* Role Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={handleCoachSignIn}
            className="w-full rounded-xl border-2 border-border p-5 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Coach Sign In</p>
                <p className="text-xs text-muted-foreground">Create and manage your team</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleAthleteSignIn}
            className="w-full rounded-xl border-2 border-border p-5 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Athlete Sign In</p>
                <p className="text-xs text-muted-foreground">Join your team and track progress</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}