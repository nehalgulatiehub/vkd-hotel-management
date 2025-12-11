import { 
  LayoutDashboard, MapPin, Users, Truck, Building2, CalendarCheck, 
  Wallet, FileStack, Settings, LogOut, ChevronRight, Upload,
  Building, Bus, Tent, Car, Receipt, Ban, RefreshCcw
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, 
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  useSidebar
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuItem {
  title: string;
  url?: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: { title: string; url: string }[];
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Cities",
    icon: MapPin,
    submenu: [
      { title: "View Cities", url: "/cities" },
      { title: "Add New City", url: "/cities/add" },
      { title: "Export Cities", url: "/cities/export" },
    ]
  },
  {
    title: "Agents",
    icon: Users,
    submenu: [
      { title: "View Agents", url: "/agents" },
      { title: "Add New Agent", url: "/agents/add" },
      { title: "Export Agents", url: "/agents/export" },
    ]
  },
  {
    title: "Transporters",
    icon: Truck,
    submenu: [
      { title: "View Transporters", url: "/transporters" },
      { title: "Add Transporter", url: "/transporters/add" },
      { title: "Export Transporters", url: "/transporters/export" },
    ]
  },
  {
    title: "Hotels",
    icon: Building2,
    submenu: [
      { title: "Own Hotels", url: "/own-hotels" },
      { title: "Partner Hotels", url: "/hotels" },
      { title: "Add Partner Hotel", url: "/hotels/add" },
      { title: "Export Hotels", url: "/hotels/export" },
    ]
  },
  {
    title: "Bookings",
    icon: CalendarCheck,
    submenu: [
      { title: "All Bookings", url: "/bookings" },
      { title: "Create Booking", url: "/bookings/add" },
      { title: "Hold Bookings", url: "/bookings/hold-list" },
      { title: "Create Hold Booking", url: "/bookings/hold" },
      { title: "Check Availability", url: "/bookings/availability" },
    ]
  },
  {
    title: "Enquiries",
    icon: FileStack,
    submenu: [
      { title: "View Enquiries", url: "/enquiries" },
      { title: "New Enquiry", url: "/enquiries/add" },
      { title: "Export Enquiries", url: "/enquiries/export" },
    ]
  },
  {
    title: "Payments",
    icon: Wallet,
    submenu: [
      { title: "All Payments", url: "/payments" },
      { title: "Booking Due", url: "/payments/booking-due" },
      { title: "Booking Payments", url: "/payments/booking" },
    ]
  },
  {
    title: "Safari",
    icon: Tent,
    submenu: [
      { title: "Safari Details", url: "/payments/safari" },
      { title: "Safari Due", url: "/payments/safari-due" },
      { title: "Safari Payments", url: "/payments/safari-payment" },
    ]
  },
  {
    title: "Volvo Transport",
    icon: Bus,
    submenu: [
      { title: "Delhi → Manali", url: "/payments/volvo-delhi-manali" },
      { title: "Manali → Delhi", url: "/payments/volvo-manali-delhi" },
      { title: "Delhi-Manali Due", url: "/payments/delhi-manali-due" },
      { title: "Manali-Delhi Due", url: "/payments/manali-delhi-due" },
      { title: "Volvo Payments", url: "/payments/volvo" },
    ]
  },
  {
    title: "Partner Hotels",
    icon: Building,
    submenu: [
      { title: "Hotel Details", url: "/payments/hotel" },
      { title: "Hotel Due", url: "/payments/hotel-due" },
      { title: "Hotel Payments", url: "/payments/hotel-payment" },
    ]
  },
  {
    title: "Vehicles",
    icon: Car,
    submenu: [
      { title: "Vehicle Details", url: "/payments/vehicle" },
      { title: "Vehicle Due", url: "/payments/vehicle-due" },
      { title: "Vehicle Payments", url: "/payments/vehicle-payment" },
    ]
  },
  {
    title: "Other",
    icon: Receipt,
    submenu: [
      { title: "Group Expenses", url: "/expenses" },
      { title: "Cancelled Bookings", url: "/bookings/cancelled" },
      { title: "Refunds", url: "/refunds" },
      { title: "Cancelling Payments", url: "/refunds/cancelling" },
      { title: "Import Data", url: "/data-import" },
    ]
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Auto-expand group containing active route
  useEffect(() => {
    const currentPath = location.pathname;
    menuItems.forEach(item => {
      if (item.submenu?.some(sub => currentPath.startsWith(sub.url))) {
        setOpenGroups(prev => 
          prev.includes(item.title) ? prev : [...prev, item.title]
        );
      }
    });
  }, [location.pathname]);

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

  const isActiveRoute = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  return (
    <Sidebar className={cn(
      "border-r border-sidebar-border bg-sidebar print:hidden transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <SidebarContent className="flex flex-col h-full">
        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
          collapsed && "justify-center px-2"
        )}>
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">
                Hotel Management
              </span>
              <span className="text-xs text-sidebar-muted truncate">
                Admin Panel
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {menuItems.map((item) => {
                  if (item.submenu) {
                    const isGroupActive = item.submenu.some(sub => isActiveRoute(sub.url));
                    const isOpen = openGroups.includes(item.title);
                    
                    return (
                      <Collapsible
                        key={item.title}
                        open={isOpen}
                        onOpenChange={() => toggleGroup(item.title)}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton 
                              className={cn(
                                "w-full justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                                isGroupActive && "bg-sidebar-accent text-sidebar-foreground"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                {!collapsed && <span>{item.title}</span>}
                              </div>
                              {!collapsed && (
                                <ChevronRight className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  isOpen && "rotate-90"
                                )} />
                              )}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          {!collapsed && (
                            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                              <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                                {item.submenu.map((subItem) => (
                                  <NavLink
                                    key={subItem.url}
                                    to={subItem.url}
                                    className={({ isActive }) => cn(
                                      "block rounded-md px-3 py-1.5 text-sm transition-colors",
                                      isActive 
                                        ? "bg-primary text-primary-foreground font-medium" 
                                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                    )}
                                  >
                                    {subItem.title}
                                  </NavLink>
                                ))}
                              </div>
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
                          to={item.url!}
                          className={({ isActive }) => cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>

        {/* Footer */}
        <div className="mt-auto border-t border-sidebar-border p-2">
          <SidebarMenu className="space-y-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink 
                  to="/settings" 
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>Settings</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleLogout} 
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>Logout</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}