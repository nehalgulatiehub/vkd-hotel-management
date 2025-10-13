import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Cities from "./pages/Cities";
import Agents from "./pages/Agents";
import Transporters from "./pages/Transporters";
import Hotels from "./pages/Hotels";
import Enquiries from "./pages/Enquiries";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Refunds from "./pages/Refunds";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/cities/*"
            element={
              <DashboardLayout>
                <Cities />
              </DashboardLayout>
            }
          />
          <Route
            path="/agents/*"
            element={
              <DashboardLayout>
                <Agents />
              </DashboardLayout>
            }
          />
          <Route
            path="/transporters/*"
            element={
              <DashboardLayout>
                <Transporters />
              </DashboardLayout>
            }
          />
          <Route
            path="/hotels/*"
            element={
              <DashboardLayout>
                <Hotels />
              </DashboardLayout>
            }
          />
          <Route
            path="/enquiries/*"
            element={
              <DashboardLayout>
                <Enquiries />
              </DashboardLayout>
            }
          />
          <Route
            path="/bookings/*"
            element={
              <DashboardLayout>
                <Bookings />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/*"
            element={
              <DashboardLayout>
                <Payments />
              </DashboardLayout>
            }
          />
          <Route
            path="/expenses"
            element={
              <DashboardLayout>
                <Expenses />
              </DashboardLayout>
            }
          />
          <Route
            path="/refunds"
            element={
              <DashboardLayout>
                <Refunds />
              </DashboardLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
