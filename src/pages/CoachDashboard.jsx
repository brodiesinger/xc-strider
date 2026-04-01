import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import AthleteWorkouts from "@/components/coach/AthleteWorkouts";
import CreateTeam from "@/components/coach/CreateTeam";
import CoachInsightsTab from "@/components/coach/CoachInsightsTab";
import CoachPerformanceTab from "@/components/coach/CoachPerformanceTab";
import BottomNav from "@/components/coach/BottomNav";
import CoachHomeTab from "@/components/coach/CoachHomeTab";
import CoachSettingsTab from "@/components/coach/CoachSettingsTab";
import useTeamTheme from "@/lib/useTeamTheme";
import { getDisplayName } from "@/lib/displayName";
import useDarkMode from "@/lib/useDarkMode";
export default function CoachDashboard() {
  const { currentUser: user, setCurrentUser: setUser } = useCurrentUser();
  const [team, setTeam] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Apply team color theme
  useTeamTheme(team);
  const { isDark, toggle: toggleDark } = useDarkMode(user);

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
        const found = await base44.entities.Team.get(user.team_id);
        if (!found) {
          setLoading(false);
          return;
        }
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
          if (athleteList.length > 0) {
            const [allWorkouts, todayCheckins] = await Promise.all([
              base44.entities.Workout.filter({ team_id: found.id }, "-date", 200),
              base44.entities.DailyCheckin.filter({ date: format(new Date(), "yyyy-MM-dd") }, "-created_date", 100),
            ]);
            setWorkouts(allWorkouts);
            const checkinMap = {};
            todayCheckins.forEach((c) => { checkinMap[c.athlete_email] = c; });
            setCheckins(checkinMap);
          }
        } catch {
          setAthletes([]);
        }
      } finally {
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

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-background">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your team...</p>
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
    <div className="min-h-screen bg-background motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        {!team ? (
          <div className="py-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Welcome, {getDisplayName(user)} 👋</h1>
              <p className="text-sm text-muted-foreground">Create or manage your team to get started</p>
            </div>
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
                checkins={checkins}
                onAnnouncementPosted={refreshAnnouncements}
                onScheduleRefresh={refreshSchedule}
                onSelectAthlete={setSelectedAthlete}
                onOpenInsights={() => setActiveTab("insights")}
              />
            )}
            {activeTab === "performance" && (
              <div className="pb-24 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
                <h1 className="text-2xl font-bold text-foreground mb-6">Performance</h1>
                <CoachPerformanceTab athletes={athletes} teamId={team.id} />
              </div>
            )}
            {activeTab === "insights" && (
              <div className="pb-24 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
                <h1 className="text-2xl font-bold text-foreground mb-6">Insights</h1>
                <CoachInsightsTab athletes={athletes} teamId={team.id} />
              </div>
            )}
            {activeTab === "settings" && (
              <CoachSettingsTab user={user} team={team} onTeamUpdated={setTeam} onUserUpdated={setUser} isDark={isDark} onToggleDark={toggleDark} />
            )}
          </>
        )}
      </main>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}