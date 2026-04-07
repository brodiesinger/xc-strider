import React, { useEffect, useState, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import SeasonList from "@/components/seasons/SeasonList";
import { CalendarRange } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InlineSpinner, ErrorState, SkeletonList } from "@/components/shared/LoadingSkeleton";

export default function SeasonMeets() {
  const { currentUser: user } = useCurrentUser();
  const navigate = useNavigate();
  const loadingRef = useRef(false);

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

  console.log("[SeasonMeets] user role:", user?.role, "user_type:", user?.user_type, "isCoach:", isCoach);

  const fetchSeasons = useCallback(async () => {
    if (!teamId) { setLoading(false); return; }
    try {
      const data = await base44.entities.Season.filter({ team_id: teamId }, "-created_date", 100);
      setSeasons(data || []);
    } catch {
      setError(true);
    }
  }, [teamId]);

  const fetchMeets = useCallback(async () => {
    if (!teamId) return;
    try {
      // Fetch all meets for seasons in this team
      const allSeasons = await base44.entities.Season.filter({ team_id: teamId }, "-created_date", 100);
      const seasonIds = allSeasons.map((s) => s.id);
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
        const [,, athleteRes] = await Promise.all([
          fetchSeasons(),
          fetchMeets(),
          base44.functions.invoke("getTeamAthletes", { team_id: teamId }).catch(() => null),
        ]);
        setAthletes(athleteRes?.data?.athletes || []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, teamId]);

  const handleSeasonsChanged = async () => {
    await fetchSeasons();
    await fetchMeets();
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