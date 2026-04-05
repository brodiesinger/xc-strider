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

export default function PacketAthleteStatsBlock({ block, meets, athletes }) {
  const [results, setResults] = useState([]);
  const [prs, setPRs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const season = block.seasonId;
  const athleteEmail = block.athleteEmail;
  const athlete = athletes.find((a) => a.email === athleteEmail);
  const seasonMeets = meets.filter((m) => m.season_id === season);
  const meetIdsKey = seasonMeets.map((m) => m.id).join(",");

  useEffect(() => {
    if (!athleteEmail || seasonMeets.length === 0) { setLoaded(true); return; }
    const load = async () => {
      try {
        const [resultChunks, prData] = await Promise.all([
          Promise.all(
            seasonMeets.map((m) =>
              base44.entities.MeetResult.filter({ meet_id: m.id, athlete_id: athleteEmail }).catch(() => [])
            )
          ),
          base44.entities.RacePR.filter({ athlete_email: athleteEmail }).catch(() => []),
        ]);
        setResults(resultChunks.flat());
        setPRs(prData || []);
      } catch {
        // safe fallback
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [athleteEmail, meetIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!athlete) return null;
  if (!loaded) return <p className="text-gray-400 text-sm py-2">Loading stats for {athleteEmail}...</p>;

  const ranResults = results.filter((r) => !r.did_not_run);
  const dnrResults = results.filter((r) => r.did_not_run);
  const totalPoints = ranResults.reduce((sum, r) => sum + (Number(r.points) || 0), 0);

  const bestTime = (() => {
    let best = null, bestSecs = Infinity;
    for (const r of ranResults) {
      const s = timeToSeconds(r.time);
      if (s !== null && s < bestSecs) { bestSecs = s; best = r.time; }
    }
    return best;
  })();

  const hasData = ranResults.length > 0 || dnrResults.length > 0 || prs.length > 0;
  if (!hasData) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-3 mb-4">
        <h3 className="text-xl font-bold text-gray-900">{athlete.full_name || athlete.email}</h3>
        {block.showPoints && (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            <p className="text-xs text-gray-400">Season Points</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <p className="font-semibold text-gray-800">{ranResults.length}</p>
          <p className="text-gray-400 text-xs">Meets Run</p>
        </div>
        {bestTime && (
          <div>
            <p className="font-semibold text-gray-800 font-mono">{bestTime}</p>
            <p className="text-gray-400 text-xs">Best Time</p>
          </div>
        )}
      </div>

      {/* Results table */}
      {block.showResults && ranResults.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Race Results</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-1 text-gray-600 font-medium">Meet</th>
                <th className="text-right py-1 text-gray-600 font-medium">Time</th>
                <th className="text-right py-1 text-gray-600 font-medium">Place</th>
                {block.showPoints && <th className="text-right py-1 text-gray-600 font-medium">Pts</th>}
              </tr>
            </thead>
            <tbody>
              {ranResults.map((r) => {
                const meet = seasonMeets.find((m) => m.id === r.meet_id);
                return (
                  <tr key={r.meet_id || r.id} className="border-b border-gray-100">
                    <td className="py-1 text-gray-800">{meet?.meet_name || r.meet_id}</td>
                    <td className="py-1 text-right font-mono text-gray-800">{r.time || "—"}</td>
                    <td className="py-1 text-right text-gray-800">{r.place != null ? `#${r.place}` : "—"}</td>
                    {block.showPoints && <td className="py-1 text-right text-gray-800">{r.points ?? 0}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DNR */}
      {block.showResults && dnrResults.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Did Not Run</p>
          {dnrResults.map((r) => {
            const meet = seasonMeets.find((m) => m.id === r.meet_id);
            return (
              <p key={r.meet_id || r.id} className="text-xs text-gray-500">
                {meet?.meet_name || r.meet_id}{r.reason ? ` — ${r.reason}` : ""}
              </p>
            );
          })}
        </div>
      )}

      {/* PRs */}
      {block.showPRs && prs.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Personal Records</p>
          <div className="flex gap-6">
            {prs.map((pr) => (
              <div key={pr.id || pr.distance} className="text-center">
                <p className="text-lg font-bold text-gray-900 font-mono">
                  {Math.floor(pr.time_minutes)}:{String(Math.round((pr.time_minutes % 1) * 60)).padStart(2, "0")}
                </p>
                <p className="text-xs text-gray-400">{pr.distance}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}