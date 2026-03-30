import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import Home from "./pages/Home";
import SelectRole from "./pages/SelectRole";
import AthleteDashboard from "./pages/AthleteDashboard";
import CoachDashboard from "./pages/CoachDashboard.jsx";
import TeamSettings from "./pages/TeamSettings";

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/athlete" element={<AthleteDashboard />} />
          <Route path="/team-settings" element={<TeamSettings />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;