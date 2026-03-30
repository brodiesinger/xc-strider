import React, { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AthleteList from "@/components/coach/AthleteList";
import AthleteWorkouts from "@/components/coach/AthleteWorkouts";
import CreateTeam from "@/components/coach/CreateTeam";
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

export default function CoachDashboard() {
  const { user, isLoadingAuth } = useAuth();
  const [team, setTeam] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [activeTab, setActiveTab] = useState("roster");
  const [roleAssigned, setRoleAssigned] = useState(false);

  // Step 1: assign coach role if needed
  useEffect(() => {
    if (isLoadingAuth || !user) return;

    if (user.role !== "coach") {
      base44.auth.updateMe({ role: "coach" }).then(() => setRoleAssigned((v) => !v));
    } else {
      setRoleAssigned(true);
    }
  }, [user, isLoadingAuth]);

  // Step 2: load team once role is confirmed
  useEffect(() => {
    if (!user || !user.team_id) return;

    const loadTeam = async () => {
      setLoadingTeam(true);
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
          setAthletes(res.data?.athletes || []);
        } catch {
          setAthletes([]);
        }
      } finally {
        setLoadingTeam(false);
      }
    };

    loadTeam();
  }, [user?.team_id]);

  const handleTeamCreated = async (newTeam) => {
    setTeam(newTeam);
    setAthletes([]);
    setAnnouncements([]);
    setSchedule([]);
  };

  if (isLoadingAuth || loadingTeam) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar title={team ? team.name : "XC Team App"} subtitle={team ? `Join Code: ${team.join_code}` : null} />
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
                Welcome, {user.full_name || user.email}
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
                    <WeeklyScheduleManager teamId={team.id} schedule={schedule} onRefresh={async () => {
                      const sched = await base44.entities.PracticeSchedule.filter({ team_id: team.id }, "date", 50);
                      setSchedule(sched);
                    }} />
                    <CoachTeamDashboard
                      team={team}
                      user={user}
                      announcements={announcements}
                      schedule={schedule}
                      onAnnouncementPosted={async () => {
                        const ann = await base44.entities.Announcement.filter({ team_id: team.id }, "-created_date", 20);
                        setAnnouncements(ann);
                      }}
                      onScheduleRefresh={async () => {
                        const sched = await base44.entities.PracticeSchedule.filter({ team_id: team.id }, "date", 50);
                        setSchedule(sched);
                      }}
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