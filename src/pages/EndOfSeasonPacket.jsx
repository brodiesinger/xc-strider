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
        const seasonData = await base44.entities.Season.filter({ team_id: user.team_id }, "-created_date", 20).catch(() => []);
        setSeasons(seasonData || []);
        setLoading(false);

        // Fetch meets in background (non-blocking)
        if (seasonData?.length > 0) {
          base44.entities.Meet.filter({ season_id: seasonData[0].id }, "-created_date", 50).catch(() => []).then((meets) => {
            setMeets(meets || []);
          });
        }
      } catch {
        // fail safe — proceed with empty data
        setLoading(false);
      }
    };
    load();
  }, [user?.team_id]);

  if (!user || user.user_type !== "coach") return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading packet data...</p>
        </div>
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
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground leading-tight">End-of-Season Packet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Build and print a professional season summary</p>
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