import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AthleteWorkouts from "@/components/coach/AthleteWorkouts";
import CreateTeam from "@/components/coach/CreateTeam";
import CoachInsightsTab from "@/components/coach/CoachInsightsTab";
import CoachPerformanceTab from "@/components/coach/CoachPerformanceTab";
import BottomNav from "@/components/coach/BottomNav";
import CoachHomeTab from "@/components/coach/CoachHomeTab";
import CoachSettingsTab from "@/components/coach/CoachSettingsTab";

export default function CoachDashboard() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user?.team_id) {
      setLoading(false);
      return;
    }
    const loadTeam = async () => {
      setLoading(true);
      try {
        const found = await base44.entities.Team.get(user.team_id);
        if (!found) return;
        setTeam(found);
        const [ann, sched] = await Promise.all([
          base44.entities.Announcement.filter({ team_id: found.id }, "-created_date", 20),
          base44.entities.PracticeSchedule.filter({ team_id: found.id }, "date", 50),
        ]);
        setAnnouncements(ann);
        setSchedule(sched);
        try {
          const res = await base44.functions.invoke("getTeamAthletes", { team_id: found.id });
          const athleteList = res.data?.athletes || [];
          setAthletes(athleteList);
          // Load all team workouts for home dashboard summary
          if (athleteList.length > 0) {
            const allWorkouts = await base44.entities.Workout.filter({ team_id: found.id }, "-date", 200);
            setWorkouts(allWorkouts);
          }
        } catch {
          setAthletes([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [user?.team_id]);

  const handleTeamCreated = (newTeam) => {
    setTeam(newTeam);
    setAthletes([]);
    setAnnouncements([]);
    setSchedule([]);
    setWorkouts([]);
  };

  const refreshAnnouncements = async () => {
    if (!team) return;
    const ann = await base44.entities.Announcement.filter({ team_id: team.id }, "-created_date", 20);
    setAnnouncements(ann);
  };

  const refreshSchedule = async () => {
    if (!team) return;
    const sched = await base44.entities.PracticeSchedule.filter({ team_id: team.id }, "date", 50);
    setSchedule(sched);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Athlete detail view (full-screen overlay, no bottom nav)
  if (selectedAthlete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => setSelectedAthlete(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <AthleteWorkouts athlete={selectedAthlete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        {!team ? (
          <div className="py-8">
            <h1 className="text-2xl font-bold text-foreground mb-6">Welcome, Coach 👋</h1>
            <CreateTeam user={user} onTeamCreated={handleTeamCreated} />
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <CoachHomeTab
                user={user}
                team={team}
                athletes={athletes}
                announcements={announcements}
                schedule={schedule}
                workouts={workouts}
                onAnnouncementPosted={refreshAnnouncements}
                onScheduleRefresh={refreshSchedule}
                onSelectAthlete={setSelectedAthlete}
                onOpenInsights={() => setActiveTab("insights")}
              />
            )}
            {activeTab === "performance" && (
              <div className="pb-24">
                <h1 className="text-2xl font-bold text-foreground mb-6">Performance</h1>
                <CoachPerformanceTab athletes={athletes} teamId={team.id} />
              </div>
            )}
            {activeTab === "insights" && (
              <div className="pb-24">
                <h1 className="text-2xl font-bold text-foreground mb-6">Insights</h1>
                <CoachInsightsTab athletes={athletes} teamId={team.id} />
              </div>
            )}
            {activeTab === "settings" && (
              <CoachSettingsTab user={user} team={team} />
            )}
          </>
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}