import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TreePine, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import WorkoutForm from "@/components/athlete/WorkoutForm";
import WorkoutList from "@/components/athlete/WorkoutList";
import JoinTeam from "@/components/athlete/JoinTeam";

export default function AthleteDashboard() {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchWorkouts = async () => {
    setLoadingWorkouts(true);
    const data = await base44.entities.Workout.list("-date", 50);
    setWorkouts(data);
    setLoadingWorkouts(false);
  };

  const loadTeam = async (me) => {
    if (!me.team_id) return;
    const teams = await base44.entities.Team.filter({ id: me.team_id });
    if (teams.length > 0) setTeam(teams[0]);
  };

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      await loadTeam(me);
      setLoadingUser(false);
      await fetchWorkouts();
    };
    init();
  }, []);

  const handleTeamJoined = async (joinedTeam) => {
    setTeam(joinedTeam);
    const me = await base44.auth.me();
    setUser(me);
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
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <TreePine className="w-5 h-5" />
            XC Team App
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => base44.auth.logout("/")}
            className="gap-2 text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10">
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

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="font-semibold text-foreground mb-5">Log a Workout</h2>
          <WorkoutForm onSaved={fetchWorkouts} />
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