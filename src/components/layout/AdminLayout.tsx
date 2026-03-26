import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { format } from "date-fns";
import mukutLogo from "@/assets/mukut-logo.webp";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading, user } = useAuthContext();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    } else if (!loading && user && !isAdmin() && !isAccount()) {
      navigate("/admin/login");
    }
  }, [loading, user, isAdmin, isAccount, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (!isAdmin() && !isAccount())) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full" style={{ backgroundColor: "rgb(253, 246, 246)" }}>
        {/* Pink Header with Logo */}
        <header className="py-4 px-6 print:hidden" style={{ backgroundColor: "rgb(248, 216, 217)" }}>
          <img src={mukutLogo} alt="Mukut Hotels" className="h-16" />
        </header>

        {/* Secured Admin Panel Label */}
        <div className="px-6 py-1 print:hidden">
          <span className="text-[#8B1538] font-bold text-xs tracking-widest uppercase">Secured Admin Panel V1.0</span>
        </div>

        {/* Sidebar + Content */}
        <div className="flex flex-1">
          <AdminSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
