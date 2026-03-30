import React, { useEffect } from "react";
import { TreePine } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      base44.auth.redirectToLogin("/select-role");
    } else if (user?.role === "coach") {
      window.location.href = "/coach";
    } else if (user?.role === "athlete") {
      window.location.href = "/athlete";
    } else {
      window.location.href = "/select-role";
    }
  }, [isLoadingAuth, isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <TreePine className="w-6 h-6 text-primary" />
        </div>
        <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );
}