import React from "react";
import { TreePine } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <TreePine className="w-8 h-8 text-primary mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-foreground">XC Team App</h1>
        <p className="text-muted-foreground mt-1 text-sm">Welcome</p>
      </div>
    </div>
  );
}