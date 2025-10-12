import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bed, Calendar, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [roomsResult, bookingsResult] = await Promise.all([
        supabase.from('rooms').select('status', { count: 'exact' }),
        supabase.from('bookings').select('total_amount, status', { count: 'exact' })
      ]);

      if (roomsResult.error) throw roomsResult.error;
      if (bookingsResult.error) throw bookingsResult.error;

      const occupiedRooms = roomsResult.data?.filter(r => r.status === 'occupied').length || 0;
      const totalRevenue = bookingsResult.data?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;

      setStats({
        totalRooms: roomsResult.count || 0,
        occupiedRooms,
        totalBookings: bookingsResult.count || 0,
        totalRevenue,
      });
    } catch (error: any) {
      toast.error("Failed to fetch dashboard stats");
    }
  };

  const occupancyRate = stats.totalRooms > 0 
    ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />
      <main className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Rooms"
            value={stats.totalRooms}
            icon={Bed}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Occupancy Rate"
            value={`${occupancyRate}%`}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={Calendar}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 15, isPositive: true }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No recent bookings to display</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Room Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Available</span>
                  <span className="text-sm font-bold text-success">
                    {stats.totalRooms - stats.occupiedRooms}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Occupied</span>
                  <span className="text-sm font-bold text-primary">{stats.occupiedRooms}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
