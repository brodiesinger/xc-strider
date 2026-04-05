import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

function timeToSeconds(t) {
  if (!t) return null;
  const parts = t.trim().split(":").map(Number);
  if (parts.some((n) => isNaN(n))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export default function StatsBlock({ athleteEmail, meets }) {
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const meetIdsKey = meets.map((m) => m.id).join(",");

  useEffect(() => {
    if (!athleteEmail || meets.length === 0) { setLoaded(true); return; }
    const load = async () => {
      try {
        const chunks = await Promise.all(
          meets.map((m) =>
            base44.entities.MeetResult.filter({ meet_id: m.id, athlete_id: athleteEmail }).catch(() => [])
          )
        );
        const seen = new Set();
        const deduped = chunks.flat().filter((r) => {
          if (!r.meet_id || seen.has(r.meet_id)) return false;
          seen.add(r.meet_id);
          return true;
        });
        setResults(deduped);
      } catch { /* safe */ } finally { setLoaded(true); }
    };
    load();
  }, [athleteEmail, meetIdsKey]); // eslint-disable-line

  if (!loaded) return <p className="text-gray-400 text-sm py-2">Loading stats...</p>;

  const ranResults = results.filter((r) => !r.did_not_run);
  const dnrResults = results.filter((r) => r.did_not_run);
  const totalPoints = ranResults.reduce((s, r) => s + (Number(r.points) || 0), 0);

  const bestTime = (() => {
    let best = null, bestSecs = Infinity;
    for (const r of ranResults) {
      const s = timeToSeconds(r.time);
      if (s !== null && s < bestSecs) { bestSecs = s; best = r.time; }
    }
    return best;
  })();

  if (ranResults.length === 0 && dnrResults.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">Season Stats</h3>
      <div className="flex gap-6 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{ranResults.length}</p>
          <p className="text-xs text-gray-500">Meets Run</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
          <p className="text-xs text-gray-500">Points</p>
        </div>
        {bestTime && (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 font-mono">{bestTime}</p>
            <p className="text-xs text-gray-500">Best Time</p>
          </div>
        )}
      </div>

      {ranResults.length > 0 && (
        <table className="w-full text-sm border-collapse mb-3">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-1 text-gray-600 font-medium">Meet</th>
              <th className="text-right py-1 text-gray-600 font-medium">Time</th>
              <th className="text-right py-1 text-gray-600 font-medium">Place</th>
              <th className="text-right py-1 text-gray-600 font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {ranResults.map((r) => {
              const meet = meets.find((m) => m.id === r.meet_id);
              return (
                <tr key={r.meet_id || r.id} className="border-b border-gray-100">
                  <td className="py-1 text-gray-800">{meet?.meet_name || "—"}</td>
                  <td className="py-1 text-right font-mono text-gray-800">{r.time || "—"}</td>
                  <td className="py-1 text-right text-gray-800">{r.place != null ? `#${r.place}` : "—"}</td>
                  <td className="py-1 text-right text-gray-800">{r.points ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {dnrResults.length > 0 && (
        <div className="text-xs text-gray-500">
          <span className="font-medium">Did Not Run: </span>
          {dnrResults.map((r, i) => {
            const meet = meets.find((m) => m.id === r.meet_id);
            return (
              <span key={r.meet_id || r.id}>
                {meet?.meet_name || "—"}{r.reason ? ` (${r.reason})` : ""}{i < dnrResults.length - 1 ? ", " : ""}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}