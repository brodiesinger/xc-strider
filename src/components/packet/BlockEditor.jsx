import React from "react";
import { Input } from "@/components/ui/input";

/**
 * Renders the configuration UI for a single block based on its type.
 */
export default function BlockEditor({ block, seasons, meets, onChange }) {
  const seasonMeets = meets.filter((m) => m.season_id === block.seasonId);

  switch (block.type) {
    case "title":
      return (
        <Input
          placeholder="Title text"
          value={block.text || ""}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          className="font-bold text-base"
        />
      );

    case "text_block":
      return (
        <div className="space-y-2">
          <Input
            placeholder="Section title (required)"
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

    case "season_overview":
      return (
        <div className="space-y-2">
          <SeasonSelect seasons={seasons} value={block.seasonId} onChange={(v) => onChange({ ...block, seasonId: v })} />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Team group</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={block.filter || "whole_team"}
              onChange={(e) => onChange({ ...block, filter: e.target.value })}
            >
              <option value="whole_team">Whole Team</option>
              <option value="boys">Boys Team</option>
              <option value="girls">Girls Team</option>
            </select>
          </div>
        </div>
      );

    case "meet_results":
      return (
        <div className="space-y-2">
          <SeasonSelect seasons={seasons} value={block.seasonId} onChange={(v) => onChange({ ...block, seasonId: v, meetId: "" })} />
          {block.seasonId && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Meet (leave blank for all)</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  value={block.meetId || ""}
                  onChange={(e) => onChange({ ...block, meetId: e.target.value })}
                >
                  <option value="">All meets in season</option>
                  {seasonMeets.map((m) => (
                    <option key={m.id} value={m.id}>{m.meet_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Group results by</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  value={block.groupBy || "none"}
                  onChange={(e) => onChange({ ...block, groupBy: e.target.value })}
                >
                  <option value="none">No grouping (flat list)</option>
                  <option value="whole_team">Whole Team (Varsity/JV Boys &amp; Girls)</option>
                  <option value="boys">Boys Team (Varsity/JV Boys)</option>
                  <option value="girls">Girls Team (Varsity/JV Girls)</option>
                </select>
              </div>
            </>
          )}
        </div>
      );

    default:
      return <p className="text-xs text-muted-foreground">Unknown block type</p>;
  }
}

function SeasonSelect({ seasons, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">Season</label>
      <select
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Select season —</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>{s.season_name}</option>
        ))}
      </select>
    </div>
  );
}