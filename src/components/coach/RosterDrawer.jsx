import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function RosterDrawer({ athletes, open, onClose, onSelect }) {
  const [search, setSearch] = useState("");

  const filtered = athletes.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.full_name || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[80vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-lg font-bold text-foreground">
                Team Roster
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({athletes.length})
                </span>
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search athletes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {athletes.length === 0 ? "No athletes on the roster yet." : "No results found."}
                </p>
              ) : (
                filtered.map((athlete) => (
                  <button
                    key={athlete.id}
                    onClick={() => { onSelect(athlete); onClose(); }}
                    className="w-full text-left rounded-xl border border-border bg-background p-4 flex items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {athlete.full_name || athlete.email}
                      </p>
                      {athlete.full_name && (
                        <p className="text-xs text-muted-foreground truncate">{athlete.email}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}