import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import Rooms from "./pages/Rooms";
import Guests from "./pages/Guests";
import Billing from "./pages/Billing";
import Housekeeping from "./pages/Housekeeping";
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
            path="/reservations"
            element={
              <DashboardLayout>
                <Reservations />
              </DashboardLayout>
            }
          />
          <Route
            path="/rooms"
            element={
              <DashboardLayout>
                <Rooms />
              </DashboardLayout>
            }
          />
          <Route
            path="/guests"
            element={
              <DashboardLayout>
                <Guests />
              </DashboardLayout>
            }
          />
          <Route
            path="/billing"
            element={
              <DashboardLayout>
                <Billing />
              </DashboardLayout>
            }
          />
          <Route
            path="/housekeeping"
            element={
              <DashboardLayout>
                <Housekeeping />
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
