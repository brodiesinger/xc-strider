import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

export default function NamePromptBanner({ user, onSaved }) {
  const [name, setName] = useState(user?.full_name?.includes("@") ? "" : (user?.full_name?.includes(" ") ? "" : (user?.full_name || "")));
  const [saving, setSaving] = useState(false);

  // Only show if user is loaded and has no real full_name
  if (!user) return null;
  const existingName = user.full_name?.trim();
  // A real name must exist, not contain @, and contain at least one space (first + last name)
  const hasRealName = existingName && !existingName.includes("@") && existingName.includes(" ");
  if (hasRealName) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await base44.auth.updateMe({ full_name: trimmed });
    const updated = await base44.auth.me();
    onSaved(updated);
    setSaving(false);
  };

  return (
    <div className="mb-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <UserCircle className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">What's your name?</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Add your name so your coach and teammates can recognize you.</p>
      <form onSubmit={handleSave} className="flex gap-2">
        <Input
          placeholder="e.g. Sarah Johnson"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 h-9 text-sm"
          required
        />
        <Button type="submit" size="sm" disabled={saving || !name.trim()}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}