import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import SeasonList from "@/components/seasons/SeasonList";
import { CalendarRange } from "lucide-react";

export default function SeasonMeets() {
  const { currentUser: user } = useCurrentUser();
  const navigate = useNavigate();

  const [seasons, setSeasons] = useState([]);
  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const teamId = user?.team_id;
  const isCoach = user?.user_type === "coach";

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
    if (!user) { navigate("/"); return; }
    if (!teamId) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        await Promise.all([fetchSeasons(), fetchMeets()]);
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

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Unable to load seasons.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
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
            teamId={teamId}
            coachEmail={user?.email}
            isCoach={isCoach}
            onSeasonsChanged={handleSeasonsChanged}
            onMeetsChanged={handleMeetsChanged}
          />
        )}
      </div>
    </div>
  );
}