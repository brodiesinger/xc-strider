import React from "react";
import PacketSeasonOverview from "./sections/PacketSeasonOverview";
import PacketMeetResults from "./sections/PacketMeetResults";
import PacketAthletePages from "./sections/PacketAthletePages";
import PacketTextBlock from "./sections/PacketTextBlock";
import PacketImage from "./sections/PacketImage";

function SectionWrapper({ children }) {
  return (
    <div className="packet-section mb-8 break-inside-avoid">
      {children}
    </div>
  );
}

function SafeSection({ section, seasons, meets, athletes }) {
  try {
    const season = seasons.find((s) => s.id === section.seasonId) || null;
    const sectionMeets = season
      ? meets.filter((m) => m.season_id === season.id)
      : [];

    if (section.type === "season_overview") {
      if (!season) return null;
      return (
        <SectionWrapper>
          <PacketSeasonOverview season={season} meets={sectionMeets} athletes={athletes} />
        </SectionWrapper>
      );
    }

    if (section.type === "meet_results") {
      if (!season) return null;
      const targetMeets = section.meetId
        ? sectionMeets.filter((m) => m.id === section.meetId)
        : sectionMeets;
      if (targetMeets.length === 0) return null;
      return (
        <SectionWrapper>
          <PacketMeetResults meets={targetMeets} athletes={athletes} />
        </SectionWrapper>
      );
    }

    if (section.type === "athlete_pages") {
      if (!season || athletes.length === 0) return null;
      return (
        <SectionWrapper>
          <PacketAthletePages
            season={season}
            meets={sectionMeets}
            athletes={athletes}
            options={{
              showResults: section.showResults,
              showPRs: section.showPRs,
              showPoints: section.showPoints,
              showBadges: section.showBadges,
              showStreak: section.showStreak,
            }}
          />
        </SectionWrapper>
      );
    }

    if (section.type === "text_block") {
      const title = section.title?.trim();
      if (!title) return null; // skip empty title blocks
      return (
        <SectionWrapper>
          <PacketTextBlock title={title} body={section.body || ""} />
        </SectionWrapper>
      );
    }

    if (section.type === "image") {
      const url = section.url?.trim();
      if (!url) return null;
      return (
        <SectionWrapper>
          <PacketImage url={url} caption={section.caption || ""} />
        </SectionWrapper>
      );
    }

    return null;
  } catch {
    // fail-safe: if a section crashes, skip it silently
    return null;
  }
}

export default function PacketPreview({ title, sections, seasons, meets, athletes }) {
  return (
    <div className="packet-preview bg-white text-gray-900 p-8 min-h-screen font-sans">
      {/* Packet header */}
      <div className="text-center border-b-2 border-gray-200 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {sections.map((section) => (
        <SafeSection
          key={section.id}
          section={section}
          seasons={seasons}
          meets={meets}
          athletes={athletes}
        />
      ))}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .packet-preview, .packet-preview * { visibility: visible; }
          .packet-preview { position: absolute; left: 0; top: 0; width: 100%; }
          .packet-section { page-break-inside: avoid; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}