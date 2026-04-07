import React from "react";
import PacketSeasonOverview from "./sections/PacketSeasonOverview";
import PacketMeetResults from "./sections/PacketMeetResults";
import PacketTextBlock from "./sections/PacketTextBlock";
import PacketImage from "./sections/PacketImage";

// ── Error Boundary — resets when blockId changes ──────────────────────────────
class BlockErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, prevBlockId: props.blockId };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  // Reset when the block id changes (e.g. block was replaced)
  static getDerivedStateFromProps(props, state) {
    if (state.prevBlockId !== props.blockId) {
      return { hasError: false, prevBlockId: props.blockId };
    }
    return null;
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ── Single block renderer — returns null for empty/unconfigured blocks ────────
function BlockContent({ block, seasons, meets, teamId }) {
  const season = seasons.find((s) => s.id === block.seasonId) || null;
  const seasonMeets = season ? meets.filter((m) => m.season_id === season.id) : [];

  switch (block.type) {
    case "title": {
      const text = block.text?.trim();
      if (!text) return null;
      return <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{text}</h1>;
    }

    case "text_block": {
      const title = block.title?.trim();
      if (!title) return null;
      return <PacketTextBlock title={title} body={block.body || ""} />;
    }

    case "image": {
      const url = block.url?.trim();
      if (!url) return null;
      return <PacketImage url={url} caption={block.caption || ""} />;
    }

    case "season_overview": {
      if (!season) return null;
      return <PacketSeasonOverview season={season} meets={seasonMeets} filter={block.filter || "whole_team"} />;
    }

    case "meet_results": {
      if (!season) return null;
      const targetMeets = block.meetId
        ? seasonMeets.filter((m) => m.id === block.meetId)
        : seasonMeets;
      if (targetMeets.length === 0) return null;
      return <PacketMeetResults meets={targetMeets} teamId={teamId} groupBy={block.groupBy || "none"} />;
    }

    default:
      return null;
  }
}

// Wrapper that avoids rendering an empty div when content is null
function SafeBlock({ block, seasons, meets, teamId }) {
  return (
    <BlockErrorBoundary blockId={block.id}>
      <BlockContentWrapper block={block} seasons={seasons} meets={meets} teamId={teamId} />
    </BlockErrorBoundary>
  );
}

// Inner wrapper so we can conditionally add spacing only when content exists
class BlockContentWrapper extends React.Component {
  constructor(props) { super(props); this.state = { hasContent: true }; }
  render() {
    const { block, seasons, meets, teamId } = this.props;
    return (
      <div className="packet-block mb-8 break-inside-avoid">
        <BlockContent block={block} seasons={seasons} meets={meets} teamId={teamId} />
      </div>
    );
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PacketPreview({ title, blocks, seasons, meets, teamId }) {
  return (
    <div className="packet-preview bg-white text-gray-900 p-8 min-h-screen font-sans">
      {/* Packet header */}
      <div className="text-center border-b-2 border-gray-200 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Main page blocks */}
      {(blocks || []).map((block) => (
        <SafeBlock
          key={block.id}
          block={block}
          seasons={seasons}
          meets={meets}
          teamId={teamId}
        />
      ))}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .packet-preview, .packet-preview * { visibility: visible; }
          .packet-preview {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 1in;
            font-size: 11pt;
          }
          .packet-block { page-break-inside: avoid; margin-bottom: 24pt; }
          .break-before-page { page-break-before: always; }
          .no-print { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { padding: 4pt 6pt; }
        }
      `}</style>
    </div>
  );
}