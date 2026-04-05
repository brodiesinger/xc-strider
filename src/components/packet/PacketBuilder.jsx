import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, Plus, Eye, EyeOff, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import PacketPreview from "./PacketPreview";
import BlockEditor from "./BlockEditor";
const BLOCK_TYPES = [
  { type: "title", label: "Title" },
  { type: "text_block", label: "Text Block" },
  { type: "image", label: "Image" },
  { type: "season_overview", label: "Season Overview" },
  { type: "meet_results", label: "Meet Results" },
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
    default: return base;
  }
}

function BlockRow({ block, index, total, seasons, meets, teamId, onChange, onDelete, onMoveUp, onMoveDown }) {
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
        <BlockEditor block={block} seasons={seasons} meets={meets} onChange={onChange} />
      </div>
    </div>
  );
}


export default function PacketBuilder({ seasons, meets, teamId, preselectedSeasonId }) {
  const [packetTitle, setPacketTitle] = useState("End-of-Season Packet");
  const [titleError, setTitleError] = useState("");
  const [blocks, setBlocks] = useState([]);
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

  const hasContent = blocks.length > 0;

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
            teamId={teamId}
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
            seasons={seasons}
            meets={meets}
            teamId={teamId}
          />
        </div>
      )}
    </div>
  );
}