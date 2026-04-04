import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MeetList({ season, meets, onMeetsChanged, isCoach }) {
  const [meetName, setMeetName] = useState("");
  const [meetDate, setMeetDate] = useState("");
  const [conditions, setConditions] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

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
      // silent failure — meet list will stay unchanged
    }
  };

  return (
    <div className="space-y-3">
      {meets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No meets yet.</p>
      ) : (
        <ul className="space-y-2">
          {meets.map((meet) => (
            <li
              key={meet.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-border bg-card p-3"
            >
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
                </div>
              </div>
              {isCoach && (
                <button
                  onClick={() => handleDelete(meet.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                  aria-label="Delete meet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
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
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Meet
          </Button>
        )
      )}
    </div>
  );
}