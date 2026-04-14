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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
      className={`relative flex flex-col rounded-3xl border p-7 sm:p-8 transition-all duration-200
        ${plan.highlight
          ? "border-primary/80 bg-primary text-primary-foreground shadow-[0_8px_40px_rgba(0,0,0,0.18)] scale-[1.03] sm:scale-[1.06] z-10"
          : plan.premium
          ? "border-border/80 bg-card text-foreground shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-0.5"
          : "border-border bg-card text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5"
        }`}
    >
      {/* Highlight glow layer */}
      {plan.highlight && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      )}

      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
          {plan.badge}
        </div>
      )}

      {plan.premium && !plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg whitespace-nowrap">
          Best Value
        </div>
      )}

      {/* Plan name + price */}
      <div className="mb-6">
        <p className={`text-[11px] font-bold uppercase tracking-[0.12em] mb-4 ${plan.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {plan.name}
        </p>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-5xl font-extrabold tracking-tight leading-none">${plan.price}</span>
          <span className={`text-sm pb-1 font-medium ${plan.highlight ? "text-primary-foreground/55" : "text-muted-foreground"}`}>/mo</span>
        </div>
        <p className={`text-[13px] mt-2 leading-snug ${plan.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {plan.bestFor}
        </p>
      </div>

      {/* Divider */}
      <div className={`h-px mb-6 ${plan.highlight ? "bg-white/15" : "bg-border"}`} />

      {/* CTA */}
      <Link to="/" className="mb-6 block">
        <Button
          className={`w-full font-semibold h-11 text-[13px] rounded-xl transition-all ${
            plan.highlight
              ? "bg-white text-primary hover:bg-white/92 shadow-md"
              : plan.premium
              ? "bg-foreground text-background hover:bg-foreground/85"
              : "border-border hover:border-primary/40"
          }`}
          variant={plan.highlight || plan.premium ? "default" : "outline"}
        >
          {plan.cta}
        </Button>
      </Link>

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[13px] leading-snug">
            <div className={`w-4 h-4 mt-0.5 shrink-0 rounded-full flex items-center justify-center ${
              plan.highlight ? "bg-white/20" : "bg-primary/10"
            }`}>
              <Check className={`w-2.5 h-2.5 ${plan.highlight ? "text-white" : "text-primary"}`} />
            </div>
            <span className={
              f.startsWith("Add additional")
                ? `font-medium ${plan.highlight ? "text-primary-foreground/55" : "text-muted-foreground"}`
                : plan.highlight ? "text-primary-foreground/85" : "text-foreground"
            }>
              {f}
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
      className={`border rounded-2xl overflow-hidden cursor-pointer transition-colors ${open ? "border-primary/30 bg-card" : "border-border bg-card hover:border-primary/20"}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between px-5 py-4 sm:py-5">
        <p className="text-sm sm:text-[15px] font-semibold text-foreground pr-6 leading-snug">{faq.question}</p>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/60"
        >
          <div className="pt-4">{faq.answer}</div>
        </motion.div>
      )}
    </div>
  );
}

export default function Pricing() {

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <TreePine className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm tracking-tight">XC Team App</span>
          </Link>
          <Link to="/">
            <Button size="sm" className="rounded-xl font-semibold">Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* ─── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20 px-4 sm:px-6 text-center">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/6 rounded-full blur-3xl" />
          <div className="absolute top-16 left-0 w-72 h-72 bg-accent/8 rounded-full blur-3xl" />
          <div className="absolute top-16 right-0 w-72 h-72 bg-primary/6 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8 border border-primary/15">
            <Zap className="w-3 h-3" /> Built for high school XC coaches
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-extrabold text-foreground tracking-tight leading-[1.08] mb-6">
            Run Your Entire XC Program<br className="hidden sm:block" />{" "}
            <span className="text-primary">in One Place</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Track mileage, manage athletes, analyze performance, and keep your team organized without spreadsheets or guesswork.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto font-bold px-8 h-12 text-[15px] rounded-xl shadow-md hover:shadow-lg transition-shadow">
                Start Free Trial
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-8 h-12 text-[15px] rounded-xl">
                View Plans
              </Button>
            </a>
          </div>

          <p id="pricing" className="text-xs text-muted-foreground">No credit card required · 14-day free trial · Cancel any time</p>
        </motion.div>
      </section>

      {/* ─── 2. PRICING CARDS ────────────────────────────────────────────── */}
      <section className="pt-6 pb-24 px-4 sm:px-6" id="pricing-cards">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-center">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">
          No credit card required · Cancel any time · 14-day free trial
        </p>
      </section>

      {/* ─── 3. VALUE / BENEFITS ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 bg-muted/25 border-y border-border/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight"
            >
              Built for Coaches Who Want Results —<br className="hidden sm:block" /> Not More Work
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
                className="bg-card rounded-2xl border border-border p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-[15px] mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary mb-3">
              FAQ
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }} className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Common questions
            </motion.h2>
          </div>

          <div className="space-y-2.5">
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