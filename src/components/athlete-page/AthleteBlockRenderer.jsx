import React from "react";
import StatsBlock from "./blocks/StatsBlock";
import PRsBlock from "./blocks/PRsBlock";
import BadgesBlock from "./blocks/BadgesBlock";
import StreakBlock from "./blocks/StreakBlock";

// ── Error Boundary ──────────────────────────────────────────────────────────
class BlockBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, prevId: props.blockId }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  static getDerivedStateFromProps(props, state) {
    if (props.blockId !== state.prevId) return { hasError: false, prevId: props.blockId };
    return null;
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function BlockContent({ block, athleteEmail, meets }) {
  switch (block.type) {
    case "title": {
      const text = block.text?.trim();
      if (!text) return null;
      return <h2 className="text-2xl font-bold text-gray-900">{text}</h2>;
    }
    case "text_block": {
      const title = block.title?.trim();
      if (!title) return null;
      return (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          {block.body?.trim() && (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{block.body}</p>
          )}
        </div>
      );
    }
    case "image": {
      const url = block.url?.trim();
      if (!url) return null;
      return (
        <div>
          <img
            src={url}
            alt={block.caption || ""}
            className="max-w-full rounded-lg"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          {block.caption?.trim() && (
            <p className="text-xs text-gray-500 mt-1 italic">{block.caption}</p>
          )}
        </div>
      );
    }
    case "stats":
      return <StatsBlock athleteEmail={athleteEmail} meets={meets} />;
    case "prs":
      return <PRsBlock athleteEmail={athleteEmail} />;
    case "badges":
      return <BadgesBlock athleteEmail={athleteEmail} />;
    case "streak":
      return <StreakBlock athleteEmail={athleteEmail} />;
    default:
      return null;
  }
}

export default function AthleteBlockRenderer({ block, athleteEmail, meets }) {
  return (
    <BlockBoundary blockId={block.id}>
      <div className="athlete-page-block mb-8 break-inside-avoid">
        <BlockContent block={block} athleteEmail={athleteEmail} meets={meets} />
      </div>
    </BlockBoundary>
  );
}