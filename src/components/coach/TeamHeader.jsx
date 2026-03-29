import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function TeamHeader({ team }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(team.join_code);
    } catch {
      // Fallback for non-HTTPS or clipboard permission denied
      const el = document.createElement("textarea");
      el.value = team.join_code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="font-bold text-foreground text-lg">{team.name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Share the join code with your athletes</p>
      </div>
      <button
        onClick={copyCode}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-muted hover:bg-secondary transition-colors text-sm font-mono font-semibold text-foreground"
      >
        {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
        {team.join_code}
      </button>
    </div>
  );
}