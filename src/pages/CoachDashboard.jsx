import React, { useEffect, useState, useMemo } from "react";
import { ChevronLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AthleteWorkouts from "@/components/coach/AthleteWorkouts";
import CreateTeam from "@/components/coach/CreateTeam";
import CoachInsightsTab from "@/components/coach/CoachInsightsTab";
import CoachPerformanceTab from "@/components/coach/CoachPerformanceTab";
import CoachBottomNav from "@/components/coach/CoachBottomNav";
import CoachHomeTab from "@/components/coach/CoachHomeTab";
import CoachSettingsTab from "@/components/coach/CoachSettingsTab";
import RosterDrawer from "@/components/coach/RosterDrawer";
import { TreePine } from "lucide-react";

export default function CoachDashboard() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);

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
          setAthletes(res.data?.athletes || []);
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
  };

  const refreshAnnouncements = async () => {
    const ann = await base44.entities.Announcement.filter({ team_id: team.id }, "-created_date", 20);
    setAnnouncements(ann);
  };

  const refreshSchedule = async () => {
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

  // Athlete detail view
  if (selectedAthlete) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm px-4 h-14 flex items-center">
          <button
            onClick={() => setSelectedAthlete(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <AthleteWorkouts athlete={selectedAthlete} />
        </main>
        <CoachBottomNav active={activeTab} onChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreePine className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-primary">XC Team App</span>
          </div>
          {team && (
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-mono">
              {team.join_code}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-28">
        {!team ? (
          <CreateTeam user={user} onTeamCreated={handleTeamCreated} />
        ) : (
          <>
            {activeTab === "dashboard" && (
              <CoachHomeTab
                user={user}
                team={team}
                athletes={athletes}
                announcements={announcements}
                schedule={schedule}
                onViewRoster={() => setRosterOpen(true)}
                onOpenAnnouncement={() => setAnnouncementOpen(true)}
                onAnnouncementPosted={refreshAnnouncements}
                onScheduleRefresh={refreshSchedule}
                weeklyMiles={0}
                injuryAlerts={0}
              />
            )}
            {activeTab === "performance" && (
              <CoachPerformanceTab athletes={athletes} teamId={team.id} />
            )}
            {activeTab === "insights" && (
              <CoachInsightsTab athletes={athletes} teamId={team.id} />
            )}
            {activeTab === "settings" && (
              <CoachSettingsTab user={user} team={team} />
            )}
          </>
        )}
      </main>

      {/* Roster Drawer */}
      <RosterDrawer
        athletes={athletes}
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        onSelect={setSelectedAthlete}
      />

      {/* Bottom Nav */}
      <CoachBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}