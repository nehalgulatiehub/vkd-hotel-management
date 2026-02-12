import { 
  Home, MapPin, Users, Plane, Hotel, FileText, 
  CreditCard, Calendar, DollarSign, Settings, LogOut,
  ChevronDown, Upload, UtensilsCrossed, Receipt, ShoppingCart
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

interface SubMenuItem {
  title: string;
  url: string;
  menuKey?: string;
}

interface MenuItem {
  title: string;
  url?: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: SubMenuItem[];
  menuKey?: string;
  adminOnly?: boolean;
}

// Module-based color coding for visual distinction - using strong background colors
const moduleColors: Record<string, string> = {
  booking: "!bg-slate-600 !text-white hover:!bg-slate-700",
  safari: "!bg-emerald-600 !text-white hover:!bg-emerald-700",
  anotherHotel: "!bg-orange-500 !text-white hover:!bg-orange-600",
  vehicle: "!bg-blue-600 !text-white hover:!bg-blue-700",
  volvo: "!bg-purple-600 !text-white hover:!bg-purple-700",
  restaurant: "!bg-pink-600 !text-white hover:!bg-pink-700",
  invoice: "!bg-cyan-600 !text-white hover:!bg-cyan-700",
  purchase: "!bg-amber-600 !text-white hover:!bg-amber-700",
  city: "!bg-teal-600 !text-white hover:!bg-teal-700",
  agent: "!bg-indigo-600 !text-white hover:!bg-indigo-700",
  transporter: "!bg-rose-600 !text-white hover:!bg-rose-700",
  ownHotel: "!bg-lime-600 !text-white hover:!bg-lime-700",
  enquiry: "!bg-fuchsia-600 !text-white hover:!bg-fuchsia-700",
  other: "!bg-gray-600 !text-white hover:!bg-gray-700",
  default: "!bg-[#8b1538] !text-white hover:!bg-[#6b1530]",
};

// Helper to determine button color based on module type
const getModuleColor = (menuKey?: string): string => {
  if (!menuKey) return moduleColors.default;
  
  // City module
  if (menuKey.includes("cities")) return moduleColors.city;
  
  // Agent module
  if (menuKey.includes("agents")) return moduleColors.agent;
  
  // Transporter module
  if (menuKey.includes("transporters")) return moduleColors.transporter;
  
  // Own Hotel module
  if (menuKey.includes("own_hotel")) return moduleColors.ownHotel;
  
  // Another Hotel module
  if (menuKey.includes("another_hotel") || (menuKey.includes("hotel") && !menuKey.includes("own_hotel"))) return moduleColors.anotherHotel;
  
  // Safari module
  if (menuKey.includes("safari")) return moduleColors.safari;
  
  // Vehicle module
  if (menuKey.includes("vehicle")) return moduleColors.vehicle;
  
  // Volvo module
  if (menuKey.includes("volvo") || menuKey.includes("dm_due") || menuKey.includes("md_due")) return moduleColors.volvo;
  
  // Restaurant module
  if (menuKey.includes("restaurant")) return moduleColors.restaurant;
  
  // Invoice/Billing module
  if (menuKey.includes("billing")) return moduleColors.invoice;
  
  // Purchase module
  if (menuKey.includes("purchase")) return moduleColors.purchase;
  
  // Enquiry module
  if (menuKey.includes("enquir")) return moduleColors.enquiry;
  
  // Booking module (general payments, room booking, booking due)
  if (menuKey.includes("booking") || menuKey.includes("payments")) return moduleColors.booking;
  
  // Other functions
  if (menuKey.includes("expenses") || menuKey.includes("refund") || menuKey.includes("data_import")) return moduleColors.other;
  
  return moduleColors.default;
};

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, menuKey: "dashboard" },
  {
    title: "City Management",
    icon: MapPin,
    submenu: [
      { title: "Add City", url: "/cities/add", menuKey: "cities_add" },
      { title: "View City", url: "/cities", menuKey: "cities_view" },
      { title: "Export City", url: "/cities/export", menuKey: "cities_export" },
    ]
  },
  {
    title: "Agent Management",
    icon: Users,
    submenu: [
      { title: "Add Agent", url: "/agents/add", menuKey: "agents_add" },
      { title: "Export Agent", url: "/agents/export", menuKey: "agents_export" },
      { title: "View Agent", url: "/agents", menuKey: "agents_view" },
    ]
  },
  {
    title: "Transporter Management",
    icon: Plane,
    submenu: [
      { title: "Add Transporter", url: "/transporters/add", menuKey: "transporters_add" },
      { title: "View Transporter", url: "/transporters", menuKey: "transporters_view" },
      { title: "Export Transporter", url: "/transporters/export", menuKey: "transporters_export" },
    ]
  },
  {
    title: "Hotel Management",
    icon: Hotel,
    submenu: [
      { title: "Add Own Hotel", url: "/own-hotels/add", menuKey: "own_hotels" },
      { title: "View Own Hotels", url: "/own-hotels", menuKey: "own_hotels" },
      { title: "Add Another Hotel", url: "/hotels/add", menuKey: "another_hotels_add" },
      { title: "View Another Hotel", url: "/hotels", menuKey: "another_hotels_view" },
      { title: "Export Another Hotel", url: "/hotels/export", menuKey: "another_hotels_export" },
    ]
  },
  {
    title: "Booking & Enquiry",
    icon: Calendar,
    submenu: [
      { title: "Generate Enquiry", url: "/enquiries/add", menuKey: "enquiries_add" },
      { title: "View Enquiry", url: "/enquiries", menuKey: "enquiries_view" },
      { title: "Export Enquiry", url: "/enquiries/export", menuKey: "enquiries_export" },
      { title: "Booking Availability", url: "/bookings/availability", menuKey: "bookings_availability" },
      { title: "Create Hold Booking", url: "/bookings/hold", menuKey: "bookings_hold_create" },
      { title: "View Hold Booking", url: "/bookings/hold-list", menuKey: "bookings_hold_view" },
      { title: "Create Booking", url: "/bookings/add", menuKey: "bookings_add" },
      { title: "View Booking", url: "/bookings", menuKey: "bookings_view" },
    ]
  },
  {
    title: "Booking Payments",
    icon: DollarSign,
    submenu: [
      { title: "View Payment", url: "/payments", menuKey: "payments_view" },
      { title: "Booking Due Amount", url: "/payments/booking-due", menuKey: "payments_booking_due" },
      { title: "View Booking Payment", url: "/payments/booking", menuKey: "payments_booking_view" },
      { title: "Export Booking", url: "/payments/booking-export", menuKey: "payments_booking_export" },
      { title: "View Room Booking", url: "/payments/room-booking", menuKey: "payments_room_booking" },
    ]
  },
  {
    title: "Safari",
    icon: Plane,
    submenu: [
      { title: "View Safari Detail", url: "/payments/safari", menuKey: "payments_safari" },
      { title: "Safari Due Amount", url: "/payments/safari-due", menuKey: "payments_safari_due" },
      { title: "View Safari Payment", url: "/payments/safari-payment", menuKey: "payments_safari_payment" },
    ]
  },
  {
    title: "Another Hotel",
    icon: Hotel,
    submenu: [
      { title: "Add Another Hotel", url: "/hotels/add", menuKey: "another_hotels_add" },
      { title: "View Another Hotel", url: "/hotels", menuKey: "another_hotels_view" },
      { title: "View Booking Detail", url: "/payments/hotel", menuKey: "payments_hotel" },
      { title: "Another Hotel Due Amount", url: "/payments/hotel-due", menuKey: "payments_hotel_due" },
      { title: "Another Hotel Payment", url: "/payments/hotel-payment", menuKey: "payments_hotel_payment" },
    ]
  },
  {
    title: "Vehicle",
    icon: Plane,
    submenu: [
      { title: "View Vehicle Detail", url: "/payments/vehicle", menuKey: "payments_vehicle" },
      { title: "Vehicle Due Amount", url: "/payments/vehicle-due", menuKey: "payments_vehicle_due" },
      { title: "View Vehicle Payment", url: "/payments/vehicle-payment", menuKey: "payments_vehicle_payment" },
    ]
  },
  {
    title: "Volvo",
    icon: Plane,
    submenu: [
      { title: "Delhi-Manali Detail", url: "/payments/volvo-delhi-manali", menuKey: "payments_volvo_dm" },
      { title: "Delhi-Manali Due Amount", url: "/payments/delhi-manali-due", menuKey: "payments_dm_due" },
      { title: "Manali-Delhi Detail", url: "/payments/volvo-manali-delhi", menuKey: "payments_volvo_md" },
      { title: "Manali-Delhi Due Amount", url: "/payments/manali-delhi-due", menuKey: "payments_md_due" },
      { title: "View Volvo Payment", url: "/payments/volvo", menuKey: "payments_volvo" },
    ]
  },
  {
    title: "Other Functions",
    icon: FileText,
    submenu: [
      { title: "View Group Expence", url: "/expenses", menuKey: "expenses" },
      { title: "View Cancel Booking", url: "/bookings/cancelled", menuKey: "bookings_cancelled" },
      { title: "View Refund Payment", url: "/refunds", menuKey: "refunds" },
      { title: "View Cancelling Payment", url: "/refunds/cancelling", menuKey: "refunds_cancelling" },
      { title: "Import Legacy Data", url: "/data-import", menuKey: "data_import" },
    ]
  },
  {
    title: "Restaurant",
    icon: UtensilsCrossed,
    submenu: [
      { title: "Tables", url: "/restaurant/tables", menuKey: "restaurant_tables" },
      { title: "Food Menu", url: "/restaurant/menu", menuKey: "restaurant_menu" },
      { title: "New Order (POS)", url: "/restaurant/pos", menuKey: "restaurant_pos" },
      { title: "View Orders", url: "/restaurant/orders", menuKey: "restaurant_orders" },
      { title: "Reports", url: "/restaurant/reports", menuKey: "restaurant_reports" },
    ]
  },
  {
    title: "Billing / Invoice",
    icon: Receipt,
    submenu: [
      { title: "Create Invoice", url: "/billing", menuKey: "billing_create" },
      { title: "Saved Invoices", url: "/invoices", menuKey: "billing_invoices" },
      { title: "Invoice Templates", url: "/invoice-templates", menuKey: "billing_templates" },
    ]
  },
  {
    title: "Purchase",
    icon: ShoppingCart,
    submenu: [
      { title: "Vendors", url: "/purchase/vendors", menuKey: "purchase_vendors" },
      { title: "Item Master", url: "/purchase/items", menuKey: "purchase_items" },
      { title: "Purchase Requests", url: "/purchase/requests", menuKey: "purchase_requests" },
      { title: "Purchase Orders", url: "/purchase/orders", menuKey: "purchase_orders" },
      { title: "Purchase Invoices", url: "/purchase/invoices", menuKey: "purchase_invoices" },
      { title: "Inventory", url: "/purchase/inventory", menuKey: "purchase_inventory" },
      { title: "Reports", url: "/purchase/reports", menuKey: "purchase_reports" },
    ]
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const { hasMenuAccess, isAdmin, isAccount, loading } = useAuthContext();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      navigate("/auth");
    }
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  // Filter menu items based on user permissions
  const filteredMenuItems = useMemo(() => {
    if (loading) return [];
    
    return menuItems.filter(item => {
      // Admin-only sections (like Admin menu) only visible to admin/account users
      if (item.adminOnly) {
        return isAdmin() || isAccount();
      }
      
      // For items with submenus, check if at least one submenu item is accessible
      if (item.submenu) {
        const accessibleSubItems = item.submenu.filter(subItem => {
          if (!subItem.menuKey) return true; // No menuKey means always visible
          return hasMenuAccess(subItem.menuKey);
        });
        return accessibleSubItems.length > 0;
      }
      
      // For single items, check menu access
      if (item.menuKey) {
        return hasMenuAccess(item.menuKey);
      }
      
      return true;
    }).map(item => {
      // Filter submenus as well
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(subItem => {
            if (!subItem.menuKey) return true;
            return hasMenuAccess(subItem.menuKey);
          })
        };
      }
      return item;
    });
  }, [loading, hasMenuAccess, isAdmin, isAccount]);

  return (
    <Sidebar className="print:hidden" collapsible="icon">
      <SidebarHeader className="p-0">
        <div className="px-2 py-3">
          <h2
            className={`font-bold text-sm bg-gradient-primary bg-clip-text text-transparent ${
              collapsed ? "hidden" : "block"
            }`}
          >
            HMS
          </h2>
          {collapsed && (
            <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">
              H
            </div>
          )}
        </div>
        <SidebarSeparator />
      </SidebarHeader>

      {/* Scrollable menu area */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={`text-[10px] ${collapsed ? "sr-only" : ""}`}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => {
                if (item.submenu && item.submenu.length > 0) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={openGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full h-6 text-[11px]" size="sm">
                            <item.icon className="h-3 w-3" />
                            {!collapsed && (
                              <>
                                <span>{item.title}</span>
                                <ChevronDown
                                  className={`ml-auto h-3 w-3 transition-transform ${
                                    openGroups.includes(item.title) ? "rotate-180" : ""
                                  }`}
                                />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!collapsed && (
                          <CollapsibleContent className="relative z-50">
                            <SidebarMenuSub className="bg-sidebar border-l border-sidebar-border">
                              {item.submenu.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild className={`text-[10px] h-6 rounded-sm ${getModuleColor(subItem.menuKey)}`}>
                                    <NavLink
                                      to={subItem.url}
                                      className={({ isActive }) =>
                                        isActive
                                          ? "ring-2 ring-white/50 font-bold"
                                          : ""
                                      }
                                    >
                                      {subItem.title}
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild size="sm" className="h-6 text-[11px]">
                      <NavLink
                        to={item.url!}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="h-3 w-3" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Fixed footer actions (prevents menu items from being hidden under Settings/Logout) */}
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm" className="h-6 text-[11px]">
              <NavLink to="/settings" className="hover:bg-sidebar-accent/50">
                <Settings className="h-3 w-3" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              size="sm"
              className="h-6 text-[11px] hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-3 w-3" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}