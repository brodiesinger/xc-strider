import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, TreePine, Zap, Shield, Users, BarChart2, Bell, CalendarDays, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Free",
    price: { monthly: 0, annual: 0 },
    description: "Get started at no cost.",
    cta: "Start Free",
    ctaVariant: "outline",
    highlight: false,
    features: [
      "1 team",
      "Up to 15 athletes",
      "Workout logging",
      "Weekly schedule",
      "Team announcements",
      "Basic stats",
    ],
    missing: ["Meet management", "Lineup builder", "AI insights", "End-of-season packet", "Injury risk tracking"],
  },
  {
    name: "Coach Pro",
    price: { monthly: 12, annual: 9 },
    description: "Everything a varsity program needs.",
    cta: "Start Free Trial",
    ctaVariant: "default",
    highlight: true,
    badge: "Most Popular",
    features: [
      "1 team, unlimited athletes",
      "Full meet management",
      "Lineup builder (varsity & JV)",
      "Copy previous lineups & schedules",
      "AI injury risk & recovery insights",
      "End-of-season packet generator",
      "Athlete daily check-ins",
      "Race PRs & goal tracking",
      "Push & in-app notifications",
      "Athlete page builder",
      "Priority support",
    ],
    missing: [],
  },
  {
    name: "Program",
    price: { monthly: 29, annual: 22 },
    description: "For multi-team and large programs.",
    cta: "Contact Us",
    ctaVariant: "outline",
    highlight: false,
    features: [
      "Everything in Coach Pro",
      "Up to 5 teams",
      "Unified coach dashboard",
      "Cross-team analytics",
      "Bulk athlete import",
      "Custom team branding",
      "Dedicated onboarding",
      "Priority phone support",
    ],
    missing: [],
  },
];

const BENEFITS = [
  {
    icon: CalendarDays,
    title: "Built for the Season",
    description: "Plan every practice week, track meets, and manage lineups — all in one place designed around the XC calendar.",
  },
  {
    icon: BarChart2,
    title: "Data Your Athletes Can See",
    description: "Athletes track their own mileage, PRs, and goals. Coaches see the full picture. Everyone stays motivated.",
  },
  {
    icon: Shield,
    title: "Injury Risk Before It's a Problem",
    description: "AI-powered training load analysis flags overtraining and recovery needs before athletes break down.",
  },
  {
    icon: Users,
    title: "Varsity, JV — All Managed Together",
    description: "Assign, re-assign, and copy lineups across meets in seconds. No spreadsheets, no confusion.",
  },
  {
    icon: Bell,
    title: "Instant Team Communication",
    description: "Post announcements that reach every athlete immediately. No missed group texts or lost emails.",
  },
  {
    icon: Trophy,
    title: "End-of-Season Packets",
    description: "Generate a polished, printable season summary with stats, meet results, and athlete highlights in one click.",
  },
];

const FAQS = [
  {
    question: "Is there a free trial for Coach Pro?",
    answer: "Yes — every new account gets a 14-day free trial of Coach Pro with full access to all features. No credit card required.",
  },
  {
    question: "Can athletes use the app on their phones?",
    answer: "Absolutely. Athletes have their own mobile-first dashboard where they log workouts, view schedules, check goals, and track their race PRs.",
  },
  {
    question: "What happens to my data if I downgrade?",
    answer: "Your data is always safe. If you downgrade to Free, your historical meet and workout data is preserved — you just won't be able to add new meets or use Pro features until you upgrade again.",
  },
  {
    question: "Can I manage both boys and girls teams?",
    answer: "Yes. The lineup builder supports varsity and JV for both boys and girls within the same team. The Program plan supports up to 5 separate teams.",
  },
  {
    question: "Does this replace my current spreadsheets?",
    answer: "That's the goal. XC Team App handles scheduling, meet management, lineups, athlete stats, and season summaries — everything coaches currently manage across scattered tools.",
  },
  {
    question: "How does billing work?",
    answer: "Monthly plans bill each month. Annual plans bill once per year and save you ~25%. You can cancel any time and keep access through the end of your billing period.",
  },
];

function PricingCard({ plan, annual }) {
  const price = annual ? plan.price.annual : plan.price.monthly;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 shadow-sm transition-shadow hover:shadow-lg
        ${plan.highlight
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground"
        }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow">
          {plan.badge}
        </div>
      )}

      <div className="mb-5">
        <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {plan.name}
        </p>
        <div className="flex items-end gap-1 mb-1">
          {price === 0 ? (
            <span className="text-4xl font-extrabold">Free</span>
          ) : (
            <>
              <span className="text-4xl font-extrabold">${price}</span>
              <span className={`text-sm pb-1 ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>/mo</span>
            </>
          )}
        </div>
        {price > 0 && annual && (
          <p className={`text-xs ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            Billed annually · save ~25%
          </p>
        )}
        <p className={`text-sm mt-2 ${plan.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {plan.description}
        </p>
      </div>

      <Link to="/">
        <Button
          variant={plan.highlight ? "secondary" : plan.ctaVariant}
          className={`w-full mb-6 font-semibold ${plan.highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
        >
          {plan.cta}
        </Button>
      </Link>

      <ul className="space-y-2.5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-primary-foreground" : "text-primary"}`} />
            <span>{f}</span>
          </li>
        ))}
        {plan.missing.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm opacity-35">
            <span className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center text-xs">—</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-border rounded-xl overflow-hidden cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between px-5 py-4 bg-card hover:bg-muted/40 transition-colors">
        <p className="text-sm font-semibold text-foreground pr-4">{faq.question}</p>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-5 pb-4 pt-1 bg-card text-sm text-muted-foreground"
        >
          {faq.answer}
        </motion.div>
      )}
    </div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TreePine className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm">XC Team App</span>
          </Link>
          <Link to="/">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* ─── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-20 px-4 sm:px-6 text-center">
        {/* Background accents */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-10 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-10 right-0 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-7">
            <Zap className="w-3 h-3" /> Built for high school XC coaches
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-5">
            Run Your Entire XC Program<br className="hidden sm:block" />{" "}
            <span className="text-primary">in One Place</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed">
            Track mileage, manage athletes, analyze performance, and keep your team organized without spreadsheets or guesswork.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto font-bold px-8 h-12 text-base shadow-md hover:shadow-lg transition-shadow">
                Start Free Trial
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-8 h-12 text-base">
                View Plans
              </Button>
            </a>
          </div>

          <p className="text-xs text-muted-foreground mb-10">No credit card required · 14-day free trial · Cancel any time</p>

          {/* Billing Toggle */}
          <div id="pricing" className="inline-flex items-center bg-muted rounded-xl p-1 gap-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${!annual ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${annual ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Annual
              <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">Save 25%</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* ─── 2. PRICING CARDS ────────────────────────────────────────────── */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} annual={annual} />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          No credit card required to start · Cancel any time · 14-day free trial on Pro
        </p>
      </section>

      {/* ─── 3. VALUE / BENEFITS ─────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Why coaches choose XC Team App
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }} className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Everything your program needs.<br className="hidden sm:block" /> Nothing it doesn't.
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5 text-sm">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              FAQ
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }} className="text-3xl font-extrabold text-foreground tracking-tight">
              Common questions
            </motion.h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-primary">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-primary-foreground text-primary-foreground" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-tight mb-4">
            Ready to coach smarter this season?
          </h2>
          <p className="text-primary-foreground/75 text-base mb-8 max-w-lg mx-auto">
            Join coaches who've replaced spreadsheets and group texts with one tool built specifically for cross country.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto font-bold px-8 bg-white text-primary hover:bg-white/90">
                Start Free — No Card Needed
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-8 border-white/30 text-primary-foreground hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-primary-foreground/50 text-xs mt-5">
            14-day free trial · Full Pro access · Cancel any time
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8 px-4 sm:px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <TreePine className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-bold text-sm text-foreground">XC Team App</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built for high school cross country coaches. © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}