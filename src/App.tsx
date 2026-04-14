import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import WaveBackground from "@/components/WaveBackground";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import ReportList from "./pages/reports/ReportList";
import ReportDeadlines from "./pages/reports/ReportDeadlines";
import ReportStats from "./pages/reports/ReportStats";
import Drafts from "./pages/Drafts";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Objects from "./pages/Objects";
import CalendarView from "./pages/CalendarView";
import Login from "./pages/Login";
import ReportForm from "./pages/ReportForm";
import NotFound from "./pages/NotFound";
import Seed from "./pages/Seed";
import Support from "./pages/Support";
import SettingsLayout from "./pages/settings/SettingsLayout";
import SettingsHome from "./pages/settings/SettingsHome";
import CompanyListPage from "./pages/settings/companies/CompanyListPage";
import CompanyFormPage from "./pages/settings/companies/CompanyFormPage";
import InstrumentListPage from "./pages/settings/instruments/InstrumentListPage";
import InstrumentFormPage from "./pages/settings/instruments/InstrumentFormPage";
import TechTemplateListPage from "./pages/settings/templates/TechTemplateListPage";
import TechTemplateFormPage from "./pages/settings/templates/TechTemplateFormPage";
import DefectListPage from "./pages/settings/defects/DefectListPage";
import DefectFormPage from "./pages/settings/defects/DefectFormPage";
import PinnedDefaultsPage from "./pages/settings/PinnedDefaultsPage";
import TechnicianListPage from "./pages/settings/technician/TechnicianListPage";
import TechnicianFormPage from "./pages/settings/technician/TechnicianFormPage";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WaveBackground />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Authenticated routes with sidebar layout */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="reports">
              <Route index element={<ReportList />} />
              <Route path="deadlines" element={<ReportDeadlines />} />
              <Route path="stats" element={<ReportStats />} />
            </Route>
            <Route path="drafts" element={<Drafts />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/new" element={<ClientDetail />} />
            <Route path="clients/:id" element={<ClientDetail />} />
            <Route path="objects" element={<Objects />} />
            <Route path="calendar" element={<CalendarView />} />

            <Route path="report/new" element={<ReportForm />} />
            <Route path="report/:id" element={<ReportForm />} />
            <Route path="report/:id/edit" element={<ReportForm />} />

            <Route path="library" element={<SettingsLayout />}>
              <Route index element={<SettingsHome />} />
              <Route path="firmy" element={<CompanyListPage />} />
              <Route path="firmy/novy" element={<CompanyFormPage />} />
              <Route path="firmy/:id" element={<CompanyFormPage />} />
              <Route path="pristroje" element={<InstrumentListPage />} />
              <Route path="pristroje/novy" element={<InstrumentFormPage />} />
              <Route path="pristroje/:id" element={<InstrumentFormPage />} />
              <Route path="sablony-popisu" element={<TechTemplateListPage />} />
              <Route path="sablony-popisu/novy" element={<TechTemplateFormPage />} />
              <Route path="sablony-popisu/:id" element={<TechTemplateFormPage />} />
              <Route path="zavady" element={<DefectListPage />} />
              <Route path="zavady/novy" element={<DefectFormPage />} />
              <Route path="zavady/:id" element={<DefectFormPage />} />
              <Route path="technik" element={<TechnicianListPage />} />
              <Route path="technik/novy" element={<TechnicianFormPage />} />
              <Route path="technik/:id" element={<TechnicianFormPage />} />
              <Route path="vychozi-hodnoty" element={<PinnedDefaultsPage />} />
              <Route path="*" element={<Navigate to="/library" replace />} />
            </Route>

            {/* Redirect old /settings paths to /library */}
            <Route path="settings/*" element={<Navigate to="/library" replace />} />
            <Route path="settings" element={<Navigate to="/library" replace />} />

            <Route path="support" element={<Support />} />
            <Route path="seed" element={<Seed />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
