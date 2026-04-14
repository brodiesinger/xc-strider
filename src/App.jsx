import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { CurrentUserProvider } from "@/lib/CurrentUserContext";
import Home from "./pages/Home";
import VerifyEmail from "./pages/VerifyEmail";
import Onboarding from "./pages/Onboarding";
import AthleteDashboard from "./pages/AthleteDashboard";
import CoachDashboard from "./pages/CoachDashboard.jsx";
import TeamSettings from "./pages/TeamSettings";
import SeasonMeets from "./pages/SeasonMeets";
import EndOfSeasonPacket from "./pages/EndOfSeasonPacket";
import AthletePageBuilder from "./pages/AthletePageBuilder";
import Pricing from "./pages/Pricing";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <CurrentUserProvider>
          <Routes>
            <Route path="/" element={<Pricing />} />
            <Route path="/login" element={<Home />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/coach" element={<CoachDashboard />} />
            <Route path="/athlete" element={<AthleteDashboard />} />
            <Route path="/team-settings" element={<TeamSettings />} />
            <Route path="/seasons" element={<SeasonMeets />} />
            <Route path="/packet" element={<EndOfSeasonPacket />} />
            <Route path="/athlete-page-builder" element={<AthletePageBuilder />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </CurrentUserProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;