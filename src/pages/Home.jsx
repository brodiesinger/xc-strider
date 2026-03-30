import React from "react";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function Home() {
  const handleSignIn = () => {
    base44.auth.redirectToLogin("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">XC Team App</h1>
          <p className="text-muted-foreground text-sm">
            Track workouts, manage your roster, and crush your season.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleSignIn}>
            Sign In
          </Button>
          <Button variant="outline" className="w-full" onClick={handleSignIn}>
            Sign Up
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Athletes and coaches sign in with the same button.
        </p>
      </div>
    </div>
  );
}