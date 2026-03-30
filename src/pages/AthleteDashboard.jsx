import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AthleteBottomNav from "@/components/athlete/AthleteBottomNav";
import AthleteDashboardHome from "@/components/athlete/AthleteDashboardHome";
import LogWorkoutDrawer from "@/components/athlete/LogWorkoutDrawer";
import AthleteProfileTab from "@/components/athlete/AthleteProfileTab";
import GoalTracker from "@/components/athlete/GoalTracker";
import RacePRManager from "@/components/athlete/RacePRManager";
import InjuryRiskTab from "@/components/athlete/insights/InjuryRiskTab";
import AIInjuryChat from "@/components/athlete/insights/AIInjuryChat";
import SmartRecoveryTab from "@/components/athlete/insights/SmartRecoveryTab";

export default function AthleteDashboard() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [insightTab, setInsightTab] = useState("risk");
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

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
        if (found) {
          setTeam(found);
          await Promise.all([fetchWorkouts(user), fetchTeamData(found.id)]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [user?.team_id]);

  const fetchWorkouts = async (me) => {
    if (!me?.email) return;
    setLoadingWorkouts(true);
    try {
      const data = await base44.entities.Workout.filter({ athlete_email: me.email }, "-date", 50);
      setWorkouts(data);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const fetchTeamData = async (teamId) => {
    const [ann, sched] = await Promise.all([
      base44.entities.Announcement.filter({ team_id: teamId }, "-created_date", 20).catch(() => []),
      base44.entities.PracticeSchedule.filter({ team_id: teamId }, "date", 50).catch(() => []),
    ]);
    setAnnouncements(ann);
    setSchedule(sched);
  };

  // "Log" tab in bottom nav opens drawer directly
  const handleTabChange = (tab) => {
    if (tab === "log") {
      setLogDrawerOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const navActiveTab = logDrawerOpen ? activeTab : activeTab;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">

        {activeTab === "dashboard" && (
          <AthleteDashboardHome
            user={user}
            team={team}
            workouts={workouts}
            announcements={announcements}
            schedule={schedule}
            onLogWorkout={() => setLogDrawerOpen(true)}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "performance" && (
          <div className="space-y-6 pb-28">
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Performance</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Your PRs and goals</p>
            </div>
            {loadingWorkouts ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <RacePRManager userEmail={user?.email} />
                <GoalTracker workouts={workouts} userEmail={user?.email} />
              </>
            )}
          </div>
        )}

        {activeTab === "insights" && (
          <div className="space-y-4 pb-28">
            <div className="pt-2">
              <h1 className="text-2xl font-bold text-foreground">Insights</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Recovery and injury intel</p>
            </div>
            {loadingWorkouts ? (
              <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex gap-1 bg-muted rounded-xl p-1">
                  {[
                    { id: "risk", label: "🛡️ Injury Risk" },
                    { id: "chat", label: "💬 AI Chat" },
                    { id: "recovery", label: "⚡ Recovery" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setInsightTab(t.id)}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                        insightTab === t.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {insightTab === "risk" && <InjuryRiskTab workouts={workouts} userEmail={user?.email} />}
                {insightTab === "chat" && <AIInjuryChat workouts={workouts} />}
                {insightTab === "recovery" && <SmartRecoveryTab workouts={workouts} userEmail={user?.email} />}
              </>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <AthleteProfileTab
            user={user}
            team={team}
            announcements={announcements}
            schedule={schedule}
          />
        )}
      </main>

      <AthleteBottomNav active={activeTab} onChange={handleTabChange} />

      <LogWorkoutDrawer
        open={logDrawerOpen}
        onClose={() => setLogDrawerOpen(false)}
        onSaved={() => fetchWorkouts(user)}
        teamId={team?.id}
      />
    </div>
  );
}