import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TreePine, LogOut, User, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleLogout = () => base44.auth.logout("/");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
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

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {user ? (
            <>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Welcome, {user.full_name || user.email}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    <span className="text-sm text-muted-foreground capitalize">
                      {user.role || "athlete"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-semibold text-card-foreground mb-1">Account</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-semibold text-card-foreground mb-1">Role</h2>
                  <p className="text-sm text-muted-foreground capitalize">{user.role || "athlete"}</p>
                </div>
              </div>
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