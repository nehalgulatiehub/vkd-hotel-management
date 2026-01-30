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

// Helper to determine button color based on action type - using maroon color variants
const getButtonStyles = (title: string, isActive: boolean): string => {
  const lowerTitle = title.toLowerCase();
  
  // Add/Create/Generate actions - Dark Maroon
  if (lowerTitle.startsWith("add ") || lowerTitle.startsWith("create ") || lowerTitle.startsWith("generate ")) {
    return isActive
      ? "bg-[#5c0a1f] text-white border-[#5c0a1f]"
      : "bg-[#6b1530] text-white border-[#6b1530] hover:bg-[#5c0a1f]";
  }
  
  // View/Saved actions - Standard Maroon (original)
  if (lowerTitle.startsWith("view ") || lowerTitle.startsWith("saved ")) {
    return isActive
      ? "bg-[#8B1538] text-white border-[#8B1538]"
      : "bg-[#9a2545] text-white border-[#9a2545] hover:bg-[#8B1538]";
  }
  
  // Export actions - Rose/Pink Maroon
  if (lowerTitle.startsWith("export ")) {
    return isActive
      ? "bg-[#a83255] text-white border-[#a83255]"
      : "bg-[#b84465] text-white border-[#b84465] hover:bg-[#a83255]";
  }
  
  // Due Amount actions - Deep Red Maroon
  if (lowerTitle.includes("due")) {
    return isActive
      ? "bg-[#7a0020] text-white border-[#7a0020]"
      : "bg-[#8a1030] text-white border-[#8a1030] hover:bg-[#7a0020]";
  }
  
  // Payment actions - Burgundy
  if (lowerTitle.includes("payment")) {
    return isActive
      ? "bg-[#722040] text-white border-[#722040]"
      : "bg-[#823050] text-white border-[#823050] hover:bg-[#722040]";
  }
  
  // Booking actions (availability, hold) - Plum Maroon
  if (lowerTitle.includes("booking") || lowerTitle.includes("hold")) {
    return isActive
      ? "bg-[#6d2048] text-white border-[#6d2048]"
      : "bg-[#7d3058] text-white border-[#7d3058] hover:bg-[#6d2048]";
  }
  
  // Restaurant/Menu actions - Wine
  if (lowerTitle.includes("restaurant") || lowerTitle.includes("food") || lowerTitle.includes("pos") || lowerTitle.includes("menu") || lowerTitle.includes("table")) {
    return isActive
      ? "bg-[#5e1835] text-white border-[#5e1835]"
      : "bg-[#6e2845] text-white border-[#6e2845] hover:bg-[#5e1835]";
  }
  
  // Invoice/Billing actions - Cranberry
  if (lowerTitle.includes("invoice") || lowerTitle.includes("billing")) {
    return isActive
      ? "bg-[#8a2050] text-white border-[#8a2050]"
      : "bg-[#9a3060] text-white border-[#9a3060] hover:bg-[#8a2050]";
  }
  
  // Volvo/Transport detail actions - Dusty Rose
  if (lowerTitle.includes("volvo") || lowerTitle.includes("delhi") || lowerTitle.includes("manali")) {
    return isActive
      ? "bg-[#9c4060] text-white border-[#9c4060]"
      : "bg-[#ac5070] text-white border-[#ac5070] hover:bg-[#9c4060]";
  }
  
  // Default - Original Maroon
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
