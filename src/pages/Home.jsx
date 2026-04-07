import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser, getOnboardingStep } from "@/lib/CurrentUserContext";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Home() {
  const navigate = useNavigate();
  const { currentUser, refresh } = useCurrentUser();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, route to the right place
  useEffect(() => {
    if (!currentUser) return;
    routeUser(currentUser);
  }, [currentUser]);

  const routeUser = (user) => {
    const step = getOnboardingStep(user);
    if (step === null) {
      // Fully onboarded
      navigate(user.user_type === "coach" ? "/coach" : "/athlete");
    } else {
      navigate("/onboarding");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        await base44.auth.register({ email, password });
        await base44.auth.resendOtp(email);
        toast.success("Account created! Check your email for verification.");
        // After register, need OTP verification — redirect to OTP step
        navigate(`/verify-email?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      } else {
        await base44.auth.loginViaEmailPassword(email, password);
        toast.success("Signed in!");
        await refresh();
        // routeUser will fire via useEffect
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 py-6">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }} className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center">XC Team App</h1>
          <p className="text-sm text-muted-foreground text-center">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button type="submit" disabled={loading} className="w-full h-10 mt-1">
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </motion.div>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <motion.button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-primary font-medium hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </motion.button>
        </p>
      </div>
    </motion.div>
  );
}