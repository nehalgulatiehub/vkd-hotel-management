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
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Welcome to Hotel Management Software</h2>
          <p className="text-muted-foreground">
            Comprehensive hotel management system for booking management, payments tracking, and operations.
          </p>
        </div>
      </main>
    </div>
  );
}
