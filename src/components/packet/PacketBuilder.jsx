import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Plus, Eye, EyeOff, ChevronUp, ChevronDown, Trash2, Users } from "lucide-react";
import PacketPreview from "./PacketPreview";
import BlockEditor from "./BlockEditor";

const BLOCK_TYPES = [
  { type: "title", label: "Title" },
  { type: "text_block", label: "Text Block" },
  { type: "image", label: "Image" },
  { type: "season_overview", label: "Season Overview" },
  { type: "meet_results", label: "Meet Results" },
  { type: "athlete_stats", label: "Athlete Stats" },
];

export function newBlock(type, preselectedSeasonId = "") {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const base = { id, type };
  switch (type) {
    case "title": return { ...base, text: "" };
    case "text_block": return { ...base, title: "", body: "" };
    case "image": return { ...base, url: "", caption: "" };
    case "season_overview": return { ...base, seasonId: preselectedSeasonId, filter: "all" };
    case "meet_results": return { ...base, seasonId: preselectedSeasonId, meetId: "" };
    case "athlete_stats": return {
      ...base,
      seasonId: preselectedSeasonId,
      athleteEmail: "",
      showResults: true,
      showPRs: true,
      showPoints: true,
    };
    default: return base;
  }
}

function BlockRow({ block, index, total, seasons, meets, athletes, onChange, onDelete, onMoveUp, onMoveDown }) {
  const label = BLOCK_TYPES.find((b) => b.type === block.type)?.label || block.type;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <button
            disabled={index === 0}
            onClick={onMoveUp}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
            title="Move up"
          >
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
            title="Move down"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-destructive/10 transition-colors"
            title="Delete block"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <BlockEditor block={block} seasons={seasons} meets={meets} athletes={athletes} onChange={onChange} />
      </div>
    </div>
  );
}

function AthleteLayoutPanel({ athlete, blocks, seasons, meets, athletes, onBlocksChange, preselectedSeasonId }) {
  const addBlock = (type) => {
    onBlocksChange([...blocks, newBlock(type, preselectedSeasonId)]);
  };
  const updateBlock = (updated) => onBlocksChange(blocks.map((b) => b.id === updated.id ? updated : b));
  const deleteBlock = (id) => onBlocksChange(blocks.filter((b) => b.id !== id));
  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...blocks];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onBlocksChange(next);
  };
  const moveDown = (i) => {
    if (i === blocks.length - 1) return;
    const next = [...blocks];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onBlocksChange(next);
  };

  return (
    <div className="space-y-3 pl-4 border-l-2 border-primary/20 mt-3">
      <p className="text-xs text-muted-foreground font-medium">
        Layout for <span className="font-semibold text-foreground">{athlete.full_name || athlete.email}</span>
      </p>
      {blocks.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No blocks yet — add blocks below.</p>
      )}
      {blocks.map((block, i) => (
        <BlockRow
          key={block.id}
          block={block}
          index={i}
          total={blocks.length}
          seasons={seasons}
          meets={meets}
          athletes={athletes}
          onChange={updateBlock}
          onDelete={() => deleteBlock(block.id)}
          onMoveUp={() => moveUp(i)}
          onMoveDown={() => moveDown(i)}
        />
      ))}
      <div className="flex flex-wrap gap-2 pt-1">
        {BLOCK_TYPES.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => addBlock(type)}
            className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />{label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PacketBuilder({ seasons, meets, athletes, teamId, preselectedSeasonId }) {
  const [packetTitle, setPacketTitle] = useState("End-of-Season Packet");
  const [titleError, setTitleError] = useState("");
  const [blocks, setBlocks] = useState([]);
  // athleteLayouts: { [athleteEmail]: block[] }
  const [athleteLayouts, setAthleteLayouts] = useState({});
  const [expandedAthletes, setExpandedAthletes] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const addBlock = (type) => {
    setBlocks((prev) => [...prev, newBlock(type, preselectedSeasonId)]);
  };
  const updateBlock = (updated) => setBlocks((prev) => prev.map((b) => b.id === updated.id ? updated : b));
  const deleteBlock = (id) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...blocks];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setBlocks(next);
  };
  const moveDown = (i) => {
    if (i === blocks.length - 1) return;
    const next = [...blocks];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setBlocks(next);
  };

  const toggleAthlete = (email) =>
    setExpandedAthletes((prev) => ({ ...prev, [email]: !prev[email] }));

  const setAthleteBlocks = (email, newBlocks) =>
    setAthleteLayouts((prev) => ({ ...prev, [email]: newBlocks }));

  const validate = () => {
    const title = packetTitle.trim();
    if (!title) { setTitleError("Packet title is required."); return false; }
    setTitleError("");
    return true;
  };

  const handlePreview = () => {
    if (!validate()) return;
    setShowPreview((v) => !v);
  };

  const handlePrint = () => {
    if (!validate()) return;
    setShowPreview(true);
    setTimeout(() => window.print(), 400);
  };

  const hasContent = blocks.length > 0 || Object.values(athleteLayouts).some((b) => b.length > 0);

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

      {/* Main page blocks */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Page Blocks</p>
        {blocks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
            No blocks yet — add blocks below.
          </p>
        )}
        {blocks.map((block, i) => (
          <BlockRow
            key={block.id}
            block={block}
            index={i}
            total={blocks.length}
            seasons={seasons}
            meets={meets}
            athletes={athletes}
            onChange={updateBlock}
            onDelete={() => deleteBlock(block.id)}
            onMoveUp={() => moveUp(i)}
            onMoveDown={() => moveDown(i)}
          />
        ))}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Add Block</p>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(({ type, label }) => (
              <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)}>
                <Plus className="w-3.5 h-3.5 mr-1" />{label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Per-athlete pages */}
      {athletes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Athlete Pages</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Customize a separate block layout for each athlete's page. Layouts are independent per athlete.
          </p>
          {athletes.map((athlete) => {
            const isOpen = !!expandedAthletes[athlete.email];
            const ath_blocks = athleteLayouts[athlete.email] || [];
            return (
              <div key={athlete.email} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                  onClick={() => toggleAthlete(athlete.email)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {(athlete.full_name || athlete.email)[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{athlete.full_name || athlete.email}</span>
                    {ath_blocks.length > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {ath_blocks.length} block{ath_blocks.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <AthleteLayoutPanel
                      athlete={athlete}
                      blocks={ath_blocks}
                      seasons={seasons}
                      meets={meets}
                      athletes={athletes}
                      onBlocksChange={(b) => setAthleteBlocks(athlete.email, b)}
                      preselectedSeasonId={preselectedSeasonId}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      {hasContent && (
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
      {showPreview && hasContent && (
        <div className="mt-6 border border-border rounded-xl overflow-hidden">
          <PacketPreview
            title={packetTitle}
            blocks={blocks}
            athleteLayouts={athleteLayouts}
            athletes={athletes}
            seasons={seasons}
            meets={meets}
          />
        </div>
      )}
    </div>
  );
}