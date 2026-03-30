import React from "react";
import { TreePine } from "lucide-react";

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
      </div>
    </header>
  );
}