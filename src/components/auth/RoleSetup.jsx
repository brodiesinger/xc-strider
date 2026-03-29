import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { PersonStanding, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const roles = [
  {
    id: "athlete",
    label: "Athlete",
    icon: PersonStanding,
    description: "Log workouts, track races, and view your progress.",
  },
  {
    id: "coach",
    label: "Coach",
    icon: Trophy,
    description: "Manage the roster, assign workouts, and review performance.",
  },
];

export default function RoleSetup({ onComplete }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await base44.auth.updateMe({ role: selected });
    setSaving(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome to XC Team App</h1>
          <p className="text-muted-foreground mt-2">Choose your role to get started.</p>
        </div>

        <div className="space-y-3 mb-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`w-full text-left rounded-xl border p-5 transition-all flex items-start gap-4 ${
                selected === role.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  selected === role.id ? "bg-primary/15" : "bg-muted"
                }`}
              >
                <role.icon
                  className={`w-5 h-5 ${selected === role.id ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <div>
                <div className="font-semibold text-foreground">{role.label}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{role.description}</div>
              </div>
            </button>
          ))}
        </div>

        <Button
          className="w-full"
          disabled={!selected || saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Continue"}
        </Button>
      </motion.div>
    </div>
  );
}