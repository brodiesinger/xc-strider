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

function AthletePage({ athlete, meets, allResults, prs, options }) {
  // Get results for this athlete, deduplicated per meet
  const seenMeets = new Set();
  const myResults = [];
  for (const r of allResults) {
    if (r.athlete_id !== athlete.email) continue;
    if (!r.meet_id || seenMeets.has(r.meet_id)) continue;
    seenMeets.add(r.meet_id);
    myResults.push(r);
  }

  const ranResults = myResults.filter((r) => !r.did_not_run);
  const totalPoints = ranResults.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
  const myPRs = prs.filter((p) => p.athlete_email === athlete.email);

  const bestTime = (() => {
    let best = null, bestSecs = Infinity;
    for (const r of ranResults) {
      const s = timeToSeconds(r.time);
      if (s !== null && s < bestSecs) { bestSecs = s; best = r.time; }
    }
    return best;
  })();

  const hasAnyData = myResults.length > 0 || myPRs.length > 0;
  if (!hasAnyData) return null;

  return (
    <div className="break-before-page pt-2 pb-8 border-b-2 border-gray-200 mb-8">
      {/* Athlete header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-3 mb-4">
        <h2 className="text-xl font-bold text-gray-900">{athlete.full_name || athlete.email}</h2>
        {options.showPoints && (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
            <p className="text-xs text-gray-400">Season Points</p>
          </div>
        )}
      </div>

      {/* Summary row */}
      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <p className="font-semibold text-gray-800">{ranResults.length}</p>
          <p className="text-gray-400 text-xs">Meets Run</p>
        </div>
        {options.showPoints && bestTime && (
          <div>
            <p className="font-semibold text-gray-800 font-mono">{bestTime}</p>
            <p className="text-gray-400 text-xs">Best Time</p>
          </div>
        )}
      </div>

      {/* Results table */}
      {options.showResults && ranResults.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Race Results</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-1 text-gray-600 font-medium">Meet</th>
                <th className="text-right py-1 text-gray-600 font-medium">Time</th>
                <th className="text-right py-1 text-gray-600 font-medium">Place</th>
                {options.showPoints && <th className="text-right py-1 text-gray-600 font-medium">Pts</th>}
              </tr>
            </thead>
            <tbody>
              {ranResults.map((r) => {
                const meet = meets.find((m) => m.id === r.meet_id);
                return (
                  <tr key={r.meet_id} className="border-b border-gray-100">
                    <td className="py-1 text-gray-800">{meet?.meet_name || r.meet_id}</td>
                    <td className="py-1 text-right font-mono text-gray-800">{r.time || "—"}</td>
                    <td className="py-1 text-right text-gray-800">{r.place != null ? `#${r.place}` : "—"}</td>
                    {options.showPoints && <td className="py-1 text-right text-gray-800">{r.points ?? 0}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DNR */}
      {options.showResults && myResults.filter((r) => r.did_not_run).length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Did Not Run</p>
          {myResults.filter((r) => r.did_not_run).map((r) => {
            const meet = meets.find((m) => m.id === r.meet_id);
            return (
              <p key={r.meet_id} className="text-xs text-gray-500">
                {meet?.meet_name || r.meet_id}{r.reason ? ` — ${r.reason}` : ""}
              </p>
            );
          })}
        </div>
      )}

      {/* PRs */}
      {options.showPRs && myPRs.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Personal Records</p>
          <div className="flex gap-6">
            {myPRs.map((pr) => (
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

export default function PacketAthletePages({ season, meets, athletes, options }) {
  const [allResults, setAllResults] = useState([]);
  const [prs, setPRs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const meetIdsKey = meets.map((m) => m.id).join(",");

  useEffect(() => {
    const load = async () => {
      try {
        const [resultChunks, prData] = await Promise.all([
          Promise.all(
            meets.map((m) => base44.entities.MeetResult.filter({ meet_id: m.id }).catch(() => []))
          ),
          base44.entities.RacePR.list().catch(() => []),
        ]);
        setAllResults(resultChunks.flat());
        setPRs(prData || []);
      } catch {
        // safe fallback
      } finally {
        setLoaded(true);
      }
    };
    if (meets.length > 0) {
      load();
    } else {
      setLoaded(true);
    }
  }, [meetIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return <div className="text-gray-400 text-sm py-2">Loading athlete data...</div>;
  if (athletes.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Athlete Pages — {season.season_name}</h2>
      {athletes.map((athlete) => (
        <AthletePage
          key={athlete.email}
          athlete={athlete}
          meets={meets}
          allResults={allResults}
          prs={prs}
          options={options}
        />
      ))}
    </div>
  );
}