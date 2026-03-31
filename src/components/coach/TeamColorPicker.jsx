import React, { useState } from "react";
import { Palette, Check, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { applyTeamTheme } from "@/lib/useTeamTheme";

const PRESETS = [
  { label: "Forest Green & Gold",   primary: "#1a6b3c", secondary: "#f59e0b" },
  { label: "Navy & Orange",         primary: "#1e3a5f", secondary: "#ea580c" },
  { label: "Crimson & Gray",        primary: "#9b1c1c", secondary: "#6b7280" },
  { label: "Royal Blue & Gold",     primary: "#1d4ed8", secondary: "#eab308" },
  { label: "Purple & White",        primary: "#7c3aed", secondary: "#e5e7eb" },
  { label: "Maroon & Silver",       primary: "#7f1d1d", secondary: "#94a3b8" },
  { label: "Black & Gold",          primary: "#111827", secondary: "#f59e0b" },
  { label: "Teal & Coral",          primary: "#0d9488", secondary: "#f97316" },
];

export default function TeamColorPicker({ team, onSaved }) {
  const [primary, setPrimary] = useState(team?.primary_color || "#1a6b3c");
  const [secondary, setSecondary] = useState(team?.secondary_color || "#f59e0b");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePreset = (preset) => {
    setPrimary(preset.primary);
    setSecondary(preset.secondary);
    // Live preview
    applyTeamTheme(preset.primary, preset.secondary);
  };

  const handlePrimaryChange = (val) => {
    setPrimary(val);
    applyTeamTheme(val, secondary);
  };

  const handleSecondaryChange = (val) => {
    setSecondary(val);
    applyTeamTheme(primary, val);
  };

  const handleReset = () => {
    setPrimary("#1a6b3c");
    setSecondary("#f59e0b");
    applyTeamTheme(null, null);
  };

  const handleSave = async () => {
    if (!team?.id) return;
    setSaving(true);
    try {
      await base44.entities.Team.update(team.id, {
        primary_color: primary,
        secondary_color: secondary,
      });
      applyTeamTheme(primary, secondary);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved?.({ ...team, primary_color: primary, secondary_color: secondary });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Team Colors</h3>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primary}
              onChange={(e) => handlePrimaryChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
            />
            <input
              type="text"
              value={primary}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) handlePrimaryChange(v);
              }}
              className="flex-1 text-xs font-mono border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              maxLength={7}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Secondary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondary}
              onChange={(e) => handleSecondaryChange(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
            />
            <input
              type="text"
              value={secondary}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) handleSecondaryChange(v);
              }}
              className="flex-1 text-xs font-mono border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Live preview swatch */}
      <div className="flex items-center gap-3">
        <div
          className="h-8 flex-1 rounded-lg border border-border"
          style={{ background: `linear-gradient(to right, ${primary} 50%, ${secondary} 50%)` }}
        />
        <span className="text-xs text-muted-foreground">Preview</span>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Common School Colors</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
            >
              <div className="flex gap-0.5 shrink-0">
                <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: p.primary }} />
                <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: p.secondary }} />
              </div>
              <span className="text-[10px] text-foreground leading-tight truncate">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted/50 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-xl px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : saving ? "Saving..." : "Save Colors"}
        </button>
      </div>
    </div>
  );
}