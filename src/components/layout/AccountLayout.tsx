import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { AccountSidebar, getAccountMenuItemForPath, getFirstAccessibleAccountRoute } from "./AccountSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import mukutLogo from "@/assets/mukut-logo.webp";

interface AccountLayoutProps {
  children: React.ReactNode;
}

export function AccountLayout({ children }: AccountLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAccount, isAdmin, loading, menuPermissions, user } = useAuthContext();

  const adminUser = isAdmin();
  const accountUser = isAccount();
  const hasAccountMenuAccess = (menuKey: string) => {
    if (accountUser) return menuPermissions.includes(menuKey);
    return adminUser;
  };
  const currentMenuItem = getAccountMenuItemForPath(location.pathname);
  const firstAccessibleRoute = getFirstAccessibleAccountRoute(hasAccountMenuAccess);
  const accountRouteAllowed =
    currentMenuItem?.menuKey ? hasAccountMenuAccess(currentMenuItem.menuKey) : false;

  useEffect(() => {
    if (!loading && !user) {
      navigate("/account/login");
    } else if (!loading && user && !accountUser && !adminUser) {
      navigate("/account/login");
    } else if (!loading && user && accountUser && !adminUser && !accountRouteAllowed && firstAccessibleRoute) {
      navigate(firstAccessibleRoute, { replace: true });
    }
  }, [accountRouteAllowed, accountUser, adminUser, firstAccessibleRoute, loading, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!accountUser && !adminUser)) {
    return null;
  }

  if (accountUser && !adminUser && !firstAccessibleRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "rgb(253, 246, 246)" }}>
        <div className="text-sm font-semibold text-destructive">No account modules assigned.</div>
      </div>
    );
  }

  if (accountUser && !adminUser && !accountRouteAllowed) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full" style={{ backgroundColor: "rgb(253, 246, 246)" }}>
        {/* Pink Header with Logo */}
        <header
          className="py-3 px-4 md:py-4 md:px-6 print:hidden flex items-center gap-3 sticky top-0 z-40"
          style={{ backgroundColor: "rgb(248, 216, 217)" }}
        >
          <SidebarTrigger className="md:hidden text-[#8B1538]" />
          <img src={mukutLogo} alt="Mukut Hotels" className="h-10 md:h-16" />
        </header>

        {/* Secured Account Panel Label */}
        <div className="px-4 md:px-6 py-1 print:hidden">
          <span className="text-[#8B1538] font-bold text-[10px] md:text-xs tracking-widest uppercase">Secured Account Panel V1.0</span>
        </div>

        {/* Sidebar + Content */}
        <div className="flex flex-1 min-w-0">
          <AccountSidebar />
          <main className="flex-1 min-w-0 overflow-x-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
