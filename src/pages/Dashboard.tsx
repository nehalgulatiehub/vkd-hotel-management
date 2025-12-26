import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, DollarSign, Hotel } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalGuests: 0,
    totalRevenue: 0,
    totalHotels: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [bookingsRes, guestsRes, hotelsRes] = await Promise.all([
        supabase.from("bookings").select("total_amount, paid_amount", { count: "exact" }),
        supabase.from("guests").select("*", { count: "exact" }),
        supabase.from("another_hotels").select("*", { count: "exact" }),
      ]);

      const totalRevenue = bookingsRes.data?.reduce((sum, booking) => 
        sum + (Number(booking.paid_amount) || 0), 0
      ) || 0;

      setStats({
        totalBookings: bookingsRes.count || 0,
        totalGuests: guestsRes.count || 0,
        totalRevenue,
        totalHotels: hotelsRes.count || 0,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />
      <main className="p-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
          />
          <StatCard
            title="Total Guests"
            value={stats.totalGuests}
            icon={Users}
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
            icon={DollarSign}
          />
          <StatCard
            title="Partner Hotels"
            value={stats.totalHotels}
            icon={Hotel}
          />
        </div>

        <div className="bg-card rounded-md p-3 shadow-sm border">
          <h2 className="text-sm font-semibold mb-1">Welcome to Hotel Management</h2>
          <p className="text-[11px] text-muted-foreground">
            Comprehensive system for booking management, payments & operations.
          </p>
        </div>
      </main>
    </div>
  );
}
