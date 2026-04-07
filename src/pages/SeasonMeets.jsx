import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import SeasonList from "@/components/seasons/SeasonList";
import { CalendarRange } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InlineSpinner, ErrorState } from "@/components/shared/LoadingSkeleton";

export default function SeasonMeets() {
  const { currentUser: user } = useCurrentUser();
  const navigate = useNavigate();
  // If accessed as a standalone page (not embedded in CoachDashboard), redirect coaches to the dashboard
  useEffect(() => {
    // Only redirect if we're actually on the /seasons route (not embedded)
    if (window.location.pathname === "/seasons" && user?.user_type === "coach") {
      navigate("/coach?tab=seasons", { replace: true });
    }
  }, [user, navigate]);

  const [seasons, setSeasons] = useState([]);
  const [meets, setMeets] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const teamId = user?.team_id;
  const isCoach = user?.user_type === "coach";

  const fetchMeets = useCallback(async (seasonList) => {
    if (!teamId) return;
    try {
      // Use provided season list or re-fetch if not given
      const list = seasonList ?? await base44.entities.Season.filter({ team_id: teamId }, "-created_date", 100).catch(() => []);
      const seasonIds = list.map((s) => s.id);
      if (seasonIds.length === 0) { setMeets([]); return; }
      const allMeets = await base44.entities.Meet.list("-created_date", 500);
      setMeets((allMeets || []).filter((m) => seasonIds.includes(m.season_id)));
    } catch {
      setMeets([]);
    }
  }, [teamId]);

  useEffect(() => {
    if (!user || !teamId) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        // Fetch seasons + athletes in parallel, then fetch meets using the seasons result (no double-fetch)
        const [seasonData, athleteRes] = await Promise.all([
          base44.entities.Season.filter({ team_id: teamId }, "-created_date", 100).catch(() => []),
          base44.functions.invoke("getTeamAthletes", { team_id: teamId }).catch(() => null),
        ]);
        setSeasons(seasonData || []);
        setAthletes(athleteRes?.data?.athletes || []);
        await fetchMeets(seasonData || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, teamId]);

  const handleSeasonsChanged = async () => {
    const updated = await base44.entities.Season.filter({ team_id: teamId }, "-created_date", 100).catch(() => []);
    setSeasons(updated || []);
    await fetchMeets(updated || []);
  };

  const handleMeetsChanged = async () => {
    await fetchMeets();
  };

  if (loading) return <InlineSpinner label="Loading seasons..." className="py-16" />;
  if (error) return <ErrorState message="Unable to load seasons." className="py-16" />;

  return (
    <div className="pb-28">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarRange className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Season Meets</h1>
            <p className="text-sm text-muted-foreground">
              {isCoach ? "Manage your team's seasons and meets" : "View your team's seasons and meets"}
            </p>
          </div>
        </div>

        {!teamId ? (
          <p className="text-sm text-muted-foreground">No team found. Join or create a team first.</p>
        ) : (
          <SeasonList
            seasons={seasons}
            meets={meets}
            athletes={athletes}
            teamId={teamId}
            coachEmail={user?.email}
            isCoach={isCoach}
            onSeasonsChanged={handleSeasonsChanged}
            onMeetsChanged={handleMeetsChanged}
            athleteEmail={!isCoach ? user?.email : undefined}
          />
        )}
      </div>
    </div>
  );
}