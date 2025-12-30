import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, ArrowLeft } from "lucide-react";

export default function BookingPayments() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get("id");
  const [payments, setPayments] = useState<any[]>([]);
  const [booking, setBooking] = useState<any>(null);
  const [hotelInfo, setHotelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (bookingId) {
        await Promise.all([fetchPayments(), fetchBooking(), fetchHotelInfo()]);
      } else {
        await fetchAllPayments();
      }
      setLoading(false);
    };
    loadData();
  }, [bookingId]);

  const fetchBooking = async () => {
    const { data } = await supabase
      .from("bookings")
      .select(`
        booking_number, 
        customer_name, 
        contact_no,
        email,
        address,
        total_amount, 
        paid_amount, 
        due_amount,
        check_in_date,
        check_out_date,
        adults,
        children,
        status,
        payment_status,
        agents(name)
      `)
      .eq("id", bookingId)
      .single();
    setBooking(data);
  };

  const fetchHotelInfo = async () => {
    const { data } = await supabase
      .from("hotel_bookings")
      .select(`
        room_type,
        number_of_rooms,
        hotel:another_hotels(name),
        own_hotel:own_hotels(name)
      `)
      .eq("booking_id", bookingId);
    
    if (data && data.length > 0) {
      const hotel = data[0];
      setHotelInfo({
        hotel_name: hotel.hotel?.name || hotel.own_hotel?.name || "-",
        room_type: hotel.room_type || "-",
        number_of_rooms: hotel.number_of_rooms || 1
      });
    }
  };

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });
    setPayments(data || []);
  };

  const fetchAllPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*, bookings(booking_number, customer_name)")
      .order("payment_date", { ascending: false });
    setPayments(data || []);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Partial</Badge>;
      case "refunded":
        return <Badge className="bg-blue-500">Refunded</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "hold":
        return <Badge className="bg-yellow-500">Hold</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Booking Payments" />
      <main className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {bookingId && (
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <h2 className="text-2xl font-semibold">
              {bookingId ? "Booking Payment History" : "All Payments"}
            </h2>
          </div>
          {bookingId && (
            <Button onClick={() => navigate(`/booking-details/${bookingId}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View Booking
            </Button>
          )}
        </div>

        {booking && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Number</p>
                  <p className="font-semibold">{booking.booking_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{booking.customer_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-semibold">{booking.contact_no || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{booking.email || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in</p>
                  <p className="font-semibold">{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-out</p>
                  <p className="font-semibold">{booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guests</p>
                  <p className="font-semibold">{booking.adults || 0} Adults, {booking.children || 0} Children</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agent</p>
                  <p className="font-semibold">{booking.agents?.name || "Direct"}</p>
                </div>
              </div>

              {hotelInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Hotel</p>
                    <p className="font-semibold">{hotelInfo.hotel_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Room Type</p>
                    <p className="font-semibold">{hotelInfo.room_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No. of Rooms</p>
                    <p className="font-semibold">{hotelInfo.number_of_rooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getBookingStatusBadge(booking.status)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">Rs. {booking.total_amount?.toFixed(2) || "0.00"}/-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                  <p className="font-semibold text-lg text-green-600">Rs. {booking.paid_amount?.toFixed(2) || "0.00"}/-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Amount</p>
                  <p className="font-semibold text-lg text-red-600">Rs. {booking.due_amount?.toFixed(2) || "0.00"}/-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  {getPaymentStatusBadge(booking.payment_status)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">S.No.</th>
                      <th className="p-3 text-left">Date</th>
                      {!bookingId && <th className="p-3 text-left">Booking</th>}
                      {!bookingId && <th className="p-3 text-left">Customer</th>}
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Mode</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Reference</th>
                      <th className="p-3 text-left">Notes</th>
                      {!bookingId && <th className="p-3 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={bookingId ? 8 : 11} className="p-6 text-center text-muted-foreground">
                          No payments found for this booking
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment, index) => (
                        <tr key={payment.id} className="border-t hover:bg-muted/50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3">{new Date(payment.payment_date).toLocaleDateString()}</td>
                          {!bookingId && <td className="p-3">{payment.bookings?.booking_number || "-"}</td>}
                          {!bookingId && <td className="p-3">{payment.bookings?.customer_name || "-"}</td>}
                          <td className="p-3 font-semibold">Rs. {payment.amount?.toFixed(2) || "0.00"}/-</td>
                          <td className="p-3 capitalize">{payment.payment_mode || "-"}</td>
                          <td className="p-3 capitalize">{payment.payment_type || "-"}</td>
                          <td className="p-3">{getStatusBadge(payment.approval_status || "pending")}</td>
                          <td className="p-3">{payment.reference_number || "-"}</td>
                          <td className="p-3">{payment.notes || "-"}</td>
                          {!bookingId && payment.booking_id && (
                            <td className="p-3">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/payments/booking?id=${payment.booking_id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                          {!bookingId && !payment.booking_id && <td className="p-3">-</td>}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
