import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function BookingDue() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBookingsWithDue();
  }, []);

  const fetchBookingsWithDue = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, agents(name)")
      .gt("due_amount", 0)
      .neq("status", "cancelled")
      .order("due_amount", { ascending: false });

    if (error) {
      toast.error("Failed to load bookings with due amount");
    } else {
      setBookings(data || []);
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.agents?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDue = filteredBookings.reduce((sum, booking) => sum + (booking.due_amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Booking Due Amount" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Booking Due Amount</h2>
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
                  placeholder="Search by booking number, customer, or agent..."
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
                    <th className="text-left p-4 font-semibold">S.No.</th>
                    <th className="text-left p-4 font-semibold">Booking No</th>
                    <th className="text-left p-4 font-semibold">Customer</th>
                    <th className="text-left p-4 font-semibold">Contact</th>
                    <th className="text-left p-4 font-semibold">Agent</th>
                    <th className="text-left p-4 font-semibold">Check-in</th>
                    <th className="text-left p-4 font-semibold">Total</th>
                    <th className="text-left p-4 font-semibold">Paid</th>
                    <th className="text-left p-4 font-semibold">Due</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4 font-medium">{booking.booking_number}</td>
                      <td className="p-4">{booking.customer_name || "-"}</td>
                      <td className="p-4">{booking.contact_no || "-"}</td>
                      <td className="p-4">{booking.agents?.name || "Direct"}</td>
                      <td className="p-4">
                        {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">₹{booking.total_amount?.toLocaleString() || 0}</td>
                      <td className="p-4 text-green-600">₹{booking.paid_amount?.toLocaleString() || 0}</td>
                      <td className="p-4 font-bold text-destructive">₹{booking.due_amount?.toLocaleString() || 0}</td>
                      <td className="p-4">
                        <Badge variant={booking.payment_status === "partial" ? "secondary" : "destructive"}>
                          {booking.payment_status || "pending"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/booking-details?id=${booking.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredBookings.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No bookings with due amount found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
