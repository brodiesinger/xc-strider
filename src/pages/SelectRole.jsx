import React, { useState } from "react";
import { TreePine, Trophy, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SelectRole() {
  const [saving, setSaving] = useState(false);

  const selectRole = async (role) => {
    setSaving(true);
    await base44.auth.updateMe({ role });
    // Redirect to the appropriate dashboard
    window.location.href = role === "coach" ? "/coach" : "/athlete";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-10 max-w-sm w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Who are you?</h1>
          <p className="text-muted-foreground text-sm">
            Select your role to get started.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            disabled={saving}
            onClick={() => selectRole("coach")}
            className="w-full rounded-xl border-2 border-border p-5 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">I'm a Coach</p>
                <p className="text-xs text-muted-foreground">Create and manage your team</p>
              </div>
            </div>
          </button>

          <button
            disabled={saving}
            onClick={() => selectRole("athlete")}
            className="w-full rounded-xl border-2 border-border p-5 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">I'm an Athlete</p>
                <p className="text-xs text-muted-foreground">Join your team and track progress</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}