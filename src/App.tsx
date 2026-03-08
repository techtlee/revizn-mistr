import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WaveBackground from "@/components/WaveBackground";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ReportForm from "./pages/ReportForm";
import NotFound from "./pages/NotFound";

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
