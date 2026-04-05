import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function PacketSeasonOverview({ season, meets, athleteCount = 0 }) {
  const [allResults, setAllResults] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const meetIdsKey = meets.map((m) => m.id).join(",");

  useEffect(() => {
    if (!meets || meets.length === 0) { setLoaded(true); return; }
    Promise.all(
      meets.map((m) => base44.entities.MeetResult.filter({ meet_id: m.id }).catch(() => []))
    ).then((chunks) => {
      setAllResults(chunks.flat());
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [meetIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <div className="text-gray-400 text-sm py-2">Loading overview...</div>;

  const runnerResults = allResults.filter((r) => !r.did_not_run && r.time);
  const uniqueAthletes = new Set(runnerResults.map((r) => r.athlete_id)).size;
  const totalPoints = allResults
    .filter((r) => !r.did_not_run)
    .reduce((sum, r) => sum + (Number(r.points) || 0), 0);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{season.season_name} — Overview</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{meets.length}</p>
          <p className="text-xs text-gray-500 mt-1">Meets</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{athleteCount}</p>
          <p className="text-xs text-gray-500 mt-1">Athletes</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
          <p className="text-xs text-gray-500 mt-1">Total Points</p>
        </div>
      </div>
      {meets.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Meets This Season</p>
          <ul className="space-y-1">
            {meets.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm text-gray-800 border-b border-gray-100 pb-1">
                <span>{m.meet_name}</span>
                {m.meet_date && <span className="text-gray-400 text-xs">{m.meet_date}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}