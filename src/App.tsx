import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Cities from "./pages/Cities";
import AddCity from "./pages/AddCity";
import Agents from "./pages/Agents";
import AddAgent from "./pages/AddAgent";
import Transporters from "./pages/Transporters";
import AddTransporter from "./pages/AddTransporter";
import OwnHotels from "./pages/OwnHotels";
import AddOwnHotel from "./pages/AddOwnHotel";
import Rooms from "./pages/Rooms";
import Hotels from "./pages/Hotels";
import AddAnotherHotel from "./pages/AddAnotherHotel";
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
import AdminRoomBookings from "./pages/admin/AdminRoomBookings";
import BookingDetails from "./pages/BookingDetails";
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
import DataImport from "./pages/DataImport";
import RestaurantTables from "./pages/restaurant/RestaurantTables";
import FoodMenu from "./pages/restaurant/FoodMenu";
import RestaurantPOS from "./pages/restaurant/RestaurantPOS";
import RestaurantOrders from "./pages/restaurant/RestaurantOrders";
import RestaurantInvoice from "./pages/restaurant/RestaurantInvoice";
import RestaurantReports from "./pages/restaurant/RestaurantReports";
import Billing from "./pages/Billing";
import InvoiceList from "./pages/InvoiceList";
import InvoiceTemplates from "./pages/InvoiceTemplates";
import UserManagement from "./pages/UserManagement";
import Vendors from "./pages/purchase/Vendors";
import ItemMaster from "./pages/purchase/ItemMaster";
import PurchaseRequests from "./pages/purchase/PurchaseRequests";
import PurchaseOrders from "./pages/purchase/PurchaseOrders";
import GoodsReceipt from "./pages/purchase/GoodsReceipt";
import PurchaseInvoices from "./pages/purchase/PurchaseInvoices";
import Inventory from "./pages/purchase/Inventory";
import PurchaseReports from "./pages/purchase/PurchaseReports";
import PaymentApprovals from "./pages/PaymentApprovals";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminCities from "./pages/admin/AdminCities";
import AdminAddCity from "./pages/admin/AdminAddCity";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminAddAgent from "./pages/admin/AdminAddAgent";
import AdminTransporters from "./pages/admin/AdminTransporters";
import AdminAddTransporter from "./pages/admin/AdminAddTransporter";
import AdminAnotherHotels from "./pages/admin/AdminAnotherHotels";
import AdminAddAnotherHotel from "./pages/admin/AdminAddAnotherHotel";
import AdminOwnHotels from "./pages/admin/AdminOwnHotels";
import AdminAddOwnHotel from "./pages/admin/AdminAddOwnHotel";
import AdminManageHotels from "./pages/admin/AdminManageHotels";
import AdminManageRooms from "./pages/admin/AdminManageRooms";
import AdminUserList from "./pages/admin/AdminUserList";
import ViewPendingPayment from "./pages/admin/ViewPendingPayment";
import ViewApprovedPayment from "./pages/admin/ViewApprovedPayment";
import ViewReferenceList from "./pages/admin/ViewReferenceList";
import ViewDueAmount from "./pages/admin/ViewDueAmount";
import ViewTotalPax from "./pages/admin/ViewTotalPax";
import ViewCancellationCharge from "./pages/admin/ViewCancellationCharge";
import ViewBookReturnPayment from "./pages/admin/ViewBookReturnPayment";
import ViewPaidPayment from "./pages/admin/ViewPaidPayment";
import ViewReceivePayment from "./pages/admin/ViewReceivePayment";
import ViewSafariDue from "./pages/admin/ViewSafariDue";
import ViewDelhiManaliDue from "./pages/admin/ViewDelhiManaliDue";
import ViewManaliDelhiDue from "./pages/admin/ViewManaliDelhiDue";
import ViewVehicleDue from "./pages/admin/ViewVehicleDue";
import ViewHotelDue from "./pages/admin/ViewHotelDue";
import AdminChangePassword from "./pages/admin/AdminChangePassword";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminEmail from "./pages/admin/AdminEmail";
import AdminFollowups from "./pages/admin/AdminFollowups";
import AdminGuestUsers from "./pages/admin/AdminGuestUsers";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminRoomTypes from "./pages/admin/AdminRoomTypes";
import AdminPlaces from "./pages/admin/AdminPlaces";
import AdminNews from "./pages/admin/AdminNews";
import AdminQuotes from "./pages/admin/AdminQuotes";
import AdminSafariPendingPayments from "./pages/admin/AdminSafariPendingPayments";
import AdminSafariApprovedPayments from "./pages/admin/AdminSafariApprovedPayments";
import AdminDMVolvoPendingPayments from "./pages/admin/AdminDMVolvoPendingPayments";
import AdminDMVolvoApprovedPayments from "./pages/admin/AdminDMVolvoApprovedPayments";
import AdminMDVolvoPendingPayments from "./pages/admin/AdminMDVolvoPendingPayments";
import AdminMDVolvoApprovedPayments from "./pages/admin/AdminMDVolvoApprovedPayments";
import AdminVehiclePendingPayments from "./pages/admin/AdminVehiclePendingPayments";
import AdminVehicleApprovedPayments from "./pages/admin/AdminVehicleApprovedPayments";
import AdminHotelPendingPayments from "./pages/admin/AdminHotelPendingPayments";
import AdminHotelApprovedPayments from "./pages/admin/AdminHotelApprovedPayments";
import AdminPOApprovals from "./pages/admin/AdminPOApprovals";
import AdminPurchaseRequestApprovals from "./pages/admin/AdminPurchaseRequestApprovals";
import AdminPurchaseOrders from "./pages/admin/AdminPurchaseOrders";
import AdminGoodsReceipt from "./pages/admin/AdminGoodsReceipt";
import AdminPurchaseInvoices from "./pages/admin/AdminPurchaseInvoices";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminPurchaseReports from "./pages/admin/AdminPurchaseReports";
import AdminAddHotelPayment from "./pages/admin/AdminAddHotelPayment";
import AdminAddSafariPayment from "./pages/admin/AdminAddSafariPayment";
import AdminAddTransporterPayment from "./pages/admin/AdminAddTransporterPayment";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminInvoiceList from "./pages/admin/AdminInvoiceList";
import AdminInvoiceTemplates from "./pages/admin/AdminInvoiceTemplates";
import AdminSafariMoneyDetail from "./pages/admin/AdminSafariMoneyDetail";
import AdminAnotherHotelMoneyDetail from "./pages/admin/AdminAnotherHotelMoneyDetail";
import AdminDMTransporterMoneyDetail from "./pages/admin/AdminDMTransporterMoneyDetail";
import AdminMDTransporterMoneyDetail from "./pages/admin/AdminMDTransporterMoneyDetail";
import AdminVehicleTransporterMoneyDetail from "./pages/admin/AdminVehicleTransporterMoneyDetail";
import AdminSafariTransporterDue from "./pages/admin/AdminSafariTransporterDue";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
            path="/cities/add"
            element={
              <DashboardLayout>
                <AddCity />
              </DashboardLayout>
            }
          />
          <Route
            path="/cities"
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
            path="/agents/add"
            element={
              <DashboardLayout>
                <AddAgent />
              </DashboardLayout>
            }
          />
          <Route
            path="/agents"
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
            path="/transporters/add"
            element={
              <DashboardLayout>
                <AddTransporter />
              </DashboardLayout>
            }
          />
          <Route
            path="/transporters"
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
            path="/hotels/add"
            element={
              <DashboardLayout>
                <AddAnotherHotel />
              </DashboardLayout>
            }
          />
          <Route
            path="/hotels"
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
            path="/own-hotels/add"
            element={
              <DashboardLayout>
                <AddOwnHotel />
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
            path="/bookings/:id"
            element={
              <DashboardLayout>
                <BookingDetails />
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
          <Route
            path="/data-import"
            element={
              <DashboardLayout>
                <DataImport />
              </DashboardLayout>
            }
          />
          <Route path="/restaurant/tables" element={<DashboardLayout><RestaurantTables /></DashboardLayout>} />
          <Route path="/restaurant/menu" element={<DashboardLayout><FoodMenu /></DashboardLayout>} />
          <Route path="/restaurant/pos" element={<DashboardLayout><RestaurantPOS /></DashboardLayout>} />
          <Route path="/restaurant/orders" element={<DashboardLayout><RestaurantOrders /></DashboardLayout>} />
          <Route path="/restaurant/invoice/:orderId" element={<DashboardLayout><RestaurantInvoice /></DashboardLayout>} />
          <Route path="/restaurant/reports" element={<DashboardLayout><RestaurantReports /></DashboardLayout>} />
          <Route path="/billing" element={<DashboardLayout><Billing /></DashboardLayout>} />
          <Route path="/invoices" element={<DashboardLayout><InvoiceList /></DashboardLayout>} />
          <Route path="/invoice-templates" element={<DashboardLayout><InvoiceTemplates /></DashboardLayout>} />
          
          {/* Purchase Module Routes */}
          <Route path="/purchase/vendors" element={<DashboardLayout><Vendors /></DashboardLayout>} />
          <Route path="/purchase/items" element={<DashboardLayout><ItemMaster /></DashboardLayout>} />
          <Route path="/purchase/requests" element={<DashboardLayout><PurchaseRequests /></DashboardLayout>} />
          <Route path="/purchase/orders" element={<DashboardLayout><PurchaseOrders /></DashboardLayout>} />
          <Route path="/purchase/grn" element={<DashboardLayout><GoodsReceipt /></DashboardLayout>} />
          <Route path="/purchase/invoices" element={<DashboardLayout><PurchaseInvoices /></DashboardLayout>} />
          <Route path="/purchase/inventory" element={<DashboardLayout><Inventory /></DashboardLayout>} />
          <Route path="/purchase/reports" element={<DashboardLayout><PurchaseReports /></DashboardLayout>} />
          
          {/* Admin Panel Routes */}
          <Route path="/admin/login" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
          <Route path="/admin/approvals" element={<AdminLayout><PaymentApprovals /></AdminLayout>} />
          <Route path="/admin/cities" element={<AdminLayout><AdminCities /></AdminLayout>} />
          <Route path="/admin/cities/add" element={<AdminLayout><AdminAddCity /></AdminLayout>} />
          <Route path="/admin/agents" element={<AdminLayout><AdminAgents /></AdminLayout>} />
          <Route path="/admin/agents/add" element={<AdminLayout><AdminAddAgent /></AdminLayout>} />
          <Route path="/admin/agents/export" element={<AdminLayout><AdminAgents /></AdminLayout>} />
          <Route path="/admin/transporters" element={<AdminLayout><AdminTransporters /></AdminLayout>} />
          <Route path="/admin/transporters/add" element={<AdminLayout><AdminAddTransporter /></AdminLayout>} />
          <Route path="/admin/transporters/export" element={<AdminLayout><AdminTransporters /></AdminLayout>} />
          <Route path="/admin/another-hotels" element={<AdminLayout><AdminAnotherHotels /></AdminLayout>} />
          <Route path="/admin/another-hotels/add" element={<AdminLayout><AdminAddAnotherHotel /></AdminLayout>} />
          <Route path="/admin/own-hotels" element={<AdminLayout><AdminOwnHotels /></AdminLayout>} />
          <Route path="/admin/own-hotels/add" element={<AdminLayout><AdminAddOwnHotel /></AdminLayout>} />
          <Route path="/admin/manage-hotels" element={<AdminLayout><AdminManageHotels /></AdminLayout>} />
          <Route path="/admin/hotels/:hotelId/rooms" element={<AdminLayout><AdminManageRooms /></AdminLayout>} />
          <Route path="/admin/pending-payments" element={<AdminLayout><ViewPendingPayment /></AdminLayout>} />
          <Route path="/admin/approved-payments" element={<AdminLayout><ViewApprovedPayment /></AdminLayout>} />
          <Route path="/admin/reference-list" element={<AdminLayout><ViewReferenceList /></AdminLayout>} />
          <Route path="/admin/due-amount" element={<AdminLayout><ViewDueAmount /></AdminLayout>} />
          <Route path="/admin/total-pax" element={<AdminLayout><ViewTotalPax /></AdminLayout>} />
          <Route path="/admin/cancellation-charges" element={<AdminLayout><ViewCancellationCharge /></AdminLayout>} />
          <Route path="/admin/book-return-payments" element={<AdminLayout><ViewBookReturnPayment /></AdminLayout>} />
          <Route path="/admin/paid-payments" element={<AdminLayout><ViewPaidPayment /></AdminLayout>} />
          <Route path="/admin/receive-payments" element={<AdminLayout><ViewReceivePayment /></AdminLayout>} />
          <Route path="/admin/bookings" element={<AdminLayout><Bookings /></AdminLayout>} />
          <Route path="/admin/bookings/:id" element={<AdminLayout><BookingDetails /></AdminLayout>} />
          <Route path="/admin/booking-payments" element={<AdminLayout><BookingPayments /></AdminLayout>} />
          <Route path="/admin/cancelled-bookings" element={<AdminLayout><CancelledBookings /></AdminLayout>} />
          <Route path="/admin/refund-payments" element={<AdminLayout><Refunds /></AdminLayout>} />
          <Route path="/admin/group-expenses" element={<AdminLayout><Expenses /></AdminLayout>} />
          <Route path="/admin/booking-availability" element={<AdminLayout><BookingAvailability /></AdminLayout>} />
          <Route path="/admin/room-bookings" element={<AdminLayout><AdminRoomBookings /></AdminLayout>} />
          <Route path="/admin/enquiries" element={<AdminLayout><Enquiries /></AdminLayout>} />
          <Route path="/admin/user-list" element={<AdminLayout><AdminUserList /></AdminLayout>} />
          <Route path="/admin/safari-due" element={<AdminLayout><ViewSafariDue /></AdminLayout>} />
          <Route path="/admin/dm-volvo-due" element={<AdminLayout><ViewDelhiManaliDue /></AdminLayout>} />
          <Route path="/admin/md-volvo-due" element={<AdminLayout><ViewManaliDelhiDue /></AdminLayout>} />
          <Route path="/admin/vehicle-due" element={<AdminLayout><ViewVehicleDue /></AdminLayout>} />
          <Route path="/admin/another-hotel-due" element={<AdminLayout><ViewHotelDue /></AdminLayout>} />
          <Route path="/admin/safari-details" element={<AdminLayout><SafariDetails /></AdminLayout>} />
          <Route path="/admin/safari-payments" element={<AdminLayout><SafariPayments /></AdminLayout>} />
          <Route path="/admin/safari-payments/add" element={<AdminLayout><SafariPayments /></AdminLayout>} />
          <Route path="/admin/vehicle-details" element={<AdminLayout><VehicleDetails /></AdminLayout>} />
          <Route path="/admin/vehicle-payments" element={<AdminLayout><VehiclePayments /></AdminLayout>} />
          <Route path="/admin/another-hotel-details" element={<AdminLayout><HotelDetails /></AdminLayout>} />
          <Route path="/admin/another-hotel-payments" element={<AdminLayout><HotelPayments /></AdminLayout>} />
          <Route path="/admin/another-hotel-payments/add" element={<AdminLayout><HotelPayments /></AdminLayout>} />
          <Route path="/admin/dm-volvo-details" element={<AdminLayout><VolvoDelhiManali /></AdminLayout>} />
          <Route path="/admin/md-volvo-details" element={<AdminLayout><VolvoManaliDelhi /></AdminLayout>} />
          <Route path="/admin/volvo-payments" element={<AdminLayout><VolvoPayments /></AdminLayout>} />
          
          {/* New Admin Module Routes */}
          <Route path="/admin/email" element={<AdminLayout><AdminEmail /></AdminLayout>} />
          <Route path="/admin/change-password" element={<AdminLayout><AdminChangePassword /></AdminLayout>} />
          <Route path="/admin/followups" element={<AdminLayout><AdminFollowups /></AdminLayout>} />
          <Route path="/admin/guest-users" element={<AdminLayout><AdminGuestUsers /></AdminLayout>} />
          <Route path="/admin/guest-users/add" element={<AdminLayout><AdminGuestUsers /></AdminLayout>} />
          <Route path="/admin/accounts" element={<AdminLayout><AdminAccounts /></AdminLayout>} />
          <Route path="/admin/accounts/add" element={<AdminLayout><AdminAccounts /></AdminLayout>} />
          <Route path="/admin/room-types" element={<AdminLayout><AdminRoomTypes /></AdminLayout>} />
          <Route path="/admin/room-types/add" element={<AdminLayout><AdminRoomTypes /></AdminLayout>} />
          <Route path="/admin/places" element={<AdminLayout><AdminPlaces /></AdminLayout>} />
          <Route path="/admin/places/add" element={<AdminLayout><AdminPlaces /></AdminLayout>} />
          <Route path="/admin/news" element={<AdminLayout><AdminNews /></AdminLayout>} />
          <Route path="/admin/news/add" element={<AdminLayout><AdminNews /></AdminLayout>} />
          <Route path="/admin/quotes" element={<AdminLayout><AdminQuotes /></AdminLayout>} />
          <Route path="/admin/quotes/add" element={<AdminLayout><AdminQuotes /></AdminLayout>} />
          <Route path="/admin/enquiries/export" element={<AdminLayout><ExportEnquiries /></AdminLayout>} />
          
          {/* Safari Manager Routes */}
          <Route path="/admin/safari-pending" element={<AdminLayout><AdminSafariPendingPayments /></AdminLayout>} />
          <Route path="/admin/safari-approved" element={<AdminLayout><AdminSafariApprovedPayments /></AdminLayout>} />
          <Route path="/admin/safari-money" element={<AdminLayout><AdminSafariMoneyDetail /></AdminLayout>} />
          <Route path="/admin/safari-transporter-due" element={<AdminLayout><AdminSafariTransporterDue /></AdminLayout>} />
          
          {/* D-M Volvo Manager Routes */}
          <Route path="/admin/dm-volvo-pending" element={<AdminLayout><AdminDMVolvoPendingPayments /></AdminLayout>} />
          <Route path="/admin/dm-volvo-approved" element={<AdminLayout><AdminDMVolvoApprovedPayments /></AdminLayout>} />
          
          {/* M-D Volvo Manager Routes */}
          <Route path="/admin/md-volvo-pending" element={<AdminLayout><AdminMDVolvoPendingPayments /></AdminLayout>} />
          <Route path="/admin/md-volvo-approved" element={<AdminLayout><AdminMDVolvoApprovedPayments /></AdminLayout>} />
          
          {/* Transport Payment Manager Routes */}
          <Route path="/admin/dm-transporter-money" element={<AdminLayout><AdminDMTransporterMoneyDetail /></AdminLayout>} />
          <Route path="/admin/md-transporter-money" element={<AdminLayout><AdminMDTransporterMoneyDetail /></AdminLayout>} />
          <Route path="/admin/transporter-payments" element={<AdminLayout><VolvoPayments /></AdminLayout>} />
          <Route path="/admin/transporter-payments/add" element={<AdminLayout><VolvoPayments /></AdminLayout>} />
          <Route path="/admin/dm-transporter-due" element={<AdminLayout><ViewDelhiManaliDue /></AdminLayout>} />
          <Route path="/admin/md-transporter-due" element={<AdminLayout><ViewManaliDelhiDue /></AdminLayout>} />
          
          {/* Another Hotel Manager Routes */}
          <Route path="/admin/another-hotel-pending" element={<AdminLayout><AdminHotelPendingPayments /></AdminLayout>} />
          <Route path="/admin/another-hotel-approved" element={<AdminLayout><AdminHotelApprovedPayments /></AdminLayout>} />
          <Route path="/admin/another-hotel-money" element={<AdminLayout><AdminAnotherHotelMoneyDetail /></AdminLayout>} />
          <Route path="/admin/another-hotel-payment-due" element={<AdminLayout><ViewHotelDue /></AdminLayout>} />
          <Route path="/admin/add-hotel-payment" element={<AdminLayout><AdminAddHotelPayment /></AdminLayout>} />
          
          {/* Additional Vehicle Manager Routes */}
          <Route path="/admin/vehicle-pending" element={<AdminLayout><AdminVehiclePendingPayments /></AdminLayout>} />
          <Route path="/admin/vehicle-approved" element={<AdminLayout><AdminVehicleApprovedPayments /></AdminLayout>} />
          <Route path="/admin/vehicle-transporter-money" element={<AdminLayout><AdminVehicleTransporterMoneyDetail /></AdminLayout>} />
          <Route path="/admin/vehicle-transporter-payments" element={<AdminLayout><VehiclePayments /></AdminLayout>} />
          <Route path="/admin/vehicle-transporter-payments/add" element={<AdminLayout><VehiclePayments /></AdminLayout>} />
          <Route path="/admin/vehicle-transporter-due" element={<AdminLayout><ViewVehicleDue /></AdminLayout>} />
          <Route path="/admin/add-transporter-payment" element={<AdminLayout><AdminAddTransporterPayment /></AdminLayout>} />
          
          {/* Safari Add Payment Route */}
          <Route path="/admin/add-safari-payment" element={<AdminLayout><AdminAddSafariPayment /></AdminLayout>} />
          
          {/* User Add Route */}
          <Route path="/admin/users/add" element={<AdminLayout><UserManagement /></AdminLayout>} />
          
          {/* Admin Purchase Module Routes - Only PO Approval needed */}
          <Route path="/admin/purchase/po-pending" element={<AdminLayout><AdminPOApprovals status="pending" /></AdminLayout>} />
          <Route path="/admin/purchase/po-approved" element={<AdminLayout><AdminPOApprovals status="approved" /></AdminLayout>} />
          <Route path="/admin/purchase/orders" element={<AdminLayout><AdminPurchaseOrders /></AdminLayout>} />
          <Route path="/admin/purchase/grn" element={<AdminLayout><AdminGoodsReceipt /></AdminLayout>} />
          <Route path="/admin/purchase/invoices" element={<AdminLayout><AdminPurchaseInvoices /></AdminLayout>} />
          <Route path="/admin/purchase/vendors" element={<AdminLayout><AdminVendors /></AdminLayout>} />
          <Route path="/admin/purchase/inventory" element={<AdminLayout><AdminInventory /></AdminLayout>} />
          <Route path="/admin/purchase/reports" element={<AdminLayout><AdminPurchaseReports /></AdminLayout>} />
          
          {/* Admin Billing Routes */}
          <Route path="/admin/billing" element={<AdminLayout><AdminBilling /></AdminLayout>} />
          <Route path="/admin/invoices" element={<AdminLayout><AdminInvoiceList /></AdminLayout>} />
          <Route path="/admin/invoice-templates" element={<AdminLayout><AdminInvoiceTemplates /></AdminLayout>} />
          
          {/* Admin placeholder routes for pages under development */}
          <Route path="/admin/*" element={<AdminLayout><AdminPlaceholder /></AdminLayout>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
