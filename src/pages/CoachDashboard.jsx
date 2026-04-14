import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser, getOnboardingStep } from "@/lib/CurrentUserContext";
import { useNavigate } from "react-router-dom";
import AthleteWorkouts from "@/components/coach/AthleteWorkouts";
import AthleteMeetHistory from "@/components/coach/AthleteMeetHistory";
import CreateTeam from "@/components/coach/CreateTeam";
import CoachInsightsTab from "@/components/coach/CoachInsightsTab";
import CoachPerformanceTab from "@/components/coach/CoachPerformanceTab";
import BottomNav from "@/components/coach/BottomNav";
import CoachHomeTab from "@/components/coach/CoachHomeTab";
import CoachSettingsTab from "@/components/coach/CoachSettingsTab";
import SeasonMeets from "./SeasonMeets";
import useTeamTheme from "@/lib/useTeamTheme";
import { getDisplayName, generateDisplayName } from "@/lib/displayName";
import useDarkMode from "@/lib/useDarkMode";
import { PageSpinner, ErrorState } from "@/components/shared/LoadingSkeleton";
import { AnimatePresence, motion } from "framer-motion";
import BillingGate from "@/components/shared/BillingGate";
import FeatureGate from "@/components/shared/FeatureGate";

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};
export default function CoachDashboard() {
  const { currentUser: user, setCurrentUser: setUser } = useCurrentUser();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    () => new URLSearchParams(window.location.search).get("tab") || "dashboard"
  );

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
    if (!user?.email) {
      setLoading(false);
      return;
    }

    if (!user.team_id) {
      setLoading(false);
      return;
    }

    const loadTeam = async () => {
      setLoading(true);
      try {
        // Load team and athletes first (critical path)
        const found = await base44.entities.Team.get(user.team_id);
        if (!found) {
          setLoading(false);
          return;
        }
        setTeam(found);

        // Fetch athletes in parallel with team
        let athleteList = [];
        try {
          const res = await base44.functions.invoke("getTeamAthletes", { team_id: found.id });
          athleteList = res.data?.athletes || [];
          setAthletes(athleteList);
        } catch {
          setAthletes([]);
        }

        // Mark dashboard ready, then load secondary data async
        setLoading(false);

        // Load secondary data (announcements, schedule, workouts, checkins) in background
        Promise.all([
          base44.entities.Announcement.filter({ team_id: found.id }, "-created_date", 20).catch(() => []),
          base44.entities.PracticeSchedule.filter({ team_id: found.id }, "date", 50).catch(() => []),
          athleteList.length > 0 
            ? base44.entities.Workout.filter({ team_id: found.id }, "-date", 200).catch(() => [])
            : Promise.resolve([]),
          athleteList.length > 0
            ? base44.entities.DailyCheckin.filter({ date: format(new Date(), "yyyy-MM-dd") }, "-created_date", 100).catch(() => [])
            : Promise.resolve([]),
        ]).then(([ann, sched, allWorkouts, todayCheckins]) => {
          setAnnouncements(ann || []);
          setSchedule(sched || []);
          setWorkouts(allWorkouts || []);
          const checkinMap = {};
          (todayCheckins || []).forEach((c) => { checkinMap[c.athlete_email] = c; });
          setCheckins(checkinMap);
        });
      } catch {
        setLoading(false);
      }
    };
    loadTeam();
  }, [user?.email, user?.team_id]);

  const handleTeamCreated = (newTeam) => {
    setTeam(newTeam);
    setAthletes([]);
    setAnnouncements([]);
    setSchedule([]);
    setWorkouts([]);
    setCheckins({});
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

  if (loading) return <PageSpinner label="Loading your team..." />;

  // Athlete detail view (full-screen overlay, no bottom nav)
  if (selectedAthlete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-6">
          <button
            onClick={() => setSelectedAthlete(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <AthleteWorkouts athlete={selectedAthlete} />
          <AthleteMeetHistory athlete={selectedAthlete} teamId={team?.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {!team ? (
          <div className="py-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground leading-tight">Welcome, {getDisplayName(user)} 👋</h1>
              <p className="text-sm text-muted-foreground mt-1">Create or manage your team to get started</p>
            </div>
            <CreateTeam user={user} onTeamCreated={handleTeamCreated} />
          </div>
        ) : (
          <BillingGate team={team}>
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" variants={tabVariants} initial="initial" animate="animate" exit="exit">
                <CoachHomeTab
                   user={user}
                   team={team}
                   athletes={athletes}
                   announcements={announcements}
                   schedule={schedule}
                   workouts={workouts}
                   checkins={checkins}
                   onAnnouncementPosted={refreshAnnouncements}
                   onScheduleRefresh={refreshSchedule}
                   onSelectAthlete={setSelectedAthlete}
                   onOpenInsights={() => setActiveTab("insights")}
                   onTabChange={setActiveTab}
                 />
              </motion.div>
            )}
            {activeTab === "performance" && (
              <motion.div key="performance" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="pb-24 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground leading-tight">Performance</h1>
                  <p className="text-sm text-muted-foreground mt-1">Athlete goals and race PRs</p>
                </div>
                <FeatureGate team={team} feature="performance_tracking">
                  <CoachPerformanceTab athletes={athletes} teamId={team.id} />
                </FeatureGate>
              </motion.div>
            )}
            {activeTab === "insights" && (
              <motion.div key="insights" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="pb-24 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground leading-tight">Insights</h1>
                  <p className="text-sm text-muted-foreground mt-1">Injury risk and team health</p>
                </div>
                <FeatureGate team={team} feature="injury_alerts">
                  <CoachInsightsTab athletes={athletes} teamId={team.id} />
                </FeatureGate>
              </motion.div>
            )}
            {activeTab === "seasons" && (
              <motion.div key="seasons" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="pb-24">
                <FeatureGate team={team} feature="season_overview">
                  <SeasonMeets />
                </FeatureGate>
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div key="settings" variants={tabVariants} initial="initial" animate="animate" exit="exit" className="pb-24">
                <CoachSettingsTab user={user} team={team} onTeamUpdated={setTeam} onUserUpdated={setUser} isDark={isDark} onToggleDark={toggleDark} />
              </motion.div>
            )}
          </AnimatePresence>
          </BillingGate>
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}