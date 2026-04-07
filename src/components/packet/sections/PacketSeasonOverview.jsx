import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Which lineup groups to show for each filter
const FILTER_SECTIONS = {
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

function GroupStats({ label, athleteEmails, allResults, meets }) {
  if (!athleteEmails || athleteEmails.length === 0) return null;
  const emailSet = new Set(athleteEmails);
  const groupResults = allResults.filter((r) => emailSet.has(r.athlete_id) && !r.did_not_run && r.time);
  const totalPoints = allResults
    .filter((r) => emailSet.has(r.athlete_id) && !r.did_not_run)
    .reduce((sum, r) => sum + (Number(r.points) || 0), 0);

  // Best time per athlete across the season
  const bestTimes = {};
  groupResults.forEach((r) => {
    const secs = timeToSeconds(r.time);
    if (secs === null) return;
    if (!bestTimes[r.athlete_id] || secs < bestTimes[r.athlete_id]) {
      bestTimes[r.athlete_id] = secs;
    }
  });

  return (
    <div className="mb-6">
      <h3 className="text-base font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3">{label}</h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{athleteEmails.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Athletes</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{meets.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Meets</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Pts</p>
        </div>
      </div>
    </div>
  );
}

export default function PacketSeasonOverview({ season, meets = [], filter = "whole_team", athleteCount = 0 }) {
  const [allResults, setAllResults] = useState([]);
  const [lineupByMeet, setLineupByMeet] = useState({}); // meetId -> [{ athlete_id, team_group }]
  const [loaded, setLoaded] = useState(false);

  const meetIdsKey = (meets || []).map((m) => m.id).join(",");

  useEffect(() => {
    const safeMeets = meets || [];
    if (safeMeets.length === 0) { setLoaded(true); return; }
    setLoaded(false);
    Promise.all([
      Promise.all(safeMeets.map((m) => base44.entities.MeetResult.filter({ meet_id: m.id }).catch(() => []))),
      Promise.all(safeMeets.map((m) => base44.entities.MeetLineup.filter({ meet_id: m.id }).catch(() => []))),
    ]).then(([resultChunks, lineupChunks]) => {
      setAllResults(resultChunks.flat());
      const lmap = {};
      safeMeets.forEach((m, i) => { lmap[m.id] = lineupChunks[i] || []; });
      setLineupByMeet(lmap);
      setLoaded(true);
    }).catch(() => { setAllResults([]); setLineupByMeet({}); setLoaded(true); });
  }, [meetIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!season) return null;
  if (!loaded) return <div className="text-gray-400 text-sm py-2">Loading overview...</div>;

  const sections = FILTER_SECTIONS[filter] || FILTER_SECTIONS.whole_team;

  const safeMeets = meets || [];

  // Build a map: athlete_id -> most common group across all meets
  const groupVotes = {}; // athleteEmail -> { [groupKey]: count }
  safeMeets.forEach((m) => {
    (lineupByMeet[m.id] || []).forEach((r) => {
      if (!groupVotes[r.athlete_id]) groupVotes[r.athlete_id] = {};
      groupVotes[r.athlete_id][r.team_group] = (groupVotes[r.athlete_id][r.team_group] || 0) + 1;
    });
  });

  // Resolve each athlete's dominant group
  const athleteGroupMap = {}; // athleteEmail -> groupKey
  Object.entries(groupVotes).forEach(([email, votes]) => {
    const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    if (best) athleteGroupMap[email] = best[0];
  });

  // Collect athletes per section
  const sectionAthletes = {};
  sections.forEach((s) => { sectionAthletes[s.key] = []; });
  Object.entries(athleteGroupMap).forEach(([email, group]) => {
    if (sectionAthletes[group]) sectionAthletes[group].push(email);
  });

  // Check if we have any lineup data at all
  const hasLineup = Object.keys(athleteGroupMap).length > 0;

  const totalPoints = allResults
    .filter((r) => !r.did_not_run)
    .reduce((sum, r) => sum + (Number(r.points) || 0), 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{season.season_name} — Overview</h2>

      {/* Season-level stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{safeMeets.length}</p>
          <p className="text-xs text-gray-500 mt-1">Meets</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{athleteCount || new Set(allResults.map((r) => r.athlete_id)).size}</p>
          <p className="text-xs text-gray-500 mt-1">Athletes</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
          <p className="text-xs text-gray-500 mt-1">Total Points</p>
        </div>
      </div>

      {/* Grouped section stats — only if lineup data exists */}
      {hasLineup && sections.map((section) => (
        <GroupStats
          key={section.key}
          label={section.label}
          athleteEmails={sectionAthletes[section.key]}
          allResults={allResults}
          meets={meets}
        />
      ))}

      {/* Meets list with team placements */}
      {safeMeets.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Meets This Season</p>
          <ul className="space-y-2">
            {safeMeets.map((m) => {
              // Determine which placement fields to show based on filter
              const filterFields = {
                whole_team: ["varsity_boys_place","jv_boys_place","varsity_girls_place","jv_girls_place"],
                boys:  ["varsity_boys_place","jv_boys_place"],
                girls: ["varsity_girls_place","jv_girls_place"],
              };
              const placeFieldLabels = {
                varsity_boys_place:  "Varsity Boys",
                jv_boys_place:       "JV Boys",
                varsity_girls_place: "Varsity Girls",
                jv_girls_place:      "JV Girls",
              };
              const fields = filterFields[filter] || filterFields.whole_team;
              const filledFields = fields.filter((f) => m[f] != null);
              const ordStr = (n) => { const s=["th","st","nd","rd"],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
              return (
                <li key={m.id} className="border-b border-gray-100 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-800">{m.meet_name}</span>
                    {m.meet_date && <span className="text-gray-400 text-xs">{m.meet_date}</span>}
                  </div>
                  {filledFields.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {filledFields.map((f) => (
                        <span key={f} className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {placeFieldLabels[f]}: {ordStr(m[f])}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}