import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/lib/CurrentUserContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2, Plus, Printer, Save, ArrowLeft } from "lucide-react";
import AthleteBlockEditor from "@/components/athlete-page/AthleteBlockEditor";
import AthleteBlockRenderer from "@/components/athlete-page/AthleteBlockRenderer";

const BLOCK_TYPES = [
  { type: "title", label: "Title" },
  { type: "text_block", label: "Text" },
  { type: "image", label: "Image" },
  { type: "stats", label: "Stats" },
  { type: "prs", label: "PRs" },
  { type: "badges", label: "Badges" },
  { type: "streak", label: "Streak" },
];

function newBlock(type) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  switch (type) {
    case "title": return { id, type, text: "" };
    case "text_block": return { id, type, title: "", body: "" };
    case "image": return { id, type, url: "", caption: "" };
    default: return { id, type };
  }
}

function BlockRow({ block, index, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const label = BLOCK_TYPES.find((b) => b.type === block.type)?.label || block.type;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <button disabled={index === 0} onClick={onMoveUp}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Move up">
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          </button>
          <button disabled={index === total - 1} onClick={onMoveDown}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors" title="Move down">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={onDelete}
            className="p-1 rounded hover:bg-destructive/10 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <AthleteBlockEditor block={block} onChange={onChange} />
      </div>
    </div>
  );
}

export default function AthletePageBuilder() {
  const { currentUser: user } = useCurrentUser();
  const navigate = useNavigate();

  // Parse URL params
  const urlParams = new URLSearchParams(window.location.search);
  const athleteEmail = urlParams.get("athlete_email") || "";
  const seasonId = urlParams.get("season_id") || "";

  const [athlete, setAthlete] = useState(null);
  const [season, setSeason] = useState(null);
  const [meets, setMeets] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [layoutId, setLayoutId] = useState(null); // existing record id for update
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Access control
  useEffect(() => {
    if (!user) { navigate("/"); return; }
    if (user.user_type !== "coach") { navigate("/athlete"); return; }
  }, [user]);

  // Load all data
  useEffect(() => {
    if (!user || user.user_type !== "coach" || !athleteEmail || !seasonId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [seasonData, meetData, existingLayouts, allUsers] = await Promise.all([
          base44.entities.Season.filter({ id: seasonId }).catch(() => []),
          base44.entities.Meet.filter({ season_id: seasonId }).catch(() => []),
          base44.entities.AthletePageLayout.filter({
            athlete_email: athleteEmail,
            season_id: seasonId,
          }).catch(() => []),
          base44.functions.invoke("getTeamAthletes", { team_id: user.team_id }).catch(() => null),
        ]);

        setSeason(seasonData?.[0] || null);
        setMeets(meetData || []);

        // Find athlete info
        const athleteList = allUsers?.data?.athletes || [];
        const found = athleteList.find((a) => a.email === athleteEmail);
        setAthlete(found || { email: athleteEmail, full_name: athleteEmail });

        // Load saved layout
        if (existingLayouts?.length > 0) {
          const layout = existingLayouts[0];
          setLayoutId(layout.id);
          setBlocks(layout.blocks || []);
        }
      } catch { /* safe */ } finally {
        setLoading(false);
      }
    };
    load();
  }, [athleteEmail, seasonId, user?.team_id]);

  const addBlock = (type) => setBlocks((prev) => [...prev, newBlock(type)]);
  const updateBlock = (updated) => setBlocks((prev) => prev.map((b) => b.id === updated.id ? updated : b));
  const deleteBlock = (id) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...blocks];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setBlocks(next);
  };
  const moveDown = (i) => {
    if (i === blocks.length - 1) return;
    const next = [...blocks];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setBlocks(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      if (layoutId) {
        await base44.entities.AthletePageLayout.update(layoutId, { blocks });
      } else {
        const created = await base44.entities.AthletePageLayout.create({
          athlete_email: athleteEmail,
          season_id: seasonId,
          team_id: user.team_id,
          blocks,
        });
        setLayoutId(created.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* safe */ } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    setShowPreview(true);
    setTimeout(() => window.print(), 400);
  };

  if (!user || user.user_type !== "coach") return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!athleteEmail || !seasonId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Missing athlete or season. Go back and try again.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/seasons")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Seasons
        </Button>
      </div>
    );
  }

  const athleteName = athlete?.full_name || athleteEmail;
  const seasonName = season?.season_name || "Season";

  return (
    <div className="min-h-screen bg-background">
      {/* No-print builder UI */}
      <div className="no-print max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/seasons")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {athleteName}
            </h1>
            <p className="text-sm text-muted-foreground">{seasonName} — Athlete Page Builder</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-1" />
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>
          </div>
        </div>

        {/* Block list */}
        <div className="space-y-3 mb-6">
          {blocks.length === 0 && (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
              <p className="text-sm">No blocks yet — add blocks below.</p>
            </div>
          )}
          {blocks.map((block, i) => (
            <BlockRow
              key={block.id}
              block={block}
              index={i}
              total={blocks.length}
              onChange={updateBlock}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
            />
          ))}
        </div>

        {/* Add block buttons */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Add Block</p>
          <div className="flex flex-wrap gap-2">
            {BLOCK_TYPES.map(({ type, label }) => (
              <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)}>
                <Plus className="w-3.5 h-3.5 mr-1" />{label}
              </Button>
            ))}
          </div>
        </div>

        {/* Inline preview */}
        {showPreview && blocks.length > 0 && (
          <div className="mt-8 border border-border rounded-xl overflow-hidden">
            <AthletePagePreview
              athleteName={athleteName}
              seasonName={seasonName}
              athleteEmail={athleteEmail}
              meets={meets}
              blocks={blocks}
            />
          </div>
        )}
      </div>

      {/* Print view — always rendered when printing */}
      <div className="print-only hidden">
        <AthletePagePreview
          athleteName={athleteName}
          seasonName={seasonName}
          athleteEmail={athleteEmail}
          meets={meets}
          blocks={blocks}
        />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body * { visibility: hidden; }
          .athlete-print-view, .athlete-print-view * { visibility: visible; }
          .athlete-print-view {
            position: absolute; left: 0; top: 0; width: 100%;
            padding: 1in; font-size: 11pt;
          }
          .athlete-page-block { page-break-inside: avoid; margin-bottom: 24pt; }
        }
      `}</style>
    </div>
  );
}

function AthletePagePreview({ athleteName, seasonName, athleteEmail, meets, blocks }) {
  return (
    <div className="athlete-print-view bg-white text-gray-900 p-8 font-sans">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-200 pb-5 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{athleteName}</h1>
        <p className="text-sm text-gray-500 mt-1">{seasonName}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
      {/* Blocks */}
      {blocks.map((block) => (
        <AthleteBlockRenderer
          key={block.id}
          block={block}
          athleteEmail={athleteEmail}
          meets={meets}
        />
      ))}
    </div>
  );
}