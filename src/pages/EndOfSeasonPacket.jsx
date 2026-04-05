import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import { base44 } from "@/api/base44Client";
import PacketBuilder from "@/components/packet/PacketBuilder";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EndOfSeasonPacket() {
  const { currentUser: user } = useCurrentUser();
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState([]);
  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(true);

  const preselectedSeasonId = useState(() => new URLSearchParams(window.location.search).get("season_id") || "")[0];

  // Access control: coaches only
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    if (user.user_type !== "coach") { navigate("/athlete"); return; }
  }, [user]);

  useEffect(() => {
    if (!user?.team_id || user.user_type !== "coach") return;

    const load = async () => {
      setLoading(true);
      try {
        const seasonData = await base44.entities.Season.filter({ team_id: user.team_id }, "-created_date", 100).catch(() => []);
        setSeasons(seasonData || []);

        // Fetch all meets for all seasons
        if (seasonData?.length > 0) {
          const allMeets = await base44.entities.Meet.list("-created_date", 500).catch(() => []);
          const seasonIds = new Set(seasonData.map((s) => s.id));
          setMeets((allMeets || []).filter((m) => seasonIds.has(m.season_id)));
        }
      } catch {
        // fail safe — proceed with empty data
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.team_id]);

  if (!user || user.user_type !== "coach") return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/coach?tab=seasons")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">End-of-Season Packet</h1>
            <p className="text-sm text-muted-foreground">Build and print a professional season summary</p>
          </div>
        </div>
        <PacketBuilder
          seasons={seasons}
          meets={meets}
          teamId={user.team_id}
          preselectedSeasonId={preselectedSeasonId}
        />
      </div>
    </div>
  );
}