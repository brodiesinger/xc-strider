import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import JoinTeam from "@/components/athlete/JoinTeam";
import NavBar from "@/components/shared/NavBar";
import TabNav from "@/components/shared/TabNav";
import WeeklyMileage from "@/components/athlete/WeeklyMileage";
import PRTracker from "@/components/athlete/PRTracker";
import TeamDashboardView from "@/components/shared/TeamDashboardView";

import GoalTracker from "@/components/athlete/GoalTracker";
import NotificationBell from "@/components/shared/NotificationBell";
import InjuryRiskTab from "@/components/athlete/insights/InjuryRiskTab";
import AIInjuryChat from "@/components/athlete/insights/AIInjuryChat";
import SmartRecoveryTab from "@/components/athlete/insights/SmartRecoveryTab";

const TABS = [
  { id: "mileage", label: "Weekly Mileage" },
  { id: "performance", label: "Performance" },
  { id: "insights", label: "Insights" },
  { id: "team", label: "Team Dashboard" },
];

export default function AthleteDashboard() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("mileage");
  const [insightTab, setInsightTab] = useState("risk");

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

  const loadTeam = async (me) => {
    if (!me.team_id) return null;
    const teams = await base44.entities.Team.list();
    const found = teams.find((t) => t.id === me.team_id) || null;
    if (found) setTeam(found);
    return found;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const loadedTeam = await loadTeam(me);
        setLoadingUser(false);
        if (loadedTeam) {
          await Promise.all([fetchWorkouts(me), fetchTeamData(loadedTeam.id)]);
        } else {
          setLoadingWorkouts(false);
        }
      } catch {
        setError("Failed to load your dashboard. Please refresh.");
        setLoadingUser(false);
        setLoadingWorkouts(false);
      }
    };
    init();
  }, []);

  const handleTeamJoined = async (joinedTeam) => {
    setTeam(joinedTeam);
    const me = await base44.auth.me();
    setUser(me);
    await Promise.all([fetchWorkouts(me), fetchTeamData(joinedTeam.id)]);
  };

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-center px-6">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) {
    return <JoinTeam onTeamJoined={handleTeamJoined} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {user ? `Hey, ${user.full_name || user.email.split("@")[0]} 👋` : "Loading..."}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{team.name}</p>
            </div>
            <NotificationBell userEmail={user?.email} />
          </div>
        </motion.div>

        <TabNav tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === "mileage" && (
          loadingWorkouts ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <WeeklyMileage
              workouts={workouts}
              onSaved={() => fetchWorkouts(user)}
              teamId={team?.id}
            />
          )
        )}

        {activeTab === "performance" && (
          loadingWorkouts ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <PRTracker workouts={workouts} />
          )
        )}

        {activeTab === "insights" && (
          loadingWorkouts ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Insight sub-tabs */}
              <div className="flex gap-1 bg-muted rounded-xl p-1">
                {[
                  { id: "risk", label: "🛡️ Injury Risk" },
                  { id: "chat", label: "💬 AI Assistant" },
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

              <GoalTracker workouts={workouts} userEmail={user?.email} />
            </div>
          )
        )}

        {activeTab === "team" && (
          <TeamDashboardView announcements={announcements} schedule={schedule} />
        )}
      </main>
    </div>
  );
}