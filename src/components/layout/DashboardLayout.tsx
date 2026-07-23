import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import mukutLogo from "@/assets/mukut-logo.webp";
import { cn } from "@/lib/utils";
import { PlusCircle, ChevronDown, Menu, X } from "lucide-react";


interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SubMenuItem {
  title: string;
  url: string;
  menuKey?: string;
}

interface MenuItem {
  title: string;
  url?: string;
  icon?: React.ComponentType<{ className?: string }>;
  menuKey?: string;
  submenu?: SubMenuItem[];
}

// Module-based colors (actual HSL palette lives in src/index.css)
const getSidebarModuleClass = (menuKey?: string): string => {
  if (!menuKey) return "sidebar-pill--default";

  if (menuKey.startsWith("cities_")) return "sidebar-pill--city";
  if (menuKey.startsWith("agents_")) return "sidebar-pill--agent";
  if (menuKey.startsWith("transporters_")) return "sidebar-pill--transporter";

  if (menuKey.startsWith("another_hotels_") || menuKey.startsWith("payments_hotel"))
    return "sidebar-pill--another-hotel";
  if (menuKey.startsWith("enquiries_")) return "sidebar-pill--enquiry";

  if (menuKey.startsWith("bookings_") || menuKey.startsWith("payments_booking") || menuKey === "payments_view")
    return "sidebar-pill--booking";

  if (menuKey.startsWith("payments_safari")) return "sidebar-pill--safari";
  if (menuKey.startsWith("payments_vehicle")) return "sidebar-pill--vehicle";
  if (
    menuKey.startsWith("payments_volvo") ||
    menuKey === "payments_dm_due" ||
    menuKey === "payments_md_due" ||
    menuKey === "payments_volvo"
  )
    return "sidebar-pill--volvo";

  if (menuKey.startsWith("restaurant_")) return "sidebar-pill--restaurant";
  if (menuKey.startsWith("billing_")) return "sidebar-pill--invoice";
  if (menuKey.startsWith("purchase_")) return "sidebar-pill--purchase";

  return "sidebar-pill--default";
};

const menuItems: MenuItem[] = [
  { title: "Home", url: "/dashboard", menuKey: "dashboard" },
  {
    title: "Add Items",
    icon: PlusCircle,
    menuKey: "add_items",
    submenu: [
      { title: "Add City", url: "/cities/add", menuKey: "cities_add" },
      { title: "Add Another Hotel", url: "/hotels/add", menuKey: "another_hotels_add" },
      { title: "Add Agent", url: "/agents/add", menuKey: "agents_add" },
      { title: "Add Transporter", url: "/transporters/add", menuKey: "transporters_add" },
      { title: "View City", url: "/cities", menuKey: "cities_view" },
      { title: "Export Agent", url: "/agents/export", menuKey: "agents_export" },
      { title: "View Agent", url: "/agents", menuKey: "agents_view" },
      { title: "View Transporter", url: "/transporters", menuKey: "transporters_view" },
      { title: "Export Transporter", url: "/transporters/export", menuKey: "transporters_export" },
    ],
  },
  { title: "View Another Hotel", url: "/hotels", menuKey: "another_hotels_view" },
  { title: "Export Another Hotel", url: "/hotels/export", menuKey: "another_hotels_export" },
  { title: "Generate Enquiry", url: "/enquiries/add", menuKey: "enquiries_add" },
  { title: "View Enquiry", url: "/enquiries", menuKey: "enquiries_view" },
  { title: "Export Enquiry", url: "/enquiries/export", menuKey: "enquiries_export" },
  { title: "Create Hold Booking", url: "/bookings/hold", menuKey: "bookings_hold_create" },
  { title: "View Hold Booking", url: "/bookings/hold-list", menuKey: "bookings_hold_view" },
  { title: "Create Booking", url: "/bookings/add", menuKey: "bookings_add" },
  { title: "View Booking", url: "/bookings", menuKey: "bookings_view" },
  { title: "Booking Availability", url: "/bookings/availability", menuKey: "bookings_availability" },
  { title: "View Payment", url: "/payments", menuKey: "payments_view" },
  { title: "Booking Due Amount", url: "/payments/booking-due", menuKey: "payments_booking_due" },
  { title: "View Booking Payment", url: "/payments/booking", menuKey: "payments_booking_view" },
  { title: "Export Booking", url: "/payments/booking-export", menuKey: "payments_booking_export" },
  { title: "View Room Booking", url: "/payments/room-booking", menuKey: "payments_room_booking" },
  { title: "View Safari Detail", url: "/payments/safari", menuKey: "payments_safari" },
  { title: "Safari Due Amount", url: "/payments/safari-due", menuKey: "payments_safari_due" },
  { title: "View Safari Payment", url: "/payments/safari-payment", menuKey: "payments_safari_payment" },
  { title: "Volvo Delhi - Manali", url: "/payments/volvo-delhi-manali", menuKey: "payments_volvo_dm" },
  { title: "Delhi - Manali Due", url: "/payments/delhi-manali-due", menuKey: "payments_dm_due" },
  { title: "Volvo Manali - Delhi", url: "/payments/volvo-manali-delhi", menuKey: "payments_volvo_md" },
  { title: "Manali - Delhi Due", url: "/payments/manali-delhi-due", menuKey: "payments_md_due" },
  { title: "View Volvo Payment", url: "/payments/volvo", menuKey: "payments_volvo" },
  { title: "View Another Hotel Detail", url: "/payments/hotel", menuKey: "payments_hotel" },
  { title: "Another Hotel Due Amount", url: "/payments/hotel-due", menuKey: "payments_hotel_due" },
  { title: "Another Hotel Payment", url: "/payments/hotel-payment", menuKey: "payments_hotel_payment" },
  { title: "View Vehicle Detail", url: "/payments/vehicle", menuKey: "payments_vehicle" },
  { title: "Vehicle Due Amount", url: "/payments/vehicle-due", menuKey: "payments_vehicle_due" },
  { title: "Vehicle Payment", url: "/payments/vehicle-payment", menuKey: "payments_vehicle_payment" },
  { title: "View Group Expense", url: "/expenses", menuKey: "expenses" },
  { title: "View Cancel Booking", url: "/bookings/cancelled", menuKey: "bookings_cancelled" },
  { title: "View Refund", url: "/refunds", menuKey: "refunds" },
  { title: "Restaurant Tables", url: "/restaurant/tables", menuKey: "restaurant_tables" },
  { title: "Food Menu", url: "/restaurant/menu", menuKey: "restaurant_menu" },
  { title: "Restaurant POS", url: "/restaurant/pos", menuKey: "restaurant_pos" },
  { title: "Restaurant Orders", url: "/restaurant/orders", menuKey: "restaurant_orders" },
  { title: "Create Invoice", url: "/billing", menuKey: "billing_create" },
  { title: "Saved Invoices", url: "/invoices", menuKey: "billing_invoices" },
  { title: "Invoice Templates", url: "/invoice-templates", menuKey: "billing_templates" },
  { title: "Vendors", url: "/purchase/vendors", menuKey: "purchase_vendors" },
  { title: "Item Master", url: "/purchase/items", menuKey: "purchase_items" },
  { title: "Purchase Orders", url: "/purchase/orders", menuKey: "purchase_orders" },
  { title: "Purchase Invoices", url: "/purchase/invoices", menuKey: "purchase_invoices" },
  { title: "Inventory", url: "/purchase/inventory", menuKey: "purchase_inventory" },
  { title: "Reports", url: "/purchase/reports", menuKey: "purchase_reports" },
  { title: "Quotes", url: "/quotes", menuKey: "quotes" },
  { title: "Change Password", url: "/change-password", menuKey: "change_password" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { hasMenuAccess, isAdmin, isAccount } = useAuthContext();

  const currentDate = format(new Date(), "dd/MM/yyyy");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      navigate("/auth");
    }
  };

  const filteredMenuItems = menuItems
    .map((item) => {
      if (item.submenu) {
        const accessibleSubItems = item.submenu.filter((sub) => {
          if (!sub.menuKey) return true;
          return hasMenuAccess(sub.menuKey);
        });
        if (accessibleSubItems.length === 0) return null;
        return { ...item, submenu: accessibleSubItems };
      }
      if (!item.menuKey) return item;
      return hasMenuAccess(item.menuKey) ? item : null;
    })
    .filter(Boolean) as MenuItem[];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "rgb(253, 246, 246)" }}>
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "rgb(253, 246, 246)" }}>
      {/* Pink Header */}
      <header
        className="py-3 px-4 md:py-4 md:px-6 print:hidden flex items-center justify-between gap-3 sticky top-0 z-40"
        style={{ backgroundColor: "rgb(248, 216, 217)" }}
      >
        <img src={mukutLogo} alt="Mukut Hotels" className="h-10 md:h-16" />
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md bg-[#8B1538] text-white active:scale-95 transition"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Date */}
      <div className="px-4 md:px-6 py-2 print:hidden">
        <span className="text-[#8B1538] font-medium text-sm md:text-base italic">{currentDate}</span>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 px-2 md:px-4 pb-4 gap-4">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-48 flex-shrink-0 print:hidden">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <nav className="space-y-1 pr-2">
              {renderMenu(filteredMenuItems, openDropdown, setOpenDropdown)}
              <button
                onClick={handleLogout}
                className="block w-full text-center py-1.5 px-2 text-xs border-2 rounded transition-colors bg-[#f8d8d9] text-[#8B1538] border-[#c9a0a5] hover:bg-red-100 hover:border-red-400 hover:text-red-600"
              >
                Logout
              </button>
            </nav>
          </ScrollArea>
        </aside>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex print:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside
              className="relative w-72 max-w-[85vw] h-full shadow-xl overflow-hidden flex flex-col"
              style={{ backgroundColor: "rgb(253, 246, 246)" }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: "rgb(248, 216, 217)" }}
              >
                <img src={mukutLogo} alt="Mukut Hotels" className="h-10" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-[#8B1538] text-white active:scale-95 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ScrollArea className="flex-1">
                <nav
                  className="space-y-1 p-3"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("a")) setMobileNavOpen(false);
                  }}
                >
                  {renderMenu(filteredMenuItems, openDropdown, setOpenDropdown)}
                  <button
                    onClick={() => {
                      setMobileNavOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-center py-2 px-2 text-sm border-2 rounded transition-colors bg-[#f8d8d9] text-[#8B1538] border-[#c9a0a5]"
                  >
                    Logout
                  </button>
                </nav>
              </ScrollArea>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

function renderMenu(
  items: MenuItem[],
  openDropdown: string | null,
  setOpenDropdown: (v: string | null) => void,
) {
  return items.map((item) => {
    if (item.submenu && item.submenu.length > 0) {
      const isOpen = openDropdown === item.title;
      return (
        <div key={item.title} className="space-y-1">
          <button
            onClick={() => setOpenDropdown(isOpen ? null : item.title)}
            className={cn(
              "sidebar-pill w-full flex items-center justify-between",
              getSidebarModuleClass(item.menuKey),
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.icon && <item.icon className="h-3 w-3" />}
              {item.title}
            </span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
          </button>
          {isOpen && (
            <div className="pl-3 space-y-1">
              {item.submenu.map((sub) => (
                <NavLink
                  key={sub.url + sub.title}
                  to={sub.url}
                  className={({ isActive }) =>
                    cn("sidebar-pill", getSidebarModuleClass(sub.menuKey), isActive && "sidebar-pill--active")
                  }
                >
                  {sub.title}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }
    return (
      <NavLink
        key={item.url + item.title}
        to={item.url!}
        className={({ isActive }) =>
          cn("sidebar-pill", getSidebarModuleClass(item.menuKey), isActive && "sidebar-pill--active")
        }
      >
        {item.title}
      </NavLink>
    );
  });
}
