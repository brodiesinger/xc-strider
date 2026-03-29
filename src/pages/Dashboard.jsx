import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TreePine, LogOut, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleLogout = () => base44.auth.logout("/");

  const dashboardPath = user?.role === "coach" ? "/coach" : "/athlete";
  const dashboardLabel = user?.role === "coach" ? "Coach Dashboard" : "Athlete Dashboard";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <TreePine className="w-5 h-5" />
            XC Team App
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {user ? (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome, {user.full_name || user.email}
              </h1>
              <p className="text-sm text-muted-foreground capitalize mb-10">
                Role: {user.role || "athlete"}
              </p>

              <Link to={dashboardPath}>
                <Button className="gap-2">
                  Go to {dashboardLabel}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}