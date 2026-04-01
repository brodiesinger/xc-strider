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

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <CurrentUserProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/coach" element={<CoachDashboard />} />
            <Route path="/athlete" element={<AthleteDashboard />} />
            <Route path="/team-settings" element={<TeamSettings />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </CurrentUserProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;