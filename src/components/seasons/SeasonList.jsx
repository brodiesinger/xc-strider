import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronRight, Trash2, Plus, FileText, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import MeetList from "./MeetList";
import SeasonSummary from "./SeasonSummary";
import { getDisplayName } from "@/lib/displayName";

export default function SeasonList({ seasons, meets, athletes, teamId, coachEmail, isCoach, onSeasonsChanged, onMeetsChanged }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [seasonName, setSeasonName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  // Athlete page picker state
  const [athletePickerSeasonId, setAthletePickerSeasonId] = useState(null);

  console.log("[SeasonList] isCoach:", isCoach, "seasons loaded:", seasons.length);

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
    <div className="space-y-3 pb-4">
      {/* Create Season — always at the top for coaches */}
      {isCoach && (
        <div className="pb-1">
          {showForm ? (
            <form onSubmit={handleCreateSeason} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">New Season</p>
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
            <Button className="w-full" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Season
            </Button>
          )}
        </div>
      )}

      {seasons.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
          <p className="text-sm">{isCoach ? "No seasons yet. Create your first season above." : "No seasons available yet."}</p>
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
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {isCoach && (
                    <button
                      onClick={() => setAthletePickerSeasonId(season.id)}
                      className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 bg-accent/10 px-2.5 py-1 rounded-full transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Athlete Page
                    </button>
                  )}
                  {isCoach && (
                    <button
                      onClick={() => navigate(`/packet?season_id=${season.id}`)}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 px-2.5 py-1 rounded-full transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Packet
                    </button>
                  )}
                  {isCoach && (
                    <button
                      onClick={() => handleDeleteSeason(season.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete season"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-6">
                  <MeetList
                    season={season}
                    meets={seasonMeets}
                    athletes={athletes}
                    onMeetsChanged={onMeetsChanged}
                    isCoach={isCoach}
                  />
                  {seasonMeets.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <SeasonSummary
                        season={season}
                        meets={seasonMeets}
                        athletes={athletes || []}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Athlete Page Picker Modal */}
      {athletePickerSeasonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Select Athlete</h3>
              <button onClick={() => setAthletePickerSeasonId(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {athletes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No athletes on your team yet.</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {athletes.map((a) => (
                  <li key={a.email}>
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
                      onClick={() => {
                        setAthletePickerSeasonId(null);
                        navigate(`/athlete-page-builder?athlete_email=${encodeURIComponent(a.email)}&season_id=${athletePickerSeasonId}`);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {getDisplayName(a)[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{getDisplayName(a)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}