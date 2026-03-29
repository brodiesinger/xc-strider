import React from "react";
import { motion } from "framer-motion";
import { TreePine, Timer, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 md:pt-36 md:pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <TreePine className="w-4 h-4" />
              Cross Country
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
              XC Team App
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The home base for your cross-country team — track workouts,
              manage your roster, and watch your runners improve.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              size="lg"
              className="px-8"
              onClick={() => base44.auth.redirectToLogin("/dashboard")}
            >
              Sign In
            </Button>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="px-8">
                Go to Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="mt-12 mx-auto h-px w-48 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
              className="group rounded-2xl border border-border bg-card p-8 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <span>© 2026 XC Team App</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Connected
          </span>
        </div>
      </footer>
    </div>
  );
}