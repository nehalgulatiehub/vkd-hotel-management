import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function BookingPayments() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("id");
  const [payments, setPayments] = useState<any[]>([]);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingId) {
      fetchPayments();
      fetchBooking();
    } else {
      fetchAllPayments();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("booking_number, customer_name, total_amount, paid_amount, due_amount")
      .eq("id", bookingId)
      .single();
    setBooking(data);
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

  return (
    <div className="min-h-screen bg-background">
      <Header title="Booking Payments" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            {bookingId ? "Booking Payment History" : "All Payments"}
          </h2>
        </div>

        {booking && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Number</p>
                  <p className="font-semibold">{booking.booking_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold">Rs. {booking.total_amount?.toFixed(2) || "0.00"}/-</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Amount</p>
                  <p className="font-semibold text-red-600">Rs. {booking.due_amount?.toFixed(2) || "0.00"}/-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
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
                    <th className="p-3 text-left">Reference</th>
                    <th className="p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={bookingId ? 6 : 8} className="p-6 text-center text-muted-foreground">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment, index) => (
                      <tr key={payment.id} className="border-t hover:bg-muted/50">
                        <td className="p-3">{index + 1}</td>
                        <td className="p-3">{new Date(payment.payment_date).toLocaleDateString()}</td>
                        {!bookingId && <td className="p-3">{payment.bookings?.booking_number}</td>}
                        {!bookingId && <td className="p-3">{payment.bookings?.customer_name}</td>}
                        <td className="p-3">Rs. {payment.amount?.toFixed(2) || "0.00"}/-</td>
                        <td className="p-3 capitalize">{payment.payment_mode || "-"}</td>
                        <td className="p-3">{payment.reference_number || "-"}</td>
                        <td className="p-3">{payment.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
