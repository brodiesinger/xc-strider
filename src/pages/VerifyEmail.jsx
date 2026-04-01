import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import { TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { refresh } = useCurrentUser();
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") || "";
  const password = params.get("password") || "";

  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.verifyOtp({ email, otpCode });
      await base44.auth.loginViaEmailPassword(email, password);
      await refresh();
      navigate("/onboarding");
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
    } catch (err) {
      setError(err.message || "Failed to resend code.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground text-center">
            We sent a verification code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="w-full space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              required
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full h-11">
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="flex items-center justify-between w-full text-sm">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to login
          </button>
          <button
            type="button"
            onClick={handleResend}
            className="text-primary font-medium hover:underline"
          >
            Resend code
          </button>
        </div>
      </div>
    </div>
  );
}