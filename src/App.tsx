import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UnderDevelopment from "./pages/UnderDevelopment";

// SLA Bakti Pages
import UploadPage from "./pages/sla-bakti/UploadPage";
import MasterDataPage from "./pages/sla-bakti/MasterDataPage";
import ProblemPage from "./pages/sla-bakti/ProblemPage";
import ReasonPage from "./pages/sla-bakti/ReasonPage";
import HistoryGAMASPage from "./pages/sla-bakti/HistoryGAMASPage";
import RawSLAPage from "./pages/sla-bakti/RawSLAPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Monitoring Routes */}
          <Route path="/monitoring/x" element={<UnderDevelopment title="Menu X" description="Halaman monitoring menu X" />} />
          <Route path="/monitoring/y" element={<UnderDevelopment title="Menu Y" description="Halaman monitoring menu Y" />} />
          
          {/* SLA Bakti Routes */}
          <Route path="/sla-bakti/upload" element={<UploadPage />} />
          <Route path="/sla-bakti/master" element={<MasterDataPage />} />
          <Route path="/sla-bakti/problem" element={<ProblemPage />} />
          <Route path="/sla-bakti/reason" element={<ReasonPage />} />
          <Route path="/sla-bakti/history-gamas" element={<HistoryGAMASPage />} />
          <Route path="/sla-bakti/raw" element={<RawSLAPage />} />
          
          {/* SLA Internal Routes */}
          <Route path="/sla-internal/1" element={<UnderDevelopment title="SLA 1" description="Halaman SLA Internal 1" />} />
          <Route path="/sla-internal/2" element={<UnderDevelopment title="SLA 2" description="Halaman SLA Internal 2" />} />
          <Route path="/sla-internal/3" element={<UnderDevelopment title="SLA 3" description="Halaman SLA Internal 3" />} />
          
          {/* Tools Routes */}
          <Route path="/tools/rekap-battery" element={<UnderDevelopment title="Rekap Battery" description="Halaman rekap battery" />} />
          <Route path="/tools/x" element={<UnderDevelopment title="Menu X" description="Halaman tools menu X" />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
