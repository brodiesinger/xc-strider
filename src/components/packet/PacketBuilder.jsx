import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Plus, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";
import PacketPreview from "./PacketPreview";

const SECTION_TYPES = [
  { type: "season_overview", label: "Season Overview" },
  { type: "meet_results", label: "Meet Results" },
  { type: "athlete_pages", label: "Athlete Pages" },
  { type: "text_block", label: "Text Block" },
  { type: "image", label: "Image" },
];

function newSection(type) {
  const base = { id: Date.now() + Math.random(), type };
  if (type === "text_block") return { ...base, title: "", body: "" };
  if (type === "image") return { ...base, url: "", caption: "" };
  if (type === "season_overview") return { ...base, seasonId: "" };
  if (type === "meet_results") return { ...base, seasonId: "", meetId: "" };
  if (type === "athlete_pages") return {
    ...base,
    seasonId: "",
    showResults: true,
    showPRs: true,
    showPoints: true,
    showBadges: true,
    showStreak: true,
  };
  return base;
}

function SectionConfigRow({ section, seasons, meets, onChange, onDelete }) {
  const seasonMeets = meets.filter((m) => m.season_id === section.seasonId);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            {SECTION_TYPES.find((s) => s.type === section.type)?.label || section.type}
          </span>
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Season picker for data-backed sections */}
      {["season_overview", "meet_results", "athlete_pages"].includes(section.type) && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Season</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={section.seasonId || ""}
            onChange={(e) => onChange({ ...section, seasonId: e.target.value, meetId: "" })}
          >
            <option value="">— Select season —</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.season_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Meet picker for meet results */}
      {section.type === "meet_results" && section.seasonId && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Meet (leave blank for all meets)</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={section.meetId || ""}
            onChange={(e) => onChange({ ...section, meetId: e.target.value })}
          >
            <option value="">All meets in season</option>
            {seasonMeets.map((m) => (
              <option key={m.id} value={m.id}>{m.meet_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Athlete page toggles */}
      {section.type === "athlete_pages" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Include on each athlete page:</p>
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
            {[
              { key: "showResults", label: "Race Results" },
              { key: "showPRs", label: "PRs" },
              { key: "showPoints", label: "Points" },
              { key: "showBadges", label: "Badges" },
              { key: "showStreak", label: "Streak" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!section[key]}
                  onChange={(e) => onChange({ ...section, [key]: e.target.checked })}
                  className="w-3.5 h-3.5 accent-primary"
                />
                <span className="text-xs text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Text block */}
      {section.type === "text_block" && (
        <div className="space-y-2">
          <Input
            placeholder="Title (required)"
            value={section.title || ""}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
          />
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Text content..."
            value={section.body || ""}
            onChange={(e) => onChange({ ...section, body: e.target.value })}
          />
        </div>
      )}

      {/* Image */}
      {section.type === "image" && (
        <div className="space-y-2">
          <Input
            placeholder="Image URL (https://...)"
            value={section.url || ""}
            onChange={(e) => onChange({ ...section, url: e.target.value })}
          />
          <Input
            placeholder="Caption (optional)"
            value={section.caption || ""}
            onChange={(e) => onChange({ ...section, caption: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

export default function PacketBuilder({ seasons, meets, athletes, teamId, preselectedSeasonId }) {
  const [sections, setSections] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [packetTitle, setPacketTitle] = useState("End-of-Season Packet");
  const [titleError, setTitleError] = useState("");

  const addSection = (type) => {
    const s = newSection(type);
    if (preselectedSeasonId && ["season_overview", "meet_results", "athlete_pages"].includes(type)) {
      s.seasonId = preselectedSeasonId;
    }
    setSections((prev) => [...prev, s]);
  };

  const updateSection = (updated) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const deleteSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePrint = () => {
    const title = packetTitle.trim();
    if (!title) { setTitleError("Packet title is required before printing."); return; }
    setTitleError("");
    setShowPreview(true);
    setTimeout(() => window.print(), 400);
  };

  const handlePreview = () => {
    const title = packetTitle.trim();
    if (!title) { setTitleError("Packet title is required."); return; }
    setTitleError("");
    setShowPreview((v) => !v);
  };

  return (
    <div className="space-y-6">
      {/* Packet title */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Packet Title</label>
        <Input
          placeholder="e.g. Fall 2025 Season Packet"
          value={packetTitle}
          onChange={(e) => { setPacketTitle(e.target.value); setTitleError(""); }}
          className="text-base font-semibold"
        />
        {titleError && <p className="text-xs text-destructive">{titleError}</p>}
      </div>

      {/* Section list */}
      {sections.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Sections</p>
          {sections.map((section) => (
            <SectionConfigRow
              key={section.id}
              section={section}
              seasons={seasons}
              meets={meets}
              onChange={updateSection}
              onDelete={() => deleteSection(section.id)}
            />
          ))}
        </div>
      )}

      {/* Add section buttons */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Add Section</p>
        <div className="flex flex-wrap gap-2">
          {SECTION_TYPES.map(({ type, label }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => addSection(type)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
          No sections added yet. Use the buttons above to build your packet.
        </p>
      )}

      {/* Actions */}
      {sections.length > 0 && (
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={handlePreview}>
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Packet
          </Button>
        </div>
      )}

      {/* Preview */}
      {showPreview && sections.length > 0 && (
        <div className="mt-6 border border-border rounded-xl overflow-hidden">
          <PacketPreview
            title={packetTitle}
            sections={sections}
            seasons={seasons}
            meets={meets}
            athletes={athletes}
          />
        </div>
      )}
    </div>
  );
}