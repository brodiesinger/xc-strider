import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function DashboardHighlight({ title, description, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5 p-5 overflow-hidden"
    >
      {/* Animated background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <p className="text-sm font-bold text-primary uppercase tracking-wide">{title}</p>
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        <div>{children}</div>
      </div>
    </motion.div>
  );
}