import React, { useEffect, useState } from "react";
import { TreePine, LogOut, ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import AthleteList from "@/components/coach/AthleteList";
import AthleteWorkouts from "@/components/coach/AthleteWorkouts";
import CreateTeam from "@/components/coach/CreateTeam";
import TeamHeader from "@/components/coach/TeamHeader";

// Build a deduplicated athlete list from workouts since coaches can't list all users
function buildAthleteRoster(workouts) {
  const map = new Map();
  for (const w of workouts) {
    if (w.athlete_email && !map.has(w.athlete_email)) {
      map.set(w.athlete_email, {
        id: w.athlete_email,
        email: w.athlete_email,
        full_name: w.athlete_name || null,
      });
    }
  }
  return Array.from(map.values());
}

export default function CoachDashboard() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const loadTeamAndRoster = async (me) => {
    if (!me.team_id) return;
    const teams = await base44.entities.Team.filter({ id: me.team_id });
    if (teams.length > 0) {
      setTeam(teams[0]);
      const workouts = await base44.entities.Workout.filter({ team_id: me.team_id }, "-date", 500);
      setAthletes(buildAthleteRoster(workouts));
    }
  };

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      if (me.role !== "coach") {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      await loadTeamAndRoster(me);
      setLoading(false);
    };
    init();
  }, []);

  const handleTeamCreated = async (newTeam) => {
    setTeam(newTeam);
    setAthletes([]); // fresh team, no athletes yet
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="text-2xl font-bold text-foreground mb-2">Access Denied</p>
          <p className="text-muted-foreground text-sm">This page is for coaches only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <TreePine className="w-5 h-5" />
            XC Team App
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => base44.auth.logout("/")}
            className="gap-2 text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {selectedAthlete ? (
          <>
            <button
              onClick={() => setSelectedAthlete(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to roster
            </button>
            <AthleteWorkouts athlete={selectedAthlete} />
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">Coach Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome, {user?.full_name || user?.email}
              </p>
            </div>

            {!team ? (
              <CreateTeam user={user} onTeamCreated={handleTeamCreated} />
            ) : (
              <>
                <TeamHeader team={team} />
                <AthleteList athletes={athletes} onSelect={setSelectedAthlete} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}