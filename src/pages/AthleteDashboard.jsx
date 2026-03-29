import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import WorkoutForm from "@/components/athlete/WorkoutForm";
import WorkoutList from "@/components/athlete/WorkoutList";
import JoinTeam from "@/components/athlete/JoinTeam";
import AnnouncementFeed from "@/components/shared/AnnouncementFeed";
import PerformanceStats from "@/components/athlete/PerformanceStats";
import NavBar from "@/components/shared/NavBar";

export default function AthleteDashboard() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchWorkouts = async (me) => {
    if (!me?.email) return;
    setLoadingWorkouts(true);
    const data = await base44.entities.Workout.filter({ athlete_email: me.email }, "-date", 50);
    setWorkouts(data);
    setLoadingWorkouts(false);
  };

  const fetchAnnouncements = async (teamId) => {
    const data = await base44.entities.Announcement.filter({ team_id: teamId }, "-created_date", 20);
    setAnnouncements(data);
  };

  const loadTeam = async (me) => {
    if (!me.team_id) return null;
    const teams = await base44.entities.Team.filter({ id: me.team_id });
    if (teams.length > 0) {
      setTeam(teams[0]);
      return teams[0];
    }
    return null;
  };

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const loadedTeam = await loadTeam(me);
      setLoadingUser(false);
      if (loadedTeam) {
        await Promise.all([fetchWorkouts(me), fetchAnnouncements(loadedTeam.id)]);
      } else {
        setLoadingWorkouts(false);
      }
    };
    init();
  }, []);

  const handleTeamJoined = async (joinedTeam) => {
    setTeam(joinedTeam);
    const me = await base44.auth.me();
    setUser(me);
    await Promise.all([fetchWorkouts(me), fetchAnnouncements(joinedTeam.id)]);
  };

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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            {user ? `Hey, ${user.full_name || user.email.split("@")[0]} 👋` : "Loading..."}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{team.name}</p>
        </motion.div>

        {announcements.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <h2 className="font-semibold text-foreground mb-3">Announcements</h2>
            <AnnouncementFeed announcements={announcements} />
          </motion.section>
        )}

        {!loadingWorkouts && workouts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <h2 className="font-semibold text-foreground mb-3">Performance</h2>
            <PerformanceStats workouts={workouts} />
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="font-semibold text-foreground mb-5">Log a Workout</h2>
          <WorkoutForm onSaved={() => fetchWorkouts(user)} teamId={team?.id} />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="font-semibold text-foreground mb-4">Past Workouts</h2>
          {loadingWorkouts ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <WorkoutList workouts={workouts} />
          )}
        </motion.section>
      </main>
    </div>
  );
}