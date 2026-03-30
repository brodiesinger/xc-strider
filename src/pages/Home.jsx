import React from "react";
import { TreePine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <TreePine className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">XC Team App</h1>
          <p className="text-sm text-muted-foreground">Select a view to continue</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button onClick={() => navigate("/coach")} className="w-full">
            Enter as Coach (Test)
          </Button>
          <Button onClick={() => navigate("/athlete")} variant="outline" className="w-full">
            Enter as Athlete (Test)
          </Button>
        </div>
      </div>
    </div>
  );
}