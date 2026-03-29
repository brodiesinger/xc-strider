import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import AthleteList from "@/components/coach/AthleteList";
import AthleteWorkouts from "@/components/coach/AthleteWorkouts";
import CreateTeam from "@/components/coach/CreateTeam";
import TeamHeader from "@/components/coach/TeamHeader";
import PostAnnouncement from "@/components/coach/PostAnnouncement";
import AnnouncementFeed from "@/components/shared/AnnouncementFeed";
import NavBar from "@/components/shared/NavBar";

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
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchAnnouncements = async (teamId) => {
    const data = await base44.entities.Announcement.filter({ team_id: teamId }, "-created_date", 20);
    setAnnouncements(data);
  };

  const loadTeamAndRoster = async (me) => {
    if (!me.team_id) return false;
    const teams = await base44.entities.Team.list();
    const found = teams.find((t) => t.id === me.team_id);
    if (found) {
      setTeam(found);
      const [workouts] = await Promise.all([
        base44.entities.Workout.filter({ team_id: me.team_id }, "-date", 500),
        fetchAnnouncements(me.team_id),
      ]);
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
      try {
        await loadTeamAndRoster(me);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleTeamCreated = (newTeam) => {
    setTeam(newTeam);
    setAthletes([]);
    setAnnouncements([]);
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
      <NavBar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {selectedAthlete ? (
          <>
            <button
              onClick={() => setSelectedAthlete(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to roster
            </button>
            <AthleteWorkouts athlete={selectedAthlete} />
          </>
        ) : (
          <>
            <div>
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

                <section>
                  <h2 className="font-semibold text-foreground mb-3">Announcements</h2>
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                    <PostAnnouncement
                      teamId={team.id}
                      coachName={user?.full_name || user?.email}
                      onPosted={() => fetchAnnouncements(team.id)}
                    />
                    <AnnouncementFeed announcements={announcements} />
                  </div>
                </section>

                <section>
                  <AthleteList athletes={athletes} onSelect={setSelectedAthlete} />
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}