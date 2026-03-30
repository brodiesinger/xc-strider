import React, { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DailyCheckInCard({ onSubmit, isLoading }) {
  const [soreness, setSoreness] = useState(5);
  const [energy, setEnergy] = useState("medium");
  const [hasPain, setHasPain] = useState(false);
  const [pain, setPain] = useState(0);

  const handleSubmit = async () => {
    await onSubmit({
      soreness,
      energy,
      pain: hasPain ? pain : 0,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/95 p-5 space-y-4 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Daily Check-In</h3>
          <p className="text-xs text-muted-foreground">Quick wellness scan</p>
        </div>
      </div>

      {/* Soreness Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Soreness</label>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {soreness}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={soreness}
          onChange={(e) => setSoreness(parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>None</span>
          <span>Severe</span>
        </div>
      </div>

      {/* Energy Level */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" /> Energy Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "low", label: "Low", color: "bg-red-100 text-red-600" },
            { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-600" },
            { value: "high", label: "High", color: "bg-green-100 text-green-600" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setEnergy(opt.value)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                energy === opt.value
                  ? `${opt.color} ring-2 ring-offset-2 ring-offset-card ring-current`
                  : `bg-muted text-muted-foreground hover:bg-muted/80`
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pain Toggle */}
      <div className="space-y-2">
        <button
          onClick={() => setHasPain(!hasPain)}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <input
            type="checkbox"
            checked={hasPain}
            onChange={() => setHasPain(!hasPain)}
            className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
          />
          <AlertCircle className="w-4 h-4 text-orange-500" />
          <span>Any pain?</span>
        </button>

        {hasPain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Pain Level</label>
              <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2.5 py-1 rounded-full">
                {pain}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={pain}
              onChange={(e) => setPain(parseInt(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>None</span>
              <span>Severe</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Submit Button */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Saving..." : "Complete Check-In ✓"}
        </Button>
      </motion.div>
    </motion.div>
  );
}