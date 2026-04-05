import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getDisplayName } from "@/lib/displayName";
import TeamGroupFilter from "@/components/shared/TeamGroupFilter";

export default function RosterDrawer({ athletes, open, onClose, onSelectAthlete }) {
  const [query, setQuery] = useState("");
  const [teamGroupFilter, setTeamGroupFilter] = useState("all");

  // Reset search when opened
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  // Filter by team_group and search
  const filtered = athletes.filter((a) => {
    const q = query.toLowerCase();
    const matchesSearch = getDisplayName(a).toLowerCase().includes(q);
    const matchesGroup = teamGroupFilter === "all" || a.team_group === teamGroupFilter;
    return matchesSearch && matchesGroup;
  });

  // Organize by team_group
  const boys = filtered.filter((a) => a.team_group === "boys");
  const girls = filtered.filter((a) => a.team_group === "girls");

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h2 className="text-lg font-bold text-foreground">
                Team Roster <span className="text-muted-foreground font-normal text-sm">({athletes.length})</span>
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Filter */}
             <div className="px-5 pb-3 flex items-center justify-between gap-2">
               <div className="flex-1">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     placeholder="Search athletes..."
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     className="pl-9"
                   />
                 </div>
               </div>
             </div>

             {/* Team Group Filter */}
             <div className="px-5 pb-3">
               <TeamGroupFilter value={teamGroupFilter} onChange={setTeamGroupFilter} className="w-full justify-center" />
             </div>

             {/* List */}
             <div className="overflow-y-auto flex-1 px-5 pb-24 space-y-4">
               {filtered.length === 0 ? (
                 <p className="text-sm text-muted-foreground text-center py-8">No athletes found.</p>
               ) : (
                 <>
                   {/* Boys Section */}
                   {boys.length > 0 && (
                     <div>
                       <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">👦 Boys Team ({boys.length})</p>
                       <div className="space-y-2">
                         {boys.map((athlete) => (
                           <button
                             key={athlete.id}
                             onClick={() => { onSelectAthlete(athlete); onClose(); }}
                             className="w-full text-left rounded-2xl border border-border bg-background p-4 flex items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
                           >
                             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-lg">
                               👦
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-semibold text-foreground truncate">
                                 {getDisplayName(athlete)}
                               </p>
                             </div>
                             <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                           </button>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Girls Section */}
                   {girls.length > 0 && (
                     <div>
                       <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">👩 Girls Team ({girls.length})</p>
                       <div className="space-y-2">
                         {girls.map((athlete) => (
                           <button
                             key={athlete.id}
                             onClick={() => { onSelectAthlete(athlete); onClose(); }}
                             className="w-full text-left rounded-2xl border border-border bg-background p-4 flex items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
                           >
                             <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0 text-lg">
                               👩
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-semibold text-foreground truncate">
                                 {getDisplayName(athlete)}
                               </p>
                             </div>
                             <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                 </>
               )}
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}