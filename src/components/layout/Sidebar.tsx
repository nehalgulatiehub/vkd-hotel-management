import { 
  Home, MapPin, Users, Plane, Hotel, FileText, 
  CreditCard, Calendar, DollarSign, Settings, LogOut,
  ChevronDown, Upload, UtensilsCrossed, Receipt
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, 
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  {
    title: "City Management",
    icon: MapPin,
    submenu: [
      { title: "Add City", url: "/cities/add" },
      { title: "View City", url: "/cities" },
      { title: "Export City", url: "/cities/export" },
    ]
  },
  {
    title: "Agent Management",
    icon: Users,
    submenu: [
      { title: "Add Agent", url: "/agents/add" },
      { title: "Export Agent", url: "/agents/export" },
      { title: "View Agent", url: "/agents" },
    ]
  },
  {
    title: "Transporter Management",
    icon: Plane,
    submenu: [
      { title: "Add Transporter", url: "/transporters/add" },
      { title: "View Transporter", url: "/transporters" },
      { title: "Export Transporter", url: "/transporters/export" },
    ]
  },
  {
    title: "Hotel Management",
    icon: Hotel,
    submenu: [
      { title: "Add Own Hotel", url: "/own-hotels" },
      { title: "View Own Hotels", url: "/own-hotels" },
      { title: "Add Another Hotel", url: "/hotels/add" },
      { title: "View Another Hotel", url: "/hotels" },
      { title: "Export Another Hotel", url: "/hotels/export" },
    ]
  },
  {
    title: "Booking & Enquiry",
    icon: Calendar,
    submenu: [
      { title: "Generate Enquiry", url: "/enquiries/add" },
      { title: "View Enquiry", url: "/enquiries" },
      { title: "Export Enquiry", url: "/enquiries/export" },
      { title: "Booking Availability", url: "/bookings/availability" },
      { title: "Create Hold Booking", url: "/bookings/hold" },
      { title: "View Hold Booking", url: "/bookings/hold-list" },
      { title: "Create Booking", url: "/bookings/add" },
      { title: "View Booking", url: "/bookings" },
    ]
  },
  {
    title: "Payment & Financials",
    icon: DollarSign,
    submenu: [
      { title: "View Payment", url: "/payments" },
      { title: "Booking Due Amount", url: "/payments/booking-due" },
      { title: "View Booking Payment", url: "/payments/booking" },
      { title: "Export Booking", url: "/payments/booking-export" },
      { title: "View Room Booking", url: "/payments/room-booking" },
      { title: "View Safari Detail", url: "/payments/safari" },
      { title: "Safari Due Amount", url: "/payments/safari-due" },
      { title: "View Safari Payment", url: "/payments/safari-payment" },
      { title: "Volvo Delhi - Manali Detail", url: "/payments/volvo-delhi-manali" },
      { title: "Delhi - Manali Due Amount", url: "/payments/delhi-manali-due" },
      { title: "Volvo Manali - Delhi Detail", url: "/payments/volvo-manali-delhi" },
      { title: "Manali - Delhi Due Amount", url: "/payments/manali-delhi-due" },
      { title: "View Volvo Payment", url: "/payments/volvo" },
      { title: "View Another Hotel Detail", url: "/payments/hotel" },
      { title: "Another Hotel Due Amount", url: "/payments/hotel-due" },
      { title: "Another Hotel Payment", url: "/payments/hotel-payment" },
      { title: "View Vehicle Detail", url: "/payments/vehicle" },
      { title: "Vehicle Due Amount", url: "/payments/vehicle-due" },
      { title: "Another Vehicle Payment", url: "/payments/vehicle-payment" },
    ]
  },
  {
    title: "Other Functions",
    icon: FileText,
    submenu: [
      { title: "View Group Expence", url: "/expenses" },
      { title: "View Cancel Booking", url: "/bookings/cancelled" },
      { title: "View Refund Payment", url: "/refunds" },
      { title: "View Cancelling Payment", url: "/refunds/cancelling" },
      { title: "Import Legacy Data", url: "/data-import" },
    ]
  },
  {
    title: "Restaurant",
    icon: UtensilsCrossed,
    submenu: [
      { title: "Tables", url: "/restaurant/tables" },
      { title: "Food Menu", url: "/restaurant/menu" },
      { title: "New Order (POS)", url: "/restaurant/pos" },
      { title: "View Orders", url: "/restaurant/orders" },
      { title: "Reports", url: "/restaurant/reports" },
    ]
  },
  {
    title: "Billing",
    icon: Receipt,
    submenu: [
      { title: "Create Invoice", url: "/billing" },
      { title: "Saved Invoices", url: "/invoices" },
      { title: "Invoice Templates", url: "/invoice-templates" },
    ]
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

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

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-52"} print:hidden transition-all duration-200`}>
      <SidebarContent>
        <div className="px-2 py-3">
          <h2 className={`font-bold text-sm bg-gradient-primary bg-clip-text text-transparent ${collapsed ? "hidden" : "block"}`}>
            HMS
          </h2>
          {collapsed && (
            <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">
              H
            </div>
          )}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={`text-[10px] ${collapsed ? "sr-only" : ""}`}>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (item.submenu) {
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
                                <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${openGroups.includes(item.title) ? 'rotate-180' : ''}`} />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!collapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.submenu.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild className="text-[10px] h-5">
                                    <NavLink
                                      to={subItem.url}
                                      className={({ isActive }) =>
                                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
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
                        to={item.url}
                        className={({ isActive }) =>
                          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
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
                <SidebarMenuButton onClick={handleLogout} size="sm" className="h-6 text-[11px] hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-3 w-3" />
                  {!collapsed && <span>Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
