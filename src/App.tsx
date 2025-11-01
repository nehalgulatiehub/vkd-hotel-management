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
import OwnHotels from "./pages/OwnHotels";
import Rooms from "./pages/Rooms";
import Hotels from "./pages/Hotels";
import Enquiries from "./pages/Enquiries";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Refunds from "./pages/Refunds";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ExportCities from "./pages/ExportCities";
import ExportAgents from "./pages/ExportAgents";
import ExportTransporters from "./pages/ExportTransporters";
import ExportHotels from "./pages/ExportHotels";
import ExportEnquiries from "./pages/ExportEnquiries";
import BookingAvailability from "./pages/BookingAvailability";
import ExportBookings from "./pages/ExportBookings";
import RoomBookings from "./pages/RoomBookings";
import VolvoDelhiManali from "./pages/VolvoDelhiManali";
import DelhiManaliDue from "./pages/DelhiManaliDue";
import VolvoManaliDelhi from "./pages/VolvoManaliDelhi";
import ManaliDelhiDue from "./pages/ManaliDelhiDue";
import SafariPayments from "./pages/SafariPayments";
import HotelPayments from "./pages/HotelPayments";
import VehiclePayments from "./pages/VehiclePayments";
import CancellingPayments from "./pages/CancellingPayments";
import BookingDue from "./pages/BookingDue";
import BookingPayments from "./pages/BookingPayments";
import SafariDetails from "./pages/SafariDetails";
import SafariDue from "./pages/SafariDue";
import VolvoPayments from "./pages/VolvoPayments";
import HotelDetails from "./pages/HotelDetails";
import HotelDue from "./pages/HotelDue";
import VehicleDetails from "./pages/VehicleDetails";
import VehicleDue from "./pages/VehicleDue";
import CancelledBookings from "./pages/CancelledBookings";
import HoldBookings from "./pages/HoldBookings";
import CreateHoldBooking from "./pages/CreateHoldBooking";

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
            path="/cities/export"
            element={
              <DashboardLayout>
                <ExportCities />
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
            path="/agents/export"
            element={
              <DashboardLayout>
                <ExportAgents />
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
            path="/transporters/export"
            element={
              <DashboardLayout>
                <ExportTransporters />
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
            path="/hotels/export"
            element={
              <DashboardLayout>
                <ExportHotels />
              </DashboardLayout>
            }
          />
          <Route
            path="/own-hotels"
            element={
              <DashboardLayout>
                <OwnHotels />
              </DashboardLayout>
            }
          />
          <Route
            path="/hotels/:hotelId/rooms"
            element={
              <DashboardLayout>
                <Rooms />
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
            path="/enquiries/export"
            element={
              <DashboardLayout>
                <ExportEnquiries />
              </DashboardLayout>
            }
          />
          <Route
            path="/bookings/availability"
            element={
              <DashboardLayout>
                <BookingAvailability />
              </DashboardLayout>
            }
          />
          <Route
            path="/bookings/hold"
            element={
              <DashboardLayout>
                <CreateHoldBooking />
              </DashboardLayout>
            }
          />
          <Route
            path="/bookings/hold-list"
            element={
              <DashboardLayout>
                <HoldBookings />
              </DashboardLayout>
            }
          />
          <Route
            path="/bookings/add"
            element={
              <DashboardLayout>
                <Bookings />
              </DashboardLayout>
            }
          />
          <Route
            path="/bookings"
            element={
              <DashboardLayout>
                <Bookings />
              </DashboardLayout>
            }
          />
          <Route
            path="/bookings/cancelled"
            element={
              <DashboardLayout>
                <CancelledBookings />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments"
            element={
              <DashboardLayout>
                <Payments />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/booking-due"
            element={
              <DashboardLayout>
                <BookingDue />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/booking"
            element={
              <DashboardLayout>
                <BookingPayments />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/booking-export"
            element={
              <DashboardLayout>
                <ExportBookings />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/room-booking"
            element={
              <DashboardLayout>
                <RoomBookings />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/safari"
            element={
              <DashboardLayout>
                <SafariDetails />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/safari-due"
            element={
              <DashboardLayout>
                <SafariDue />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/volvo-delhi-manali"
            element={
              <DashboardLayout>
                <VolvoDelhiManali />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/delhi-manali-due"
            element={
              <DashboardLayout>
                <DelhiManaliDue />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/volvo-manali-delhi"
            element={
              <DashboardLayout>
                <VolvoManaliDelhi />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/manali-delhi-due"
            element={
              <DashboardLayout>
                <ManaliDelhiDue />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/volvo"
            element={
              <DashboardLayout>
                <VolvoPayments />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/safari-payment"
            element={
              <DashboardLayout>
                <SafariPayments />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/hotel"
            element={
              <DashboardLayout>
                <HotelDetails />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/hotel-due"
            element={
              <DashboardLayout>
                <HotelDue />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/hotel-payment"
            element={
              <DashboardLayout>
                <HotelPayments />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/vehicle"
            element={
              <DashboardLayout>
                <VehicleDetails />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/vehicle-due"
            element={
              <DashboardLayout>
                <VehicleDue />
              </DashboardLayout>
            }
          />
          <Route
            path="/payments/vehicle-payment"
            element={
              <DashboardLayout>
                <VehiclePayments />
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
            path="/refunds/cancelling"
            element={
              <DashboardLayout>
                <CancellingPayments />
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
