import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import RoleSetup from "@/components/auth/RoleSetup";
import NavBar from "@/components/shared/NavBar";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleRoleComplete = async () => {
    const me = await base44.auth.me();
    setUser(me);
  };

  const handleLogout = () => base44.auth.logout("/");

  // Show spinner while loading
  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // New users with no role — prompt role selection
  if (!user.role) {
    return <RoleSetup onComplete={handleRoleComplete} />;
  }

  const dashboardPath = user.role === "coach" ? "/coach" : "/athlete";
  const dashboardLabel = user.role === "coach" ? "Coach Dashboard" : "Athlete Dashboard";

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {user.full_name || user.email}
          </h1>
          <p className="text-sm text-muted-foreground capitalize mb-10">
            Role: {user.role}
          </p>
          <Link to={dashboardPath}>
            <Button className="gap-2">
              Go to {dashboardLabel}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}