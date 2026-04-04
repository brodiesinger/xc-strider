import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronRight, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MeetList from "./MeetList";

export default function SeasonList({ seasons, meets, teamId, coachEmail, isCoach, onSeasonsChanged, onMeetsChanged }) {
  const [expanded, setExpanded] = useState({});
  const [seasonName, setSeasonName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCreateSeason = async (e) => {
    e.preventDefault();
    const name = seasonName.trim();
    if (!name) { setError("Season name is required."); return; }
    const duplicate = seasons.some(
      (s) => s.season_name.toLowerCase() === name.toLowerCase() && s.team_id === teamId
    );
    if (duplicate) { setError("A season with this name already exists."); return; }

    setError("");
    setCreating(true);
    try {
      await base44.entities.Season.create({
        team_id: teamId,
        season_name: name,
        created_by: coachEmail,
      });
      setSeasonName("");
      setShowForm(false);
      onSeasonsChanged();
    } catch {
      setError("Failed to create season. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSeason = async (seasonId) => {
    try {
      // Delete all meets in season first
      const seasonMeets = meets.filter((m) => m.season_id === seasonId);
      await Promise.all(seasonMeets.map((m) => base44.entities.Meet.delete(m.id)));
      await base44.entities.Season.delete(seasonId);
      onSeasonsChanged();
      onMeetsChanged();
    } catch {
      // silent — UI stays unchanged
    }
  };

  return (
    <div className="space-y-3">
      {seasons.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-sm">{isCoach ? "No seasons yet. Create your first season below." : "No seasons available."}</p>
        </div>
      ) : (
        seasons.map((season) => {
          const seasonMeets = meets.filter((m) => m.season_id === season.id);
          const isOpen = !!expanded[season.id];
          return (
            <div key={season.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => toggle(season.id)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-semibold text-foreground">{season.season_name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({seasonMeets.length} meet{seasonMeets.length !== 1 ? "s" : ""})</span>
                </div>
                {isCoach && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSeason(season.id); }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete season"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <MeetList
                    season={season}
                    meets={seasonMeets}
                    onMeetsChanged={onMeetsChanged}
                    isCoach={isCoach}
                  />
                </div>
              )}
            </div>
          );
        })
      )}

      {isCoach && (
        <div className="pt-1">
          {showForm ? (
            <form onSubmit={handleCreateSeason} className="space-y-2">
              <Input
                placeholder="Season name (e.g. Fall 2025)"
                value={seasonName}
                onChange={(e) => { setSeasonName(e.target.value); setError(""); }}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Creating..." : "Create Season"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setError(""); }}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Season
            </Button>
          )}
        </div>
      )}
    </div>
  );
}