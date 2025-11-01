import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function VolvoPayments() {
  const [volvoBookings, setVolvoBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVolvoPayments();
  }, []);

  const fetchVolvoPayments = async () => {
    const { data, error } = await supabase
      .from("volvo_bookings")
      .select("*, bookings(booking_number, customer_name, contact_no)")
      .gt("paid_amount", 0)
      .order("updated_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load volvo payments");
    } else {
      setVolvoBookings(data || []);
    }
  };

  const filteredBookings = volvoBookings.filter(booking =>
    booking.bookings?.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.bookings?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPaid = filteredBookings.reduce((sum, booking) => sum + (booking.paid_amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Volvo Payments" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">View Volvo Payments</h2>
          <p className="text-muted-foreground mt-2">
            Total Payments: <span className="font-bold text-lg text-green-600">₹{totalPaid.toLocaleString()}</span>
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by booking number, customer, or route..."
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
                    <th className="text-left p-4 font-semibold">Route</th>
                    <th className="text-left p-4 font-semibold">Travel Date</th>
                    <th className="text-left p-4 font-semibold">Seats</th>
                    <th className="text-left p-4 font-semibold">Total Amount</th>
                    <th className="text-left p-4 font-semibold">Paid Amount</th>
                    <th className="text-left p-4 font-semibold">Due Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{booking.bookings?.booking_number || "-"}</td>
                      <td className="p-4">{booking.bookings?.customer_name || "-"}</td>
                      <td className="p-4">{booking.bookings?.contact_no || "-"}</td>
                      <td className="p-4">
                        <Badge>{booking.route}</Badge>
                      </td>
                      <td className="p-4">
                        {booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">{booking.number_of_seats}</td>
                      <td className="p-4">₹{booking.total_amount?.toLocaleString() || 0}</td>
                      <td className="p-4 font-bold text-green-600">
                        ₹{booking.paid_amount?.toLocaleString() || 0}
                      </td>
                      <td className="p-4">₹{booking.due_amount?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No volvo payments found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
