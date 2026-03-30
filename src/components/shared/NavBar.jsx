import React from "react";
import { TreePine, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function NavBar({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TreePine className="w-4 h-4 text-primary" />
          <div>
            <p className="text-primary font-bold text-sm">{title || "XC Team App"}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => base44.auth.logout("/")}
          className="gap-1.5 text-muted-foreground hover:text-foreground text-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}