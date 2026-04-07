import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PostAnnouncement({ teamId, coachName, onPosted }) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [posted, setPosted] = useState(false);

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
      toast.success("Announcement posted!");
      setMessage("");
      setPosted(true);
      setTimeout(() => {
        setPosted(false);
        onPosted();
      }, 1000);
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
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} animate={posted ? { scale: [1, 1.04, 1] } : {}} transition={{ duration: 0.3 }}>
        <Button
          type="submit"
          disabled={saving || !message.trim() || posted}
          size="sm"
          className={posted ? "bg-green-600 hover:bg-green-600" : ""}
        >
          {posted ? "✓ Posted!" : saving ? "Posting..." : "Post Announcement"}
        </Button>
      </motion.div>
    </form>
  );
}