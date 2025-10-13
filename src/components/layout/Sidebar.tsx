import { 
  Home, MapPin, Users, Plane, Hotel, FileText, 
  CreditCard, Calendar, DollarSign, Settings, LogOut,
  ChevronDown
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
      { title: "View Cities", url: "/cities" },
    ]
  },
  {
    title: "Agent Management",
    icon: Users,
    submenu: [
      { title: "Add Agent", url: "/agents/add" },
      { title: "View Agents", url: "/agents" },
    ]
  },
  {
    title: "Transporter Management",
    icon: Plane,
    submenu: [
      { title: "Add Transporter", url: "/transporters/add" },
      { title: "View Transporters", url: "/transporters" },
    ]
  },
  {
    title: "Hotel Management",
    icon: Hotel,
    submenu: [
      { title: "Add Hotel", url: "/hotels/add" },
      { title: "View Hotels", url: "/hotels" },
    ]
  },
  {
    title: "Booking & Enquiry",
    icon: Calendar,
    submenu: [
      { title: "Generate Enquiry", url: "/enquiries/add" },
      { title: "View Enquiries", url: "/enquiries" },
      { title: "Create Hold Booking", url: "/bookings/hold" },
      { title: "View Hold Bookings", url: "/bookings/hold-list" },
      { title: "Create Booking", url: "/bookings/add" },
      { title: "View Bookings", url: "/bookings" },
    ]
  },
  {
    title: "Payment & Financials",
    icon: DollarSign,
    submenu: [
      { title: "Booking Due Amount", url: "/payments/booking-due" },
      { title: "View Payments", url: "/payments" },
      { title: "View Booking Payments", url: "/payments/booking" },
      { title: "Safari Due Amount", url: "/payments/safari-due" },
      { title: "View Safari Details", url: "/payments/safari" },
      { title: "Volvo Due Amount", url: "/payments/volvo-due" },
      { title: "View Volvo Payments", url: "/payments/volvo" },
      { title: "Hotel Due Amount", url: "/payments/hotel-due" },
      { title: "View Hotel Payments", url: "/payments/hotel" },
      { title: "Vehicle Due Amount", url: "/payments/vehicle-due" },
      { title: "View Vehicle Payments", url: "/payments/vehicle" },
    ]
  },
  {
    title: "Other Functions",
    icon: FileText,
    submenu: [
      { title: "View Group Expenses", url: "/expenses" },
      { title: "View Cancelled Bookings", url: "/bookings/cancelled" },
      { title: "View Refunds", url: "/refunds" },
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
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarContent>
        <div className="px-4 py-6">
          <h2 className={`font-bold text-xl bg-gradient-primary bg-clip-text text-transparent ${collapsed ? "hidden" : "block"}`}>
            DKV INDIA
          </h2>
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              DKV
            </div>
          )}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Main Menu</SidebarGroupLabel>
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
                          <SidebarMenuButton className="w-full">
                            <item.icon className="h-4 w-4" />
                            {!collapsed && (
                              <>
                                <span>{item.title}</span>
                                <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openGroups.includes(item.title) ? 'rotate-180' : ''}`} />
                              </>
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        {!collapsed && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.submenu.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild>
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
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        className={({ isActive }) =>
                          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="h-4 w-4" />
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
                <SidebarMenuButton asChild>
                  <NavLink to="/settings" className="hover:bg-sidebar-accent/50">
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-4 w-4" />
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
