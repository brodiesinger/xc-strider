import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    const role = user.user_type;
    const hasName = user.full_name?.trim() && !user.full_name.includes("@") && user.full_name.includes(" ");
    if (!hasName || !role) {
      navigate("/onboarding");
    } else if (role === "coach") {
      navigate("/coach");
    } else {
      navigate("/athlete");
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
        // After register, need OTP verification — redirect to OTP step
        navigate(`/verify-email?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      } else {
        await base44.auth.loginViaEmailPassword(email, password);
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">XC Team App</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-primary font-medium hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}