import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loading } from "@/components/ui/loading";
import NotFound from "../pages/NotFound";
import UnderDevelopment from "../pages/UnderDevelopment";
import Layout from "@/shared/components/layout/Layout";

// Dashboard Page
const Dashboard = lazy(() => import("../features/dashboard/pages/Dashboard").then(m => ({ default: m.default })));

// Sites Pages
const SitesPage = lazy(() => import("../features/sites/SitesPage").then(m => ({ default: m.default })));

// SLA Bakti Pages
const UploadPage = lazy(() => import("../features/sla/pages/UploadPage").then(m => ({ default: m.default })));
const MasterDataPage = lazy(() => import("../features/sla/pages/MasterDataPage").then(m => ({ default: m.default })));
const ProblemPage = lazy(() => import("../features/sla/pages/ProblemPage").then(m => ({ default: m.default })));
const ReasonPage = lazy(() => import("../features/sla/pages/ReasonPage").then(m => ({ default: m.default })));
const HistoryGAMASPage = lazy(() => import("../features/sla/pages/HistoryGAMASPage").then(m => ({ default: m.default })));
const RawSLAPage = lazy(() => import("../features/sla/pages/RawSLAPage").then(m => ({ default: m.default })));

// Monitoring Pages
const MonitoringDashboard = lazy(() => import("../features/monitoring/pages/MonitoringDashboard").then(m => ({ default: m.MonitoringDashboard })));

// Shipping Pages
const ShippingPage = lazy(() => import("../features/shipping/pages/ShippingPage").then(m => ({ default: m.default })));

// Sparepart Pages
const SparepartPage = lazy(() => import("../features/sparepart/pages/SparepartPage").then(m => ({ default: m.default })));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route 
              path="/" 
              element={
                <Suspense fallback={<Loading text="Memuat dashboard..." />}>
                  <Dashboard />
                </Suspense>
              } 
            />
            
            {/* Sites Routes */}
            <Route 
              path="/sites" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman sites..." />}>
                  <SitesPage />
                </Suspense>
              } 
            />
            
            {/* Monitoring Routes */}
            <Route 
              path="/monitoring" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman monitoring..." />}>
                  <MonitoringDashboard />
                </Suspense>
              } 
            />
            
            {/* SLA Bakti Routes */}
            <Route 
              path="/sla-bakti/upload" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman upload..." />}>
                  <UploadPage />
                </Suspense>
              } 
            />
            <Route 
              path="/sla-bakti/master" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman master data..." />}>
                  <MasterDataPage />
                </Suspense>
              } 
            />
            <Route 
              path="/sla-bakti/problem" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman problem..." />}>
                  <ProblemPage />
                </Suspense>
              } 
            />
            <Route 
              path="/sla-bakti/reason" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman reason..." />}>
                  <ReasonPage />
                </Suspense>
              } 
            />
            <Route 
              path="/sla-bakti/history-gamas" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman history GAMAS..." />}>
                  <HistoryGAMASPage />
                </Suspense>
              } 
            />
            <Route 
              path="/sla-bakti/raw" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman raw SLA..." />}>
                  <RawSLAPage />
                </Suspense>
              } 
            />
            
            {/* SLA Internal Routes */}
            <Route path="/sla-internal/1" element={<UnderDevelopment title="SLA 1" description="Halaman SLA Internal 1" />} />
            <Route path="/sla-internal/2" element={<UnderDevelopment title="SLA 2" description="Halaman SLA Internal 2" />} />
            <Route path="/sla-internal/3" element={<UnderDevelopment title="SLA 3" description="Halaman SLA Internal 3" />} />

            {/* Tools Routes */}
            <Route path="/tools/tickets" element={<NotFound />} />
            <Route 
              path="/tools/shipping" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman shipping..." />}>
                  <ShippingPage />
                </Suspense>
              } 
            />
            <Route 
              path="/tools/sparepart" 
              element={
                <Suspense fallback={<Loading text="Memuat halaman sparepart..." />}>
                  <SparepartPage />
                </Suspense>
              } 
            />
            <Route path="/tools/rekap-battery" element={<UnderDevelopment title="Rekap Battery" description="Halaman rekap battery" />} />
            <Route path="/tools/x" element={<UnderDevelopment title="Menu X" description="Halaman tools menu X" />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

