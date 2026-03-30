import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import Home from "./pages/Home";
import SelectRole from "./pages/SelectRole";
import AthleteDashboard from "./pages/AthleteDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import TeamSettings from "./pages/TeamSettings";

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  // Protected routes require auth
  const protectedRoutes = ["/coach", "/athlete", "/select-role"];
  if (!isAuthenticated && protectedRoutes.includes(location.pathname)) {
    navigateToLogin();
    return null;
  }

  // Authenticated users who haven't picked a role go to /select-role
  if (isAuthenticated && user && !user.role && location.pathname !== "/select-role") {
    window.location.href = "/select-role";
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/athlete" element={<AthleteDashboard />} />
      <Route path="/coach" element={<CoachDashboard />} />
      <Route path="/team-settings" element={<TeamSettings />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;