import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RoomBookings() {
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHotelBookings();
  }, []);

  const fetchHotelBookings = async () => {
    const { data, error } = await supabase
      .from("hotel_bookings")
      .select(`
        *,
        bookings(booking_number, customer_name, status),
        own_hotels(name),
        another_hotels:hotel_id(name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load hotel bookings");
    } else {
      setHotelBookings(data || []);
    }
  };

  const filteredBookings = hotelBookings.filter(booking =>
    booking.bookings?.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.bookings?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.own_hotels?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.another_hotels?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header title="Room Bookings" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">View Room Bookings</h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking number, customer, or hotel..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Booking No</th>
                    <th className="text-left p-4 font-semibold">Hotel</th>
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Room Type</th>
                    <th className="text-left p-4 font-semibold">Rooms</th>
                    <th className="text-left p-4 font-semibold">Check-in</th>
                    <th className="text-left p-4 font-semibold">Check-out</th>
                    <th className="text-left p-4 font-semibold">Total</th>
                    <th className="text-left p-4 font-semibold">Paid</th>
                    <th className="text-left p-4 font-semibold">Due</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{booking.bookings?.booking_number || "-"}</td>
                      <td className="p-4">
                        {booking.own_hotels?.name || booking.another_hotels?.name || "-"}
                      </td>
                      <td className="p-4">{booking.bookings?.customer_name || "-"}</td>
                      <td className="p-4">{booking.room_type || "-"}</td>
                      <td className="p-4">{booking.number_of_rooms}</td>
                      <td className="p-4">
                        {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">
                        {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">₹{booking.total_amount?.toLocaleString() || 0}</td>
                      <td className="p-4">₹{booking.paid_amount?.toLocaleString() || 0}</td>
                      <td className="p-4">₹{booking.due_amount?.toLocaleString() || 0}</td>
                      <td className="p-4">
                        <Badge variant={booking.bookings?.status === "confirmed" ? "default" : "secondary"}>
                          {booking.bookings?.status || "N/A"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No room bookings found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
