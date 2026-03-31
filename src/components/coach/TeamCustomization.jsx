import React, { useState, useEffect, useRef } from "react";
import { Check, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { applyTeamTheme } from "@/lib/useTeamTheme";

// Curated palette — no hex codes shown to user
const COLOR_PALETTE = [
  // Greens
  "#166534", "#15803d", "#16a34a", "#4ade80",
  // Blues
  "#1e3a5f", "#1d4ed8", "#2563eb", "#60a5fa",
  // Purples
  "#4c1d95", "#7c3aed", "#9333ea", "#c084fc",
  // Reds / Crimsons
  "#7f1d1d", "#9b1c1c", "#dc2626", "#f87171",
  // Oranges
  "#9a3412", "#ea580c", "#f97316", "#fb923c",
  // Yellows / Golds
  "#854d0e", "#ca8a04", "#eab308", "#fde047",
  // Teals
  "#134e4a", "#0d9488", "#14b8a6", "#5eead4",
  // Grays / Neutrals
  "#111827", "#374151", "#6b7280", "#94a3b8",
  // Whites / Light
  "#e5e7eb", "#f3f4f6", "#ffffff", "#f1f5f9",
];

function ColorModal({ label, current, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">{label}</p>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Done</button>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              onClick={() => { onSelect(color); onClose(); }}
              className="relative w-full aspect-square rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
              style={{
                background: color,
                borderColor: current === color ? "#000" : "transparent",
                boxShadow: current === color ? "0 0 0 2px white, 0 0 0 4px " + color : "inset 0 0 0 1px rgba(0,0,0,0.1)",
              }}
            >
              {current === color && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-3 h-3" style={{ color: isLight(color) ? "#111" : "#fff" }} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function isLight(hex) {
  if (!hex || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export default function TeamCustomization({ team, onSaved }) {
  const [teamName, setTeamName] = useState(team?.name || "");
  const [primary, setPrimary] = useState(team?.primary_color || "#166534");
  const [secondary, setSecondary] = useState(team?.secondary_color || "#eab308");

  // Sync state if parent team prop changes (e.g. after save propagates back)
  const prevTeamId = useRef(team?.id);
  useEffect(() => {
    if (team?.id && team.id !== prevTeamId.current) {
      setTeamName(team.name || "");
      setPrimary(team.primary_color || "#166534");
      setSecondary(team.secondary_color || "#eab308");
      prevTeamId.current = team.id;
    }
  }, [team?.id]);
  const [modal, setModal] = useState(null); // "primary" | "secondary" | null
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePrimarySelect = (color) => {
    setPrimary(color);
    applyTeamTheme(color, secondary);
  };

  const handleSecondarySelect = (color) => {
    setSecondary(color);
    applyTeamTheme(primary, color);
  };

  const handleSave = async () => {
    if (!team?.id) return;
    setSaving(true);
    try {
      await base44.entities.Team.update(team.id, {
        name: teamName.trim() || team.name,
        primary_color: primary,
        secondary_color: secondary,
      });
      applyTeamTheme(primary, secondary);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.({ ...team, name: teamName.trim() || team.name, primary_color: primary, secondary_color: secondary });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">

        {/* Team Name */}
        <div className="p-4 border-b border-border">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
            Team Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full bg-muted/50 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border border-transparent focus:border-border"
            />
            <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Color Selectors */}
        <div className="grid grid-cols-2 divide-x divide-border">
          <button
            onClick={() => setModal("primary")}
            className="p-4 flex flex-col items-center gap-3 hover:bg-muted/40 transition-colors"
          >
            <div
              className="w-14 h-14 rounded-2xl shadow-md border-4 border-white"
              style={{ background: primary }}
            />
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">Primary</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tap to change</p>
            </div>
          </button>

          <button
            onClick={() => setModal("secondary")}
            className="p-4 flex flex-col items-center gap-3 hover:bg-muted/40 transition-colors"
          >
            <div
              className="w-14 h-14 rounded-2xl shadow-md border-4 border-white"
              style={{ background: secondary }}
            />
            <div className="text-center">
              <p className="text-xs font-semibold text-foreground">Secondary</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tap to change</p>
            </div>
          </button>
        </div>

        {/* Live Preview */}
        <div className="p-4 border-t border-border bg-muted/20 space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Preview</p>
          <div className="rounded-xl overflow-hidden border border-border">
            {/* Fake header */}
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: primary }}>
              <div className="w-5 h-5 rounded-full bg-white/20" />
              <span
                className="text-sm font-bold"
                style={{ color: isLight(primary) ? "#111" : "#fff" }}
              >
                {teamName || team?.name || "Your Team"}
              </span>
            </div>
            {/* Fake body */}
            <div className="px-4 py-3 bg-card flex items-center gap-3">
              <div
                className="px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: secondary,
                  color: isLight(secondary) ? "#111" : "#fff",
                }}
              >
                Log Workout
              </div>
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-3/5 rounded-full" style={{ background: primary }} />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{
              background: primary,
              color: isLight(primary) ? "#111" : "#fff",
            }}
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Saved!</>
            ) : saving ? (
              "Saving..."
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {/* Color Modals */}
      {modal === "primary" && (
        <ColorModal
          label="Choose Primary Color"
          current={primary}
          onSelect={handlePrimarySelect}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "secondary" && (
        <ColorModal
          label="Choose Secondary Color"
          current={secondary}
          onSelect={handleSecondarySelect}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}