import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Plus, CalendarDays, ClipboardList, ChevronDown, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyState from "@/components/shared/EmptyState";
import MeetResultsPanel from "./MeetResultsPanel";
import MeetSummary from "./MeetSummary";
import MeetLineupBuilder from "./MeetLineupBuilder";
import CoachLineupView from "./CoachLineupView";
import AthleteLineupCard from "./AthleteLineupCard";
import TeamPlacementEditor from "./TeamPlacementEditor";

export default function MeetList({ season, meets, athletes, onMeetsChanged, isCoach, athleteEmail }) {
  const [localMeets, setLocalMeets] = useState(meets);
  const [meetName, setMeetName] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [conditions, setConditions] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [expandedResults, setExpandedResults] = useState({});
  const [lineupMeet, setLineupMeet] = useState(null);

  // Keep localMeets in sync with prop (for parent-driven refreshes)
  useEffect(() => { setLocalMeets(meets); }, [meets]);

  const toggleResults = (meetId) =>
    setExpandedResults((prev) => ({ ...prev, [meetId]: !prev[meetId] }));

  const handleAddMeet = async (e) => {
    e.preventDefault();
    const name = meetName.trim();
    if (!name) { setError("Meet name is required."); return; }
    const duplicate = meets.some(
      (m) => m.meet_name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) { setError("A meet with this name already exists in this season."); return; }

    setError("");
    setAdding(true);
    try {
      await base44.entities.Meet.create({
        season_id: season.id,
        meet_name: name,
        meet_date: meetDate || undefined,
        conditions: conditions.trim() || "",
      });
      setMeetName("");
      setMeetDate("");
      setConditions("");
      setShowForm(false);
      onMeetsChanged();
    } catch {
      setError("Failed to add meet. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (meetId) => {
    try {
      await base44.entities.Meet.delete(meetId);
      onMeetsChanged();
    } catch {
      // silent failure
    }
  };

  const handleAddMeetClick = () => setShowForm(true);

  return (
    <div className="space-y-3">
      {meets.length === 0 ? (
        isCoach ? (
          <EmptyState
            icon={CalendarDays}
            title="No meets yet"
            description="Add your first meet to start tracking results and building lineups."
            action={handleAddMeetClick}
            actionLabel="Add Meet"
          />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No meets scheduled"
            description="Check back here for upcoming meets."
          />
        )
      ) : (
        <ul className="space-y-2">
          {localMeets.map((meet) => {
            const resultsOpen = !!expandedResults[meet.id];
            return (
              <li key={meet.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Meet header row */}
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{meet.meet_name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {meet.meet_date && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="w-3 h-3" />
                          {meet.meet_date}
                        </span>
                      )}
                      {meet.conditions && (
                        <span className="text-xs text-muted-foreground">{meet.conditions}</span>
                      )}
                      {!isCoach && athleteEmail && (
                        <AthleteLineupCard meet={meet} athleteEmail={athleteEmail} inline />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isCoach && (
                      <button
                        onClick={() => setLineupMeet(meet)}
                        className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors px-2 py-1 rounded-lg hover:bg-accent/10"
                        title="Manage lineup"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Lineup
                      </button>
                    )}
                    {isCoach && (
                      <button
                        onClick={() => toggleResults(meet.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                        title="Enter results"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        Results
                        {resultsOpen
                          ? <ChevronDown className="w-3 h-3" />
                          : <ChevronRight className="w-3 h-3" />}
                      </button>
                    )}
                    {isCoach && (
                      <button
                        onClick={() => handleDelete(meet.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                        aria-label="Delete meet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results panel (coach-only, expandable) */}
                {isCoach && resultsOpen && (
                  <div className="border-t border-border px-3 pb-3 space-y-4">
                    <div className="pt-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Lineup</p>
                      <CoachLineupView meet={meet} athletes={athletes || []} />
                    </div>
                    <div className="border-t border-border pt-3">
                      <MeetResultsPanel meet={meet} athletes={athletes || []} />
                    </div>
                    <div className="border-t border-border pt-3">
                      <TeamPlacementEditor
                        meet={meet}
                        onSaved={(updated) =>
                          setLocalMeets((prev) => prev.map((m) => m.id === updated.id ? updated : m))
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Meet summary — visible to all */}
                <div className="border-t border-border px-3 pb-3">
                  <MeetSummary meet={meet} athletes={athletes || []} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Lineup Builder Modal */}
      {lineupMeet && (
        <MeetLineupBuilder
          meet={lineupMeet}
          athletes={athletes || []}
          onClose={() => setLineupMeet(null)}
        />
      )}

      {isCoach && (
        showForm ? (
          <form onSubmit={handleAddMeet} className="space-y-2 pt-1">
            <Input
              placeholder="Meet name (required)"
              value={meetName}
              onChange={(e) => { setMeetName(e.target.value); setError(""); }}
              autoFocus
            />
            <Input
              type="date"
              value={meetDate}
              onChange={(e) => setMeetDate(e.target.value)}
            />
            <Input
              placeholder="Conditions (optional)"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={adding}>
                {adding ? "Adding..." : "Add Meet"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setError(""); }}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button size="sm" variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Meet
          </Button>
        )
      )}
    </div>
  );
}