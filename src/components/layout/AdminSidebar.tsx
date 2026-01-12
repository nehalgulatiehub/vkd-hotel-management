import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Home, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SubMenuItem {
  title: string;
  url: string;
}

interface MenuItem {
  title: string;
  color: string;
  textColor?: string;
  submenu?: SubMenuItem[];
}

const adminMenuItems: MenuItem[] = [
  { title: "Home", color: "#00C853", submenu: [{ title: "Dashboard", url: "/admin" }] },
  { 
    title: "Admin Module", 
    color: "#FFEB3B", 
    textColor: "#000",
    submenu: [
      { title: "Admin Email", url: "/admin/email" },
      { title: "Change Password", url: "/admin/change-password" },
    ] 
  },
  { title: "Followup Manager", color: "#4CAF50", submenu: [{ title: "View Followup", url: "/admin/followups" }] },
  { 
    title: "User Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add User", url: "/admin/users/add" },
      { title: "Manage User", url: "/admin/users" },
    ] 
  },
  { 
    title: "Guest User Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add Guest User", url: "/admin/guest-users/add" },
      { title: "Manage Guest User", url: "/admin/guest-users" },
    ] 
  },
  { 
    title: "Account Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add Account", url: "/admin/accounts/add" },
      { title: "Manage Account", url: "/admin/accounts" },
    ] 
  },
  { 
    title: "Agent Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add City", url: "/admin/cities/add" },
      { title: "Manage City", url: "/admin/cities" },
      { title: "Add Agent", url: "/admin/agents/add" },
      { title: "Manage Agent", url: "/admin/agents" },
      { title: "Export Agent", url: "/admin/agents/export" },
    ] 
  },
  { 
    title: "Another Hotel", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add Another Hotel", url: "/admin/another-hotels/add" },
      { title: "Manage Another Hotel", url: "/admin/another-hotels" },
    ] 
  },
  { 
    title: "Transporter Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add Transporter", url: "/admin/transporters/add" },
      { title: "Manage Transporter", url: "/admin/transporters" },
      { title: "Export Transporter", url: "/admin/transporters/export" },
    ] 
  },
  { 
    title: "Room Type Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add Room Type", url: "/admin/room-types/add" },
      { title: "Manage Room Type", url: "/admin/room-types" },
    ] 
  },
  { 
    title: "Hotel Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add Hotel", url: "/admin/hotels/add" },
      { title: "Manage Hotel", url: "/admin/hotels" },
    ] 
  },
  { 
    title: "Place Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add Place", url: "/admin/places/add" },
      { title: "Manage Place", url: "/admin/places" },
    ] 
  },
  { 
    title: "News Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add News", url: "/admin/news/add" },
      { title: "Manage News", url: "/admin/news" },
    ] 
  },
  { 
    title: "Quote Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "Add Quote", url: "/admin/quotes/add" },
      { title: "Manage Quote", url: "/admin/quotes" },
    ] 
  },
  { 
    title: "Enquiry Manager", 
    color: "#4CAF50", 
    submenu: [
      { title: "View Enquiry", url: "/admin/enquiries" },
      { title: "Export Enquiry", url: "/admin/enquiries/export" },
    ] 
  },
  { 
    title: "Room Manager", 
    color: "#78909C", 
    submenu: [
      { title: "View Booking Availability", url: "/admin/booking-availability" },
      { title: "View Room Booking", url: "/admin/room-bookings" },
    ] 
  },
  { 
    title: "Booking Manager", 
    color: "#90A4AE", 
    submenu: [
      { title: "View Reference List", url: "/admin/reference-list" },
      { title: "View Booking", url: "/admin/bookings" },
      { title: "View Pending Payment", url: "/admin/pending-payments" },
      { title: "View Approved Payment", url: "/admin/approved-payments" },
      { title: "Due Amount", url: "/admin/due-amount" },
      { title: "Total Pax", url: "/admin/total-pax" },
    ] 
  },
  { 
    title: "Safari Manager", 
    color: "#F8BBD9", 
    textColor: "#000",
    submenu: [
      { title: "View Safari Detail", url: "/admin/safari-details" },
      { title: "View Pending Payment", url: "/admin/safari-pending" },
      { title: "View Approved Payment", url: "/admin/safari-approved" },
      { title: "Due Amount", url: "/admin/safari-due" },
    ] 
  },
  { 
    title: "Safari Payment Manager", 
    color: "#F8BBD9", 
    textColor: "#000",
    submenu: [
      { title: "View Safari Money Detail", url: "/admin/safari-money" },
      { title: "Add Safari Payment", url: "/admin/safari-payments/add" },
      { title: "View Safari Payment", url: "/admin/safari-payments" },
      { title: "Due Safari Transporter Payment", url: "/admin/safari-transporter-due" },
    ] 
  },
  { 
    title: "D - M Volvo Manager", 
    color: "#F8BBD9", 
    textColor: "#000",
    submenu: [
      { title: "View D - M Volvo Detail", url: "/admin/dm-volvo-details" },
      { title: "View Pending Payment", url: "/admin/dm-volvo-pending" },
      { title: "View Approved Payment", url: "/admin/dm-volvo-approved" },
      { title: "Due Amount", url: "/admin/dm-volvo-due" },
    ] 
  },
  { 
    title: "M - D Volvo Manager", 
    color: "#F8BBD9", 
    textColor: "#000",
    submenu: [
      { title: "View M - D Volvo Detail", url: "/admin/md-volvo-details" },
      { title: "View Pending Payment", url: "/admin/md-volvo-pending" },
      { title: "View Approved Payment", url: "/admin/md-volvo-approved" },
      { title: "Due Amount", url: "/admin/md-volvo-due" },
    ] 
  },
  { 
    title: "D-M and M-D Transport Payment Manager", 
    color: "#F8BBD9", 
    textColor: "#000",
    submenu: [
      { title: "View D - M Transporter Money Detail", url: "/admin/dm-transporter-money" },
      { title: "View M - D Transporter Money Detail", url: "/admin/md-transporter-money" },
      { title: "Add Transporter Payment", url: "/admin/transporter-payments/add" },
      { title: "View Transporter Payment", url: "/admin/transporter-payments" },
      { title: "Due DM Transporter Payment", url: "/admin/dm-transporter-due" },
      { title: "Due MD Transporter Payment", url: "/admin/md-transporter-due" },
    ] 
  },
  { 
    title: "Another Hotel Manager", 
    color: "#FF8A65", 
    submenu: [
      { title: "View Another Hotel Detail", url: "/admin/another-hotel-details" },
      { title: "View Pending Payment", url: "/admin/another-hotel-pending" },
      { title: "View Approved Payment", url: "/admin/another-hotel-approved" },
      { title: "Due Amount", url: "/admin/another-hotel-due" },
    ] 
  },
  { 
    title: "Another Hotel Payment Manager", 
    color: "#FF8A65", 
    submenu: [
      { title: "View Another Hotel Money Detail", url: "/admin/another-hotel-money" },
      { title: "Add Another Hotel Payment", url: "/admin/another-hotel-payments/add" },
      { title: "View Another Hotel Payment", url: "/admin/another-hotel-payments" },
      { title: "Due Amount Another Hotel", url: "/admin/another-hotel-payment-due" },
    ] 
  },
  { 
    title: "Additional Vehicle Manager", 
    color: "#607D8B", 
    submenu: [
      { title: "View Additional Vehicle Detail", url: "/admin/vehicle-details" },
      { title: "View Pending Payment", url: "/admin/vehicle-pending" },
      { title: "View Approved Payment", url: "/admin/vehicle-approved" },
      { title: "Due Amount", url: "/admin/vehicle-due" },
    ] 
  },
  { 
    title: "Another Vehicle Transport Payment Manager", 
    color: "#607D8B", 
    submenu: [
      { title: "View Another Vehicle Transporter Money Detail", url: "/admin/vehicle-transporter-money" },
      { title: "Add Another Vehicle Transporter Payment", url: "/admin/vehicle-transporter-payments/add" },
      { title: "View Payment of Another Vehicle Transporters", url: "/admin/vehicle-transporter-payments" },
      { title: "Due Amount Transporters", url: "/admin/vehicle-transporter-due" },
      { title: "View Group Expense", url: "/admin/group-expenses" },
    ] 
  },
  { 
    title: "Cancel Booking Manager", 
    color: "#F48FB1", 
    textColor: "#000",
    submenu: [
      { title: "View Cancel Booking", url: "/admin/cancelled-bookings" },
      { title: "View Book Return Payment", url: "/admin/book-return-payments" },
      { title: "View Cancellation Charge", url: "/admin/cancellation-charges" },
    ] 
  },
  { 
    title: "Payment Manager", 
    color: "#F48FB1", 
    textColor: "#000",
    submenu: [
      { title: "View Refund Payment", url: "/admin/refund-payments" },
      { title: "View Paid Payment", url: "/admin/paid-payments" },
      { title: "View Receive Payment", url: "/admin/receive-payments" },
    ] 
  },
  { 
    title: "Purchase Manager", 
    color: "#26A69A", 
    submenu: [
      { title: "Pending Requests", url: "/admin/purchase/requests-pending" },
      { title: "Approved Requests", url: "/admin/purchase/requests-approved" },
      { title: "Pending PO Approvals", url: "/admin/purchase/po-pending" },
      { title: "Approved POs", url: "/admin/purchase/po-approved" },
      { title: "Purchase Orders", url: "/admin/purchase/orders" },
      { title: "Goods Receipt", url: "/admin/purchase/grn" },
      { title: "Invoices", url: "/admin/purchase/invoices" },
      { title: "Vendors", url: "/admin/purchase/vendors" },
      { title: "Inventory", url: "/admin/purchase/inventory" },
      { title: "Reports", url: "/admin/purchase/reports" },
    ] 
  },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Home"]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      navigate("/auth");
    }
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="w-56 bg-background border-r flex flex-col h-screen print:hidden">
      <ScrollArea className="flex-1">
        <div className="p-1">
          {adminMenuItems.map((item) => (
            <div key={item.title} className="mb-0.5">
              <button
                onClick={() => toggleGroup(item.title)}
                style={{ 
                  backgroundColor: item.color,
                  color: item.textColor || "#fff"
                }}
                className="w-full text-left px-2 py-1 text-xs font-semibold flex items-center justify-between"
              >
                <span>{item.title}</span>
                {item.submenu && item.submenu.length > 0 && (
                  <ChevronRight 
                    className={cn(
                      "h-3 w-3 transition-transform",
                      expandedGroups.includes(item.title) && "rotate-90"
                    )}
                  />
                )}
              </button>
              {expandedGroups.includes(item.title) && item.submenu && (
                <div 
                  className="border-l-2 ml-1" 
                  style={{ borderColor: item.color }}
                >
                  {item.submenu.map((subItem) => (
                    <NavLink
                      key={subItem.url}
                      to={subItem.url}
                      className={({ isActive }) => cn(
                        "block px-3 py-0.5 text-[11px] hover:bg-muted transition-colors",
                        isActive && "bg-muted font-medium"
                      )}
                    >
                      <span className="text-destructive mr-1">+</span>
                      {subItem.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Logout Button */}
      <div className="p-1 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left px-2 py-1.5 text-xs font-semibold bg-destructive text-destructive-foreground flex items-center gap-2 hover:bg-destructive/90"
        >
          <LogOut className="h-3 w-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
