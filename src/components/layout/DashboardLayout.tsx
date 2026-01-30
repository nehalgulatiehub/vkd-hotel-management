import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import mukutLogo from "@/assets/mukut-logo.webp";

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
  url: string;
  menuKey?: string;
}

// Helper to determine button color based on action type
const getButtonStyles = (title: string, isActive: boolean): string => {
  const lowerTitle = title.toLowerCase();
  
  // Add/Create/Generate actions - Green
  if (lowerTitle.startsWith("add ") || lowerTitle.startsWith("create ") || lowerTitle.startsWith("generate ")) {
    return isActive
      ? "bg-emerald-700 text-white border-emerald-700"
      : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700";
  }
  
  // View/Saved actions - Blue
  if (lowerTitle.startsWith("view ") || lowerTitle.startsWith("saved ")) {
    return isActive
      ? "bg-blue-700 text-white border-blue-700"
      : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700";
  }
  
  // Export actions - Orange
  if (lowerTitle.startsWith("export ")) {
    return isActive
      ? "bg-orange-700 text-white border-orange-700"
      : "bg-orange-500 text-white border-orange-500 hover:bg-orange-600";
  }
  
  // Due Amount actions - Red
  if (lowerTitle.includes("due")) {
    return isActive
      ? "bg-red-700 text-white border-red-700"
      : "bg-red-500 text-white border-red-500 hover:bg-red-600";
  }
  
  // Payment actions - Amber
  if (lowerTitle.includes("payment")) {
    return isActive
      ? "bg-amber-700 text-white border-amber-700"
      : "bg-amber-500 text-white border-amber-500 hover:bg-amber-600";
  }
  
  // Booking actions (availability, hold) - Purple
  if (lowerTitle.includes("booking") || lowerTitle.includes("hold")) {
    return isActive
      ? "bg-purple-700 text-white border-purple-700"
      : "bg-purple-600 text-white border-purple-600 hover:bg-purple-700";
  }
  
  // Restaurant actions - Teal
  if (lowerTitle.includes("restaurant") || lowerTitle.includes("food") || lowerTitle.includes("pos") || lowerTitle.includes("menu") || lowerTitle.includes("table")) {
    return isActive
      ? "bg-teal-700 text-white border-teal-700"
      : "bg-teal-600 text-white border-teal-600 hover:bg-teal-700";
  }
  
  // Invoice/Billing actions - Indigo
  if (lowerTitle.includes("invoice") || lowerTitle.includes("billing")) {
    return isActive
      ? "bg-indigo-700 text-white border-indigo-700"
      : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700";
  }
  
  // Volvo/Transport detail actions - Cyan
  if (lowerTitle.includes("volvo") || lowerTitle.includes("delhi") || lowerTitle.includes("manali")) {
    return isActive
      ? "bg-cyan-700 text-white border-cyan-700"
      : "bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700";
  }
  
  // Default - Maroon (original color)
  return isActive
    ? "bg-[rgb(139,21,56)] text-white border-[rgb(139,21,56)]"
    : "bg-[rgb(139,21,56)] text-white border-[rgb(139,21,56)] hover:bg-[rgb(159,41,76)]";
};

const menuItems: MenuItem[] = [
  { title: "Home", url: "/dashboard", menuKey: "dashboard" },
  { title: "Change Password", url: "/settings", menuKey: "settings" },
  { title: "Add City", url: "/cities/add", menuKey: "cities_add" },
  { title: "View City", url: "/cities", menuKey: "cities_view" },
  { title: "Add Agent", url: "/agents/add", menuKey: "agents_add" },
  { title: "Export Agent", url: "/agents/export", menuKey: "agents_export" },
  { title: "View Agent", url: "/agents", menuKey: "agents_view" },
  { title: "Add Transporter", url: "/transporters/add", menuKey: "transporters_add" },
  { title: "View Transporter", url: "/transporters", menuKey: "transporters_view" },
  { title: "Export Transporter", url: "/transporters/export", menuKey: "transporters_export" },
  { title: "Add Another Hotel", url: "/hotels/add", menuKey: "another_hotels_add" },
  { title: "View Another Hotel", url: "/hotels", menuKey: "another_hotels_view" },
  { title: "Export Another Hotel", url: "/hotels/export", menuKey: "another_hotels_export" },
  { title: "Generate Enquiry", url: "/enquiries/add", menuKey: "enquiries_add" },
  { title: "View Enquiry", url: "/enquiries", menuKey: "enquiries_view" },
  { title: "Export Enquiry", url: "/enquiries/export", menuKey: "enquiries_export" },
  { title: "Booking Availability", url: "/bookings/availability", menuKey: "bookings_availability" },
  { title: "Create Hold Booking", url: "/bookings/hold", menuKey: "bookings_hold_create" },
  { title: "View Hold Booking", url: "/bookings/hold-list", menuKey: "bookings_hold_view" },
  { title: "Create Booking", url: "/bookings/add", menuKey: "bookings_add" },
  { title: "View Booking", url: "/bookings", menuKey: "bookings_view" },
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
  { title: "View Hotel Detail", url: "/payments/hotel", menuKey: "payments_hotel" },
  { title: "Hotel Due Amount", url: "/payments/hotel-due", menuKey: "payments_hotel_due" },
  { title: "Hotel Payment", url: "/payments/hotel-payment", menuKey: "payments_hotel_payment" },
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
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasMenuAccess, isAdmin, isAccount } = useAuthContext();

  const currentDate = format(new Date(), "dd MMMM, yyyy");

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

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.menuKey) return true;
    return hasMenuAccess(item.menuKey);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(253, 246, 246)' }}>
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'rgb(253, 246, 246)' }}>
      {/* Pink Header */}
      <header className="py-4 px-6 print:hidden" style={{ backgroundColor: 'rgb(248, 216, 217)' }}>
        <img src={mukutLogo} alt="Mukut Hotels" className="h-16" />
      </header>

      {/* Date */}
      <div className="px-6 py-2 print:hidden">
        <span className="text-[#8B1538] font-medium text-base italic">{currentDate}</span>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 px-4 pb-4 gap-4">
        {/* Left Sidebar */}
        <aside className="w-48 flex-shrink-0 print:hidden">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <nav className="space-y-1 pr-2">
              {filteredMenuItems.map((item) => (
                <NavLink
                  key={item.url + item.title}
                  to={item.url}
                  className={({ isActive }) =>
                    `block w-full text-center py-1.5 px-2 text-xs border-2 rounded transition-colors ${getButtonStyles(item.title, isActive)}`
                  }
                >
                  {item.title}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="block w-full text-center py-1.5 px-2 text-xs border-2 rounded transition-colors bg-[#f8d8d9] text-[#8B1538] border-[#c9a0a5] hover:bg-red-100 hover:border-red-400 hover:text-red-600"
              >
                Logout
              </button>
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
