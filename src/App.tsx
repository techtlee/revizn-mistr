import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WaveBackground from "@/components/WaveBackground";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ReportForm from "./pages/ReportForm";
import NotFound from "./pages/NotFound";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WaveBackground />
      <Toaster />
      <Sonner />
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/settings" element={<SettingsLayout />}>
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
                <Route path="vychozi-hodnoty" element={<PinnedDefaultsPage />} />
                <Route path="*" element={<Navigate to="/settings" replace />} />
              </Route>
              <Route path="/report/new" element={<ReportForm />} />
              <Route path="/report/:id/edit" element={<ReportForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
