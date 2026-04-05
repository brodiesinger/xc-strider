import React from "react";
import { Input } from "@/components/ui/input";

/**
 * Config UI for each athlete page block type.
 */
export default function AthleteBlockEditor({ block, onChange }) {
  switch (block.type) {
    case "title":
      return (
        <Input
          placeholder="Title text"
          value={block.text || ""}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          className="font-bold"
        />
      );

    case "text_block":
      return (
        <div className="space-y-2">
          <Input
            placeholder="Section heading (required)"
            value={block.title || ""}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Text content..."
            value={block.body || ""}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
          />
        </div>
      );

    case "image":
      return (
        <div className="space-y-2">
          <Input
            placeholder="Image URL (https://...)"
            value={block.url || ""}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
          />
          <Input
            placeholder="Caption (optional)"
            value={block.caption || ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
          />
        </div>
      );

    case "stats":
      return <p className="text-xs text-muted-foreground">Shows meet results, best time, and points for this athlete.</p>;

    case "prs":
      return <p className="text-xs text-muted-foreground">Shows all personal records for this athlete.</p>;

    case "badges":
      return <p className="text-xs text-muted-foreground">Shows all badges earned by this athlete.</p>;

    case "streak":
      return <p className="text-xs text-muted-foreground">Shows workout streak, total workouts, and total miles.</p>;

    default:
      return <p className="text-xs text-muted-foreground">Unknown block type.</p>;
  }
}