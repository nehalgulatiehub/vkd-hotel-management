import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthContext } from "@/contexts/AuthContext";

interface SubMenuItem {
  title: string;
  url: string;
  menuKey?: string;
}

interface MenuItem {
  title: string;
  color: string;
  textColor?: string;
  submenu?: SubMenuItem[];
}

export const accountMenuItems: MenuItem[] = [
  { title: "Home", color: "#00C853", submenu: [{ title: "Account Home", url: "/account", menuKey: "acc_home" }] },
  {
    title: "Account User Module",
    color: "#FFEB3B",
    textColor: "#000",
    submenu: [
      { title: "Account Email", url: "/account/email", menuKey: "acc_email" },
      { title: "Change Password", url: "/account/change-password", menuKey: "acc_change_password" },
    ]
  },
  {
    title: "User Manager",
    color: "#4CAF50",
    submenu: [
      { title: "Add User", url: "/account/users/add", menuKey: "acc_user_add" },
      { title: "Manage User", url: "/account/users", menuKey: "acc_user_manage" },
    ]
  },
  {
    title: "Booking Manager",
    color: "#90A4AE",
    submenu: [
      { title: "View Booking", url: "/account/bookings", menuKey: "acc_booking_view" },
      { title: "View Room Booking", url: "/account/room-bookings", menuKey: "acc_room_booking_view" },
      { title: "View Pending Payment", url: "/account/pending-payments", menuKey: "acc_pending_payment" },
      { title: "View Approved Payment", url: "/account/approved-payments", menuKey: "acc_approved_payment" },
      { title: "Due Amount", url: "/account/due-amount", menuKey: "acc_due_amount" },
    ]
  },
  {
    title: "Safari Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View Safari Detail", url: "/account/safari-details", menuKey: "acc_safari_details" },
      { title: "View Pending Payment", url: "/account/safari-pending", menuKey: "acc_safari_pending" },
      { title: "View Approved Payment", url: "/account/safari-approved", menuKey: "acc_safari_approved" },
      { title: "Due Amount", url: "/account/safari-due", menuKey: "acc_safari_due" },
    ]
  },
  {
    title: "Safari Payment Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View Safari Money Detail", url: "/account/safari-money", menuKey: "acc_safari_money" },
      { title: "Add Safari Payment", url: "/account/add-safari-payment", menuKey: "acc_safari_payment_add" },
      { title: "View Safari Payment", url: "/account/safari-payments", menuKey: "acc_safari_payment_view" },
    ]
  },
  {
    title: "D - M Volvo Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View D - M Volvo Detail", url: "/account/dm-volvo-details", menuKey: "acc_dm_volvo_details" },
      { title: "View Pending Payment", url: "/account/dm-volvo-pending", menuKey: "acc_dm_volvo_pending" },
      { title: "View Approved Payment", url: "/account/dm-volvo-approved", menuKey: "acc_dm_volvo_approved" },
      { title: "Due Amount", url: "/account/dm-volvo-due", menuKey: "acc_dm_volvo_due" },
    ]
  },
  {
    title: "M - D Volvo Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View M - D Volvo Detail", url: "/account/md-volvo-details", menuKey: "acc_md_volvo_details" },
      { title: "View Pending Payment", url: "/account/md-volvo-pending", menuKey: "acc_md_volvo_pending" },
      { title: "View Approved Payment", url: "/account/md-volvo-approved", menuKey: "acc_md_volvo_approved" },
      { title: "Due Amount", url: "/account/md-volvo-due", menuKey: "acc_md_volvo_due" },
    ]
  },
  {
    title: "D-M and M-D Transport Payment Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View D - M Transporter Money Detail", url: "/account/dm-transporter-money", menuKey: "acc_dm_transporter_money" },
      { title: "View M - D Transporter Money Detail", url: "/account/md-transporter-money", menuKey: "acc_md_transporter_money" },
      { title: "Add Transporter Payment", url: "/account/transporter-payments/add", menuKey: "acc_transporter_payment_add" },
      { title: "View Transporter Payment", url: "/account/transporter-payments", menuKey: "acc_transporter_payment_view" },
    ]
  },
  {
    title: "Another Hotel Manager",
    color: "#FF8A65",
    submenu: [
      { title: "View Another Hotel Detail", url: "/account/another-hotel-details", menuKey: "acc_another_hotel_details" },
      { title: "View Pending Payment", url: "/account/another-hotel-pending", menuKey: "acc_another_hotel_pending" },
      { title: "View Approved Payment", url: "/account/another-hotel-approved", menuKey: "acc_another_hotel_approved" },
      { title: "Due Amount", url: "/account/another-hotel-due", menuKey: "acc_another_hotel_due" },
    ]
  },
  {
    title: "Another Hotel Payment Manager",
    color: "#FF8A65",
    submenu: [
      { title: "View Another Hotel Money Detail", url: "/account/another-hotel-money", menuKey: "acc_another_hotel_money" },
      { title: "Add Another Hotel Payment", url: "/account/add-hotel-payment", menuKey: "acc_another_hotel_payment_add" },
      { title: "View Another Hotel Payment", url: "/account/another-hotel-payments", menuKey: "acc_another_hotel_payment_view" },
    ]
  },
  {
    title: "Additional Vehicle Manager",
    color: "#607D8B",
    submenu: [
      { title: "View Additional Vehicle Detail", url: "/account/vehicle-details", menuKey: "acc_vehicle_details" },
      { title: "View Pending Payment", url: "/account/vehicle-pending", menuKey: "acc_vehicle_pending" },
      { title: "View Approved Payment", url: "/account/vehicle-approved", menuKey: "acc_vehicle_approved" },
      { title: "Due Amount", url: "/account/vehicle-due", menuKey: "acc_vehicle_due" },
    ]
  },
  {
    title: "Another Vehicle Transport Payment Manager",
    color: "#607D8B",
    submenu: [
      { title: "View Another Vehicle Transporter Money Detail", url: "/account/vehicle-transporter-money", menuKey: "acc_vehicle_transporter_money" },
      { title: "Add Another Vehicle Transporter Payment", url: "/account/add-transporter-payment", menuKey: "acc_vehicle_transporter_payment_add" },
      { title: "View Another Vehicle Transporter Payment", url: "/account/vehicle-transporter-payments", menuKey: "acc_vehicle_transporter_payment_view" },
      { title: "View Group Expense", url: "/account/group-expenses", menuKey: "acc_group_expenses" },
    ]
  },
  {
    title: "Refund Payment Manager",
    color: "#F48FB1",
    textColor: "#000",
    submenu: [
      { title: "View Book Return Payment", url: "/account/book-return-payments", menuKey: "acc_book_return_payments" },
      { title: "View Paid Payment", url: "/account/paid-payments", menuKey: "acc_paid_payments" },
      { title: "View Receive Payment", url: "/account/receive-payments", menuKey: "acc_receive_payments" },
    ]
  },
];


export function AccountSidebar() {
  const navigate = useNavigate();
  const { hasMenuAccess } = useAuthContext();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Home"]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      navigate("/account/login");
    }
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const visibleItems = accountMenuItems
    .map((item) => ({
      ...item,
      submenu: item.submenu?.filter((s) => !s.menuKey || hasMenuAccess(s.menuKey)),
    }))
    .filter((item) => !item.submenu || item.submenu.length > 0);

  return (
    <div className="w-56 bg-background border-r flex flex-col h-screen print:hidden">
      <ScrollArea className="flex-1">
        <div className="p-1">
          {visibleItems.map((item) => (

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

export const getAccountMenuItemForPath = (pathname: string) => {
  const items = accountMenuItems.flatMap((group) => group.submenu || []);
  return items
    .sort((a, b) => b.url.length - a.url.length)
    .find((item) => item.url === "/account" ? pathname === item.url : pathname === item.url || pathname.startsWith(`${item.url}/`));
};
