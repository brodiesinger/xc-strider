import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function PostAnnouncement({ teamId, coachName, onPosted }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Announcement.create({
        message: message.trim(),
        team_id: teamId,
        coach_name: coachName,
      });
      setMessage("");
      onPosted();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Write an announcement for your team..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        required
      />
      <Button type="submit" disabled={saving || !message.trim()} size="sm">
        {saving ? "Posting..." : "Post Announcement"}
      </Button>
    </form>
  );
}