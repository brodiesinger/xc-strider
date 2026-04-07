import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";

const FIELDS = [
  { key: "varsity_boys_place",  label: "Varsity Boys" },
  { key: "varsity_girls_place", label: "Varsity Girls" },
  { key: "jv_boys_place",       label: "JV Boys" },
  { key: "jv_girls_place",      label: "JV Girls" },
];

function ordinal(n) {
  if (n == null || isNaN(n)) return "";
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export { FIELDS, ordinal };

export default function TeamPlacementEditor({ meet, onSaved }) {
  const [values, setValues] = useState({
    varsity_boys_place:  meet.varsity_boys_place  ?? "",
    varsity_girls_place: meet.varsity_girls_place ?? "",
    jv_boys_place:       meet.jv_boys_place       ?? "",
    jv_girls_place:      meet.jv_girls_place      ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // "saved" | "error"

  const handleChange = (key, raw) => {
    // allow empty or positive integer only
    if (raw === "" || /^\d+$/.test(raw)) {
      setValues((v) => ({ ...v, [key]: raw }));
      setStatus(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const patch = {};
      FIELDS.forEach(({ key }) => {
        const val = values[key];
        patch[key] = val === "" ? null : parseInt(val, 10);
      });
      await base44.entities.Meet.update(meet.id, patch);
      setStatus("saved");
      if (onSaved) onSaved({ ...meet, ...patch });
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Team Places</p>
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder="—"
              className="w-12 text-sm text-center bg-card border border-border rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving..." : "Save Places"}
        </button>
        {status === "saved" && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center gap-1 text-xs text-destructive font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> Save failed
          </span>
        )}
      </div>
    </div>
  );
}