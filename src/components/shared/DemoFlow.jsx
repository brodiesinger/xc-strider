import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DemoFlow({ onStartDemo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Quick Demo</p>
          <p className="text-xs text-muted-foreground mt-1">
            See the full workflow in under 2 minutes: dashboard → lineup → results → athlete page → packet
          </p>
        </div>
      </div>
      <Button
        onClick={onStartDemo}
        variant="outline"
        size="sm"
        className="w-full group"
      >
        Start Demo
        <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
      </Button>
    </motion.div>
  );
}