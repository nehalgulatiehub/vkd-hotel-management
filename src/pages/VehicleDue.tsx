import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function VehicleDue() {
  const [vehicleBookings, setVehicleBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVehicleBookings();
  }, []);

  const fetchVehicleBookings = async () => {
    const { data, error } = await supabase
      .from("vehicle_bookings")
      .select("*, bookings(booking_number, customer_name, status, contact_no), transporters(name)")
      .gt("due_amount", 0)
      .order("pickup_date", { ascending: true });
    
    if (error) {
      toast.error("Failed to load vehicle due amounts");
    } else {
      setVehicleBookings(data || []);
    }
  };

  const filteredBookings = vehicleBookings.filter(booking =>
    booking.bookings?.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.bookings?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.transporters?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDue = filteredBookings.reduce((sum, booking) => sum + (booking.due_amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Vehicle Due Amount" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Vehicle Due Amount</h2>
          <p className="text-muted-foreground mt-2">
            Total Due: <span className="font-bold text-lg text-destructive">₹{totalDue.toLocaleString()}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking number, customer, or transporter..."
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
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Contact</th>
                    <th className="text-left p-4 font-semibold">Transporter</th>
                    <th className="text-left p-4 font-semibold">Pickup Date</th>
                    <th className="text-left p-4 font-semibold">Total Amount</th>
                    <th className="text-left p-4 font-semibold">Paid Amount</th>
                    <th className="text-left p-4 font-semibold">Due Amount</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{booking.bookings?.booking_number || "-"}</td>
                      <td className="p-4">{booking.bookings?.customer_name || "-"}</td>
                      <td className="p-4">{booking.bookings?.contact_no || "-"}</td>
                      <td className="p-4">{booking.transporters?.name || "-"}</td>
                      <td className="p-4">
                        {booking.pickup_date ? new Date(booking.pickup_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">₹{booking.total_amount?.toLocaleString() || 0}</td>
                      <td className="p-4">₹{booking.paid_amount?.toLocaleString() || 0}</td>
                      <td className="p-4 font-bold text-destructive">
                        ₹{booking.due_amount?.toLocaleString() || 0}
                      </td>
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
                  No vehicle due amounts found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
