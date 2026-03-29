import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISCLAIMER = "⚠️ This is not medical advice. Consult a professional if pain persists.";

const SUGGESTED = [
  "My shin hurts after runs",
  "I have knee pain going downhill",
  "Should I run today?",
  "My calves feel very tight",
];

export default function AIInjuryChat({ workouts }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm your injury assistant. Ask me about any aches, pains, or whether you should train today.\n\n${DISCLAIMER}`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const recentSummary = workouts.slice(0, 5).map(w =>
    `${w.date}: ${w.distance} mi in ${w.time_minutes} min`
  ).join("; ");

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const prompt = `You are a knowledgeable running injury assistant helping a cross-country athlete.

Athlete's recent workouts: ${recentSummary || "No recent data"}

Athlete asks: "${userMsg}"

Respond helpfully with:
1. A possible general cause (NOT a medical diagnosis)
2. Suggested actions (rest, reduce mileage, stretching, icing, see a coach)
3. Keep it concise, friendly, and athlete-focused
4. End EVERY response with exactly this line: "⚠️ This is not medical advice. Consult a professional if pain persists."

Do not make up diagnoses. Be cautious and conservative.`;

      const reply = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Bot className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm text-foreground">Injury Assistant</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={cn(
              "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            )}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs bg-muted hover:bg-muted/70 text-foreground rounded-full px-3 py-1 border border-border transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border flex gap-2">
        <input
          className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Ask about pain, soreness, or training..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && send()}
          disabled={loading}
        />
        <Button size="icon" onClick={() => send()} disabled={loading || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}