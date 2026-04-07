import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getDisplayName } from "@/lib/displayName";

// Sections per groupBy value
const GROUP_SECTIONS = {
  whole_team: [
    { key: "varsity_boys",  label: "Varsity Boys" },
    { key: "jv_boys",       label: "JV Boys" },
    { key: "varsity_girls", label: "Varsity Girls" },
    { key: "jv_girls",      label: "JV Girls" },
  ],
  boys: [
    { key: "varsity_boys", label: "Varsity Boys" },
    { key: "jv_boys",      label: "JV Boys" },
  ],
  girls: [
    { key: "varsity_girls", label: "Varsity Girls" },
    { key: "jv_girls",      label: "JV Girls" },
  ],
};

function timeToSeconds(t) {
  if (!t) return null;
  const parts = t.trim().split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function ResultTable({ results, athleteMap }) {
  const seen = new Set();
  const deduped = results.filter((r) => {
    if (!r.athlete_id || seen.has(r.athlete_id)) return false;
    seen.add(r.athlete_id);
    return true;
  });

  const runners = deduped
    .filter((r) => !r.did_not_run)
    .sort((a, b) => {
      if (a.place != null && b.place != null) return a.place - b.place;
      if (a.place != null) return -1;
      if (b.place != null) return 1;
      return (timeToSeconds(a.time) || 9999) - (timeToSeconds(b.time) || 9999);
    });

  const dnrs = deduped.filter((r) => r.did_not_run);

  if (deduped.length === 0) return null;

  const getName = (email) => {
    const athlete = athleteMap[email];
    return athlete ? getDisplayName(athlete) : email;
  };

  return (
    <>
      {runners.length > 0 && (
        <table className="w-full text-sm border-collapse mb-2">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-1 font-semibold text-gray-700">Athlete</th>
              <th className="text-right py-1 font-semibold text-gray-700">Time</th>
              <th className="text-right py-1 font-semibold text-gray-700">Place</th>
              <th className="text-right py-1 font-semibold text-gray-700">Pts</th>
            </tr>
          </thead>
          <tbody>
            {runners.map((r) => (
              <tr key={r.athlete_id} className="border-b border-gray-100">
                <td className="py-1 text-gray-800">{getName(r.athlete_id)}</td>
                <td className="py-1 text-right font-mono text-gray-800">{r.time || "—"}</td>
                <td className="py-1 text-right text-gray-800">{r.place != null ? `#${r.place}` : "—"}</td>
                <td className="py-1 text-right text-gray-800">{r.points ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dnrs.length > 0 && (
        <div className="text-xs text-gray-500 mb-2">
          <span className="font-medium">Did Not Run: </span>
          {dnrs.map((r, i) => (
            <span key={r.athlete_id}>
              {getName(r.athlete_id)}{r.reason ? ` (${r.reason})` : ""}{i < dnrs.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

// Flat (ungrouped) single meet table — original behavior
function FlatMeetBlock({ meet, results, athleteMap }) {
  const seen = new Set();
  const deduped = results.filter((r) => {
    if (!r.athlete_id || seen.has(r.athlete_id)) return false;
    seen.add(r.athlete_id);
    return true;
  });
  if (deduped.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{meet.meet_name}</h3>
        {meet.meet_date && <span className="text-xs text-gray-400">{meet.meet_date}</span>}
      </div>
      {meet.conditions && <p className="text-xs text-gray-500 mb-2">Conditions: {meet.conditions}</p>}
      <ResultTable results={deduped} athleteMap={athleteMap} />
    </div>
  );
}

// Grouped single meet block
function GroupedMeetBlock({ meet, results, lineup, athleteMap, sections }) {
  if (!results || results.length === 0) return null;

  // Build assignment map for this meet
  const assignmentMap = {};
  (lineup || []).forEach((r) => { assignmentMap[r.athlete_id] = r.team_group; });

  const hasLineup = Object.keys(assignmentMap).length > 0;

  // If no lineup data, fall back to flat rendering
  if (!hasLineup) {
    return <FlatMeetBlock meet={meet} results={results} athleteMap={athleteMap} />;
  }

  // Separate results into sections
  const sectionResults = {};
  sections.forEach((s) => { sectionResults[s.key] = []; });

  const seen = new Set();
  results.forEach((r) => {
    if (!r.athlete_id || seen.has(r.athlete_id)) return;
    seen.add(r.athlete_id);
    const group = assignmentMap[r.athlete_id];
    if (group && sectionResults[group]) {
      sectionResults[group].push(r);
    }
    // Unassigned athletes are intentionally omitted from printed packet
  });

  // Check if any section has data
  const hasSectionData = sections.some((s) => sectionResults[s.key].length > 0);
  if (!hasSectionData) {
    return <FlatMeetBlock meet={meet} results={results} athleteMap={athleteMap} />;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-900">{meet.meet_name}</h3>
        {meet.meet_date && <span className="text-xs text-gray-400">{meet.meet_date}</span>}
      </div>
      {meet.conditions && <p className="text-xs text-gray-500 mb-3">Conditions: {meet.conditions}</p>}

      {sections.map((section) => {
        const sResults = sectionResults[section.key];
        if (!sResults || sResults.length === 0) return null;
        return (
          <div key={section.key} className="mb-4">
            <p className="text-sm font-bold text-gray-700 border-b border-gray-200 pb-1 mb-2">{section.label}</p>
            <ResultTable results={sResults} athleteMap={athleteMap} />
          </div>
        );
      })}
    </div>
  );
}

export default function PacketMeetResults({ meets, teamId, groupBy = "none" }) {
  const [resultsByMeet, setResultsByMeet] = useState({});
  const [lineupByMeet, setLineupByMeet] = useState({});
  const [athleteMap, setAthleteMap] = useState({});
  const [loaded, setLoaded] = useState(false);

  const meetIdsKey = meets.map((m) => m.id).join(",");

  useEffect(() => {
    if (!meets || meets.length === 0) { setLoaded(true); return; }
    const load = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        const [resultPairs, lineupChunks, athleteRes] = await Promise.all([
          Promise.all(
            meets.map((m) => base44.entities.MeetResult.filter({ meet_id: m.id }).catch(() => []).then((r) => [m.id, r || []]))
          ),
          groupBy !== "none"
            ? Promise.all(meets.map((m) => base44.entities.MeetLineup.filter({ meet_id: m.id }).catch(() => [])))
            : Promise.resolve(meets.map(() => [])),
          isAuth && teamId
            ? base44.functions.invoke("getTeamAthletes", { team_id: teamId }).catch(() => ({ data: { athletes: [] } }))
            : Promise.resolve(null),
        ]);

        const rmap = {};
        resultPairs.forEach(([id, results]) => { rmap[id] = results; });
        setResultsByMeet(rmap);

        const lmap = {};
        meets.forEach((m, i) => { lmap[m.id] = lineupChunks[i] || []; });
        setLineupByMeet(lmap);

        const athletes = athleteRes?.data?.athletes || [];
        const aMap = {};
        athletes.forEach((a) => { aMap[a.email] = a; });
        setAthleteMap(aMap);

        setLoaded(true);
      } catch {
        setLoaded(true);
      }
    };
    load();
  }, [meetIdsKey, teamId, groupBy]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <div className="text-gray-400 text-sm py-2">Loading results...</div>;

  const meetsWithData = meets.filter((m) => (resultsByMeet[m.id] || []).length > 0);
  if (meetsWithData.length === 0) return null;

  const sections = GROUP_SECTIONS[groupBy];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Meet Results</h2>
      {meetsWithData.map((meet) =>
        groupBy !== "none" && sections ? (
          <GroupedMeetBlock
            key={meet.id}
            meet={meet}
            results={resultsByMeet[meet.id] || []}
            lineup={lineupByMeet[meet.id] || []}
            athleteMap={athleteMap}
            sections={sections}
          />
        ) : (
          <FlatMeetBlock
            key={meet.id}
            meet={meet}
            results={resultsByMeet[meet.id] || []}
            athleteMap={athleteMap}
          />
        )
      )}
    </div>
  );
}