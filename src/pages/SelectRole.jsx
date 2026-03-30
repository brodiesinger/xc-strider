import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SelectRole() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSelect = async (role) => {
    setSaving(true);
    await base44.auth.updateMe({ role });
    if (role === "admin") {
      navigate("/coach");
    } else {
      navigate("/athlete");
    }
  };

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
            onClick={() => handleSelect("admin")}
            disabled={saving}
            className="w-full h-14 text-base"
          >
            I am a Coach
          </Button>
          <Button
            onClick={() => handleSelect("user")}
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