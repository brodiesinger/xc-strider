import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getDisplayName } from "@/lib/displayName";

function timeToSeconds(t) {
  if (!t) return null;
  const parts = t.trim().split(":").map(Number);
  if (parts.some((n) => isNaN(n))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function MeetResultTable({ meet, results, athleteMap = {} }) {
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{meet.meet_name}</h3>
        {meet.meet_date && <span className="text-xs text-gray-400">{meet.meet_date}</span>}
      </div>
      {meet.conditions && <p className="text-xs text-gray-500 mb-2">Conditions: {meet.conditions}</p>}

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
        <div className="text-xs text-gray-500">
          <span className="font-medium">Did Not Run: </span>
          {dnrs.map((r, i) => (
            <span key={r.athlete_id}>{getName(r.athlete_id)}{r.reason ? ` (${r.reason})` : ""}{i < dnrs.length - 1 ? ", " : ""}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PacketMeetResults({ meets, teamId }) {
  const [resultsByMeet, setResultsByMeet] = useState({});
  const [athleteMap, setAthleteMap] = useState({});
  const [loaded, setLoaded] = useState(false);

  const meetIdsKey = meets.map((m) => m.id).join(",");

  useEffect(() => {
    if (!meets || meets.length === 0) { setLoaded(true); return; }
    Promise.all([
      Promise.all(
        meets.map((m) => base44.entities.MeetResult.filter({ meet_id: m.id }).catch(() => []).then((r) => [m.id, r || []]))
      ),
      teamId ? base44.functions.invoke("getTeamAthletes", { team_id: teamId }).catch(() => null) : Promise.resolve(null),
    ]).then(([pairs, athleteRes]) => {
      const map = {};
      pairs.forEach(([id, results]) => { map[id] = results; });
      setResultsByMeet(map);
      
      const athletes = athleteRes?.data?.athletes || [];
      const aMap = {};
      athletes.forEach((a) => { aMap[a.email] = a; });
      setAthleteMap(aMap);
      
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [meetIdsKey, teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <div className="text-gray-400 text-sm py-2">Loading results...</div>;

  const meetsWithData = meets.filter((m) => (resultsByMeet[m.id] || []).length > 0);
  if (meetsWithData.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Meet Results</h2>
      {meetsWithData.map((meet) => (
        <MeetResultTable
          key={meet.id}
          meet={meet}
          results={resultsByMeet[meet.id] || []}
          athleteMap={athleteMap}
        />
      ))}
    </div>
  );
}