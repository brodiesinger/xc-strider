import React from "react";
import { motion } from "framer-motion";
import { TreePine, Timer, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const features = [
  {
    icon: Timer,
    title: "Race Tracking",
    description: "Log times, splits, and personal records across every meet.",
  },
  {
    icon: Users,
    title: "Team Roster",
    description: "Manage athletes, coaches, and season rosters in one place.",
  },
  {
    icon: TrendingUp,
    title: "Performance",
    description: "Visualize progress and trends throughout the season.",
  },
];

export default function Home() {
  const login = () => base44.auth.redirectToLogin("/dashboard");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <TreePine className="w-4 h-4" />
            XC Team App
          </div>
          <Button size="sm" onClick={login} className="rounded-lg">
            Sign in
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-wide uppercase">
            <TreePine className="w-3.5 h-3.5" />
            Cross Country
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Your team's home base
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Track workouts, manage your roster, and watch your runners improve — all in one place.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={login} className="w-full sm:w-auto px-8 rounded-xl gap-2">
              Get started
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={login} className="w-full sm:w-auto px-8 rounded-xl">
              Sign in
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 XC Team App</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Connected
          </span>
        </div>
      </footer>
    </div>
  );
}