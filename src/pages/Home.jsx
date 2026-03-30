import React, { useEffect } from "react";
import { TreePine } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      base44.auth.redirectToLogin("/select-role");
    } else if (user?.role === "coach") {
      navigate("/coach", { replace: true });
    } else if (user?.role === "athlete") {
      navigate("/athlete", { replace: true });
    } else {
      navigate("/select-role", { replace: true });
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