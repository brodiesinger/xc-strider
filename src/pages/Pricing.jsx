import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, TreePine, Zap, Users, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Starter",
    price: 69,
    bestFor: "Small or developing programs",
    cta: "Start Free Trial",
    highlight: false,
    badge: null,
    features: [
      "1 Team (Boys OR Girls)",
      "Athlete logging (miles, workouts, strength)",
      "Coach dashboard (basic)",
      "Team roster + athlete profiles",
      "Messaging",
      "Injury reporting",
      "Add additional teams for +$25/month",
    ],
  },
  {
    name: "Team",
    price: 129,
    bestFor: "Full XC programs",
    cta: "Start Free Trial",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Performance tracking (graphs, trends)",
      "Mileage consistency tracking",
      "Meet results + PR tracking",
      "Season overview dashboard",
      "Boys & Girls team separation",
      "Multi-team management",
      "Basic injury alerts",
      "Add additional teams for +$40/month",
    ],
  },
  {
    name: "Elite",
    price: 189,
    bestFor: "Competitive programs that want an edge",
    cta: "Start Free Trial",
    highlight: false,
    badge: null,
    premium: true,
    features: [
      "Everything in Team",
      "2 Teams included",
      "AI injury insights + recovery suggestions",
      "Advanced performance analytics",
      "Overtraining detection",
      "Packet Builder",
      "Exportable reports (PDFs)",
      "Priority support",
      "Add additional teams for +$30/month",
    ],
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: "Save Time",
    description: "No more spreadsheets or manual tracking—everything updates in one place.",
  },
  {
    icon: BarChart2,
    title: "Improve Performance",
    description: "See who's improving, who's struggling, and make smarter training decisions.",
  },
  {
    icon: Users,
    title: "Stay Organized",
    description: "Manage boys and girls teams, meet results, and communication in one place.",
  },
];

const FAQS = [
  {
    question: "Can I manage both boys and girls teams?",
    answer: "Yes. All plans support multiple teams, with discounted pricing for additional teams.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, coaches can start with a free trial before committing to a paid plan.",
  },
  {
    question: "Do athletes need to pay?",
    answer: "No. Pricing is for the team or school, and athletes join at no extra cost.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. There are no long-term contracts required.",
  },
];

function PricingCard({ plan, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 transition-shadow
        ${plan.highlight
          ? "border-primary bg-primary text-primary-foreground shadow-2xl scale-[1.02] sm:scale-105 z-10"
          : plan.premium
          ? "border-border bg-card text-foreground shadow-lg ring-1 ring-border/60"
          : "border-border bg-card text-foreground shadow-sm hover:shadow-md"
        }`}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
          {plan.badge}
        </div>
      )}

      {plan.premium && !plan.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
          Best Value
        </div>
      )}

      {/* Plan name + price */}
      <div className="mb-5">
        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {plan.name}
        </p>
        <div className="flex items-end gap-1.5 mb-1.5">
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">${plan.price}</span>
          <span className={`text-sm pb-1.5 font-medium ${plan.highlight ? "text-primary-foreground/65" : "text-muted-foreground"}`}>/month</span>
        </div>
        <p className={`text-xs font-medium mt-1 ${plan.highlight ? "text-primary-foreground/65" : "text-muted-foreground"}`}>
          Best for: {plan.bestFor}
        </p>
      </div>

      {/* CTA */}
      <Link to="/" className="mb-6 block">
        <Button
          className={`w-full font-semibold h-11 text-sm ${
            plan.highlight
              ? "bg-white text-primary hover:bg-white/90 shadow"
              : plan.premium
              ? "bg-foreground text-background hover:bg-foreground/90"
              : ""
          }`}
          variant={plan.highlight || plan.premium ? "default" : "outline"}
        >
          {plan.cta}
        </Button>
      </Link>

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm leading-snug">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-primary-foreground/80" : "text-primary"}`} />
            <span className={plan.highlight ? "text-primary-foreground/90" : "text-foreground"}>
              {f.startsWith("Add additional") ? (
                <span className={`font-medium ${plan.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{f}</span>
              ) : f}
            </span>
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

          <p id="pricing" className="text-xs text-muted-foreground mb-10">No credit card required · 14-day free trial · Cancel any time</p>
        </motion.div>
      </section>

      {/* ─── 2. PRICING CARDS ────────────────────────────────────────────── */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-center">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          No credit card required to start · Cancel any time · 14-day free trial on Pro
        </p>
      </section>

      {/* ─── 3. VALUE / BENEFITS ─────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight"
            >
              Built for Coaches Who Want Results —<br className="hidden sm:block" /> Not More Work
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="bg-card rounded-2xl border border-border p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
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
      <section className="py-24 px-4 sm:px-6 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="relative z-10 max-w-xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-tight leading-tight mb-4">
            Start Running Your Team<br className="hidden sm:block" /> Smarter Today
          </h2>
          <p className="text-primary-foreground/75 text-base mb-9 max-w-sm mx-auto leading-relaxed">
            Set up your team in minutes and manage everything from one place.
          </p>
          <Link to="/">
            <Button size="lg" className="font-bold px-10 h-12 text-base bg-white text-primary hover:bg-white/90 shadow-lg">
              Start Free Trial
            </Button>
          </Link>
          <p className="text-primary-foreground/45 text-xs mt-5">
            No credit card required · Cancel any time
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