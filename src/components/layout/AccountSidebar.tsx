import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, ChevronRight } from "lucide-react";
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

const accountMenuItems: MenuItem[] = [
  { title: "Home", color: "#00C853", submenu: [{ title: "Account Home", url: "/account" }] },
  {
    title: "Account User Module",
    color: "#FFEB3B",
    textColor: "#000",
    submenu: [
      { title: "Account Email", url: "/account/email" },
      { title: "Change Password", url: "/account/change-password" },
    ]
  },
  {
    title: "User Manager",
    color: "#4CAF50",
    submenu: [
      { title: "Add User", url: "/admin/users/add" },
      { title: "Manage User", url: "/admin/users" },
    ]
  },
  {
    title: "Booking Manager",
    color: "#90A4AE",
    submenu: [
      { title: "View Booking", url: "/account/bookings" },
      { title: "View Room Booking", url: "/account/room-bookings" },
      { title: "View Pending Payment", url: "/account/pending-payments" },
      { title: "View Approved Payment", url: "/account/approved-payments" },
      { title: "Due Amount", url: "/account/due-amount" },
    ]
  },
  {
    title: "Safari Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View Safari Detail", url: "/account/safari-details" },
      { title: "View Pending Payment", url: "/account/safari-pending" },
      { title: "View Approved Payment", url: "/account/safari-approved" },
      { title: "Due Amount", url: "/account/safari-due" },
    ]
  },
  {
    title: "Safari Payment Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View Safari Money Detail", url: "/account/safari-money" },
      { title: "Add Safari Payment", url: "/account/add-safari-payment" },
      { title: "View Safari Payment", url: "/account/safari-payments" },
    ]
  },
  {
    title: "D - M Volvo Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View D - M Volvo Detail", url: "/account/dm-volvo-details" },
      { title: "View Pending Payment", url: "/account/dm-volvo-pending" },
      { title: "View Approved Payment", url: "/account/dm-volvo-approved" },
      { title: "Due Amount", url: "/account/dm-volvo-due" },
    ]
  },
  {
    title: "M - D Volvo Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View M - D Volvo Detail", url: "/account/md-volvo-details" },
      { title: "View Pending Payment", url: "/account/md-volvo-pending" },
      { title: "View Approved Payment", url: "/account/md-volvo-approved" },
      { title: "Due Amount", url: "/account/md-volvo-due" },
    ]
  },
  {
    title: "D-M and M-D Transport Payment Manager",
    color: "#F8BBD9",
    textColor: "#000",
    submenu: [
      { title: "View D - M Transporter Money Detail", url: "/account/dm-transporter-money" },
      { title: "View M - D Transporter Money Detail", url: "/account/md-transporter-money" },
      { title: "Add Transporter Payment", url: "/account/transporter-payments/add" },
      { title: "View Transporter Payment", url: "/account/transporter-payments" },
    ]
  },
  {
    title: "Another Hotel Manager",
    color: "#FF8A65",
    submenu: [
      { title: "View Another Hotel Detail", url: "/account/another-hotel-details" },
      { title: "View Pending Payment", url: "/account/another-hotel-pending" },
      { title: "View Approved Payment", url: "/account/another-hotel-approved" },
      { title: "Due Amount", url: "/account/another-hotel-due" },
    ]
  },
  {
    title: "Another Hotel Payment Manager",
    color: "#FF8A65",
    submenu: [
      { title: "View Another Hotel Money Detail", url: "/account/another-hotel-money" },
      { title: "Add Another Hotel Payment", url: "/account/add-hotel-payment" },
      { title: "View Another Hotel Payment", url: "/account/another-hotel-payments" },
    ]
  },
  {
    title: "Additional Vehicle Manager",
    color: "#607D8B",
    submenu: [
      { title: "View Additional Vehicle Detail", url: "/account/vehicle-details" },
      { title: "View Pending Payment", url: "/account/vehicle-pending" },
      { title: "View Approved Payment", url: "/account/vehicle-approved" },
      { title: "Due Amount", url: "/account/vehicle-due" },
    ]
  },
  {
    title: "Another Vehicle Transport Payment Manager",
    color: "#607D8B",
    submenu: [
      { title: "View Another Vehicle Transporter Money Detail", url: "/account/vehicle-transporter-money" },
      { title: "Add Another Vehicle Transporter Payment", url: "/account/add-transporter-payment" },
      { title: "View Another Vehicle Transporter Payment", url: "/account/vehicle-transporter-payments" },
      { title: "View Group Expense", url: "/account/group-expenses" },
    ]
  },
  {
    title: "Refund Payment Manager",
    color: "#F48FB1",
    textColor: "#000",
    submenu: [
      { title: "View Book Return Payment", url: "/account/book-return-payments" },
      { title: "View Paid Payment", url: "/account/paid-payments" },
      { title: "View Receive Payment", url: "/account/receive-payments" },
    ]
  },
];

export function AccountSidebar() {
  const navigate = useNavigate();
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

  return (
    <div className="w-56 bg-background border-r flex flex-col h-screen print:hidden">
      <ScrollArea className="flex-1">
        <div className="p-1">
          {accountMenuItems.map((item) => (
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
