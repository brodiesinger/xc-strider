import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function PRsBlock({ athleteEmail }) {
  const [prs, setPRs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!athleteEmail) { setLoaded(true); return; }
    base44.entities.RacePR.filter({ athlete_email: athleteEmail })
      .then((data) => { setPRs(data || []); })
      .catch(() => { setPRs([]); })
      .finally(() => setLoaded(true));
  }, [athleteEmail]);

  if (!loaded) return <p className="text-gray-400 text-sm py-2">Loading PRs...</p>;
  if (prs.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-3">Personal Records</h3>
      <div className="flex flex-wrap gap-6">
        {prs.map((pr) => (
          <div key={pr.id || pr.distance} className="text-center border border-gray-200 rounded-lg px-5 py-3">
            <p className="text-2xl font-bold text-gray-900 font-mono">
              {Math.floor(pr.time_minutes)}:{String(Math.round((pr.time_minutes % 1) * 60)).padStart(2, "0")}
            </p>
            <p className="text-xs text-gray-500 mt-1">{pr.distance}</p>
          </div>
        ))}
      </div>
    </div>
  );
}