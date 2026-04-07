import React, { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser, getOnboardingStep } from "@/lib/CurrentUserContext";
import { useNavigate } from "react-router-dom";
import AthleteBottomNav from "@/components/athlete/AthleteBottomNav";
import AthleteDashboardHome from "@/components/athlete/AthleteDashboardHome";
import LogWorkoutDrawer from "@/components/athlete/LogWorkoutDrawer";
import AthleteProfileTab from "@/components/athlete/AthleteProfileTab";
import GoalTracker from "@/components/athlete/GoalTracker";
import RacePRManager from "@/components/athlete/RacePRManager";
import InjuryRiskTab from "@/components/athlete/insights/InjuryRiskTab";
import AIInjuryChat from "@/components/athlete/insights/AIInjuryChat";
import SmartRecoveryTab from "@/components/athlete/insights/SmartRecoveryTab";
import GamificationTab from "@/components/athlete/gamification/GamificationTab";
import SeasonMeets from "./SeasonMeets";
import CelebrationOverlay from "@/components/athlete/gamification/CelebrationOverlay";
import { useGamification, ALL_BADGES } from "@/components/athlete/gamification/useStreakAndBadges";
import useTeamTheme from "@/lib/useTeamTheme";
import useDarkMode from "@/lib/useDarkMode";
import { PageSpinner } from "@/components/shared/LoadingSkeleton";

export default function AthleteDashboard() {
  const { currentUser: user, setCurrentUser: setUser } = useCurrentUser();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [insightTab, setInsightTab] = useState("risk");
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);

  // Gamification state
  const [celebration, setCelebration] = useState(null); // { type: "streak"|"badge", message: string }
  const prevStreakRef = useRef(0);
  const prevBadgeIdsRef = useRef([]);

  const { streak, earnedBadgeIds } = useGamification(workouts);

  // Apply team color theme
  useTeamTheme(team);
  const { isDark, toggle: toggleDark } = useDarkMode(user);

  // Guard: redirect to onboarding if user is incomplete
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    const step = getOnboardingStep(user);
    if (step !== null) { navigate("/onboarding"); return; }
  }, [user]);

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
          // Load teammates for leaderboard
          try {
            const res = await base44.functions.invoke("getTeamAthletes", { team_id: found.id });
            setAthletes(res.data?.athletes || []);
          } catch {
            setAthletes([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [user]);

  // Detect streak / badge changes and trigger celebration
  // initializedRef prevents false-positive celebrations on first data load
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!workouts.length) return;

    if (!initializedRef.current) {
      // First load — set baseline, no celebration
      prevStreakRef.current = streak;
      prevBadgeIdsRef.current = earnedBadgeIds;
      initializedRef.current = true;
      return;
    }

    const prevStreak = prevStreakRef.current;
    const prevBadges = prevBadgeIdsRef.current;

    // Check for new badges first (higher priority)
    const newBadges = earnedBadgeIds.filter((id) => !prevBadges.includes(id));
    if (newBadges.length > 0) {
      const badge = ALL_BADGES.find((b) => b.id === newBadges[0]);
      setCelebration({ type: "badge", message: `${badge?.emoji || "🏅"} ${badge?.label || "Badge"} Unlocked!` });
    } else if (streak > prevStreak) {
      setCelebration({ type: "streak", message: `🔥 ${streak} Day Streak!` });
    }

    prevStreakRef.current = streak;
    prevBadgeIdsRef.current = earnedBadgeIds;
  }, [streak, earnedBadgeIds, workouts.length]);

  const fetchWorkouts = async (me) => {
    if (!me?.email) return;
    setLoadingWorkouts(true);
    try {
      const data = await base44.entities.Workout.filter({ athlete_email: me.email }, "-date", 200);
      setWorkouts(data || []);
    } catch {
      setWorkouts([]);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const fetchTeamData = async (teamId) => {
    try {
      const [ann, sched] = await Promise.all([
        base44.entities.Announcement.filter({ team_id: teamId }, "-created_date", 20).catch(() => []),
        base44.entities.PracticeSchedule.filter({ team_id: teamId }, "date", 50).catch(() => []),
      ]);
      setAnnouncements(ann);
      setSchedule(sched);
    } catch {
      // non-critical, leave empty
    }
  };

  const handleTabChange = (tab) => {
    if (tab === "log") {
      setLogDrawerOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  if (loading) return <PageSpinner label="Loading your dashboard..." />;

  return (
    <div className="min-h-screen bg-background">
      {/* Celebration overlay */}
      <CelebrationOverlay
        show={!!celebration}
        type={celebration?.type}
        message={celebration?.message}
        onDone={() => setCelebration(null)}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">

        {activeTab === "dashboard" && (
          <AthleteDashboardHome
            user={user}
            team={team}
            workouts={workouts}
            announcements={announcements}
            schedule={schedule}
            streak={streak}
            earnedBadgeIds={earnedBadgeIds}
            onLogWorkout={() => setLogDrawerOpen(true)}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "performance" && (
          <div className="space-y-5 pb-28 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <div className="pt-2 pb-1">
              <h1 className="text-2xl font-bold text-foreground leading-tight">Performance</h1>
              <p className="text-sm text-muted-foreground mt-1">Your PRs and goals</p>
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
          <div className="space-y-5 pb-28 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <div className="pt-2 pb-1">
              <h1 className="text-2xl font-bold text-foreground leading-tight">Insights</h1>
              <p className="text-sm text-muted-foreground mt-1">Recovery and injury intel</p>
            </div>
            {loadingWorkouts ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">Analyzing your data...</p>
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

        {activeTab === "seasons" && (
          <div className="pb-28 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <SeasonMeets />
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="pb-28">
            <GamificationTab
              user={user}
              team={team}
              athletes={athletes}
              streak={streak}
              earnedBadgeIds={earnedBadgeIds}
            />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <AthleteProfileTab
              user={user}
              team={team}
              announcements={announcements}
              schedule={schedule}
              isDark={isDark}
              onToggleDark={toggleDark}
              onUserUpdated={setUser}
            />
          </div>
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