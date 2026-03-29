import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import AthleteList from "@/components/coach/AthleteList";
import AthleteWorkouts from "@/components/coach/AthleteWorkouts";
import CreateTeam from "@/components/coach/CreateTeam";
import TeamHeader from "@/components/coach/TeamHeader";
import CoachTeamDashboard from "@/components/coach/CoachTeamDashboard";
import CoachInsightsTab from "@/components/coach/CoachInsightsTab";
import CoachPerformanceTab from "@/components/coach/CoachPerformanceTab";
import WeeklyScheduleManager from "@/components/coach/WeeklyScheduleManager";
import NavBar from "@/components/shared/NavBar";
import TabNav from "@/components/shared/TabNav";

const TABS = [
  { id: "roster", label: "Roster" },
  { id: "performance", label: "Performance" },
  { id: "insights", label: "Insights" },
  { id: "team", label: "Team Dashboard" },
];

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
  const [schedule, setSchedule] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");

  const fetchAnnouncements = async (teamId) => {
    const data = await base44.entities.Announcement.filter({ team_id: teamId }, "-created_date", 20);
    setAnnouncements(data);
  };

  const fetchSchedule = async (teamId) => {
    const data = await base44.entities.PracticeSchedule.filter({ team_id: teamId }, "date", 50);
    setSchedule(data);
  };

  const loadTeamAndRoster = async (me) => {
    if (!me.team_id) return;
    const teams = await base44.entities.Team.list();
    const found = teams.find((t) => t.id === me.team_id);
    if (found) {
      setTeam(found);
      const [workouts] = await Promise.all([
        base44.entities.Workout.filter({ team_id: me.team_id }, "-date", 500),
        fetchAnnouncements(me.team_id),
        fetchSchedule(me.team_id),
      ]);
      setAthletes(buildAthleteRoster(workouts));
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (me.role !== "coach") {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
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
    setSchedule([]);
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
      <NavBar title={team ? team.name : "XC Team App"} subtitle={team ? `Code: ${team.join_code}` : null} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {selectedAthlete ? (
          <>
            <button
              onClick={() => setSelectedAthlete(null)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to roster
            </button>
            <AthleteWorkouts athlete={selectedAthlete} />
          </>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Coach Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome, {user?.full_name || user?.email}
              </p>
            </div>

            {!team ? (
              <CreateTeam user={user} onTeamCreated={handleTeamCreated} />
            ) : (
              <>
                <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />

                {activeTab === "roster" && (
                  <AthleteList athletes={athletes} onSelect={setSelectedAthlete} />
                )}

                {activeTab === "performance" && (
                  <CoachPerformanceTab athletes={athletes} teamId={team.id} />
                )}

                {activeTab === "insights" && (
                  <CoachInsightsTab athletes={athletes} teamId={team.id} />
                )}

                {activeTab === "team" && (
                  <div className="space-y-6">
                    <WeeklyScheduleManager teamId={team.id} schedule={schedule} onRefresh={() => fetchSchedule(team.id)} />
                    <CoachTeamDashboard
                      team={team}
                      user={user}
                      announcements={announcements}
                      schedule={schedule}
                      onAnnouncementPosted={() => fetchAnnouncements(team.id)}
                      onScheduleRefresh={() => fetchSchedule(team.id)}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}