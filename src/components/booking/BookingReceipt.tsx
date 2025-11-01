import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BookingReceiptProps {
  bookingId: string;
}

export function BookingReceipt({ bookingId }: BookingReceiptProps) {
  const [booking, setBooking] = useState<any>(null);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [volvoBookings, setVolvoBookings] = useState<any[]>([]);
  const [safariBookings, setSafariBookings] = useState<any[]>([]);
  const [vehicleBookings, setVehicleBookings] = useState<any[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<any[]>([]);

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("*, agents(name)")
      .eq("id", bookingId)
      .single();
    setBooking(bookingData);

    const { data: hotelData } = await supabase
      .from("hotel_bookings")
      .select("*, own_hotels(name), another_hotels(name)")
      .eq("booking_id", bookingId);
    setHotelBookings(hotelData || []);

    const { data: volvoData } = await supabase
      .from("volvo_bookings")
      .select("*")
      .eq("booking_id", bookingId);
    setVolvoBookings(volvoData || []);

    const { data: safariData } = await supabase
      .from("safari_bookings")
      .select("*")
      .eq("booking_id", bookingId);
    setSafariBookings(safariData || []);

    const { data: vehicleData } = await supabase
      .from("vehicle_bookings")
      .select("*, transporters(name)")
      .eq("booking_id", bookingId);
    setVehicleBookings(vehicleData || []);

    const { data: expenseData } = await supabase
      .from("group_expenses")
      .select("*")
      .eq("booking_id", bookingId);
    setGroupExpenses(expenseData || []);
  };

  if (!booking) return null;

  return (
    <div className="hidden print:block p-8 bg-white text-black">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold mb-2">BOOKING RECEIPT</h1>
        <p className="text-lg">Booking No: {booking.booking_number}</p>
        <p className="text-sm">Date: {new Date(booking.created_at).toLocaleDateString()}</p>
      </div>

      {/* Customer Information */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-2">CUSTOMER DETAILS</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {booking.customer_name || "-"}</p>
            <p><strong>Contact:</strong> {booking.contact_no || "-"}</p>
            <p><strong>Email:</strong> {booking.email || "-"}</p>
          </div>
          <div>
            <p><strong>Type:</strong> {booking.booking_type === "agent" ? "Agent" : "Direct"}</p>
            {booking.agents && <p><strong>Agent:</strong> {booking.agents.name}</p>}
            <p><strong>Reference:</strong> {booking.reference || "-"}</p>
          </div>
        </div>
        {booking.address && (
          <p className="mt-2"><strong>Address:</strong> {booking.address}</p>
        )}
      </div>

      {/* Booking Information */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-2">BOOKING DETAILS</h2>
        <div className="grid grid-cols-2 gap-4">
          <p><strong>Check-in:</strong> {new Date(booking.check_in_date).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> {new Date(booking.check_out_date).toLocaleDateString()}</p>
          <p><strong>Adults:</strong> {booking.adults}</p>
          <p><strong>Children:</strong> {booking.children}</p>
        </div>
        {booking.notes && (
          <p className="mt-2"><strong>Notes:</strong> {booking.notes}</p>
        )}
      </div>

      {/* Services Breakdown */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-2">SERVICES</h2>
        
        <table className="w-full border-collapse border border-black mb-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2 text-left">Service</th>
              <th className="border border-black p-2 text-left">Details</th>
              <th className="border border-black p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {hotelBookings.map((hotel, idx) => (
              <tr key={idx}>
                <td className="border border-black p-2">Hotel Booking</td>
                <td className="border border-black p-2">
                  {hotel.own_hotels?.name || hotel.another_hotels?.name}<br/>
                  {hotel.room_type} - {hotel.number_of_rooms} room(s)<br/>
                  {new Date(hotel.check_in_date).toLocaleDateString()} to {new Date(hotel.check_out_date).toLocaleDateString()}
                </td>
                <td className="border border-black p-2 text-right">Rs. {hotel.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}

            {volvoBookings.map((volvo, idx) => (
              <tr key={idx}>
                <td className="border border-black p-2">Volvo - {volvo.route}</td>
                <td className="border border-black p-2">
                  {volvo.number_of_seats} seat(s)<br/>
                  Travel Date: {new Date(volvo.travel_date).toLocaleDateString()}
                </td>
                <td className="border border-black p-2 text-right">Rs. {volvo.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}

            {safariBookings.map((safari, idx) => (
              <tr key={idx}>
                <td className="border border-black p-2">Safari</td>
                <td className="border border-black p-2">
                  {safari.safari_name}<br/>
                  {safari.number_of_persons} person(s)<br/>
                  Date: {new Date(safari.safari_date).toLocaleDateString()}
                </td>
                <td className="border border-black p-2 text-right">Rs. {safari.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}

            {vehicleBookings.map((vehicle, idx) => (
              <tr key={idx}>
                <td className="border border-black p-2">Vehicle</td>
                <td className="border border-black p-2">
                  {vehicle.vehicle_type}<br/>
                  {vehicle.transporters?.name || "N/A"}<br/>
                  Pickup: {vehicle.pickup_date ? new Date(vehicle.pickup_date).toLocaleDateString() : "-"}
                </td>
                <td className="border border-black p-2 text-right">Rs. {vehicle.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}

            {groupExpenses.map((expense, idx) => (
              <tr key={idx}>
                <td className="border border-black p-2">Group Expense</td>
                <td className="border border-black p-2">{expense.description || expense.category}</td>
                <td className="border border-black p-2 text-right">Rs. {expense.amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Summary */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-300 pb-2">PAYMENT SUMMARY</h2>
        <table className="w-full">
          <tbody>
            <tr className="border-b">
              <td className="py-2 text-right pr-4"><strong>Total Amount:</strong></td>
              <td className="py-2 text-right font-bold">Rs. {booking.total_amount?.toFixed(2) || "0.00"}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 text-right pr-4"><strong>Paid Amount:</strong></td>
              <td className="py-2 text-right text-green-700">Rs. {booking.paid_amount?.toFixed(2) || "0.00"}</td>
            </tr>
            <tr className="border-b border-black border-b-2">
              <td className="py-2 text-right pr-4"><strong>Due Amount:</strong></td>
              <td className="py-2 text-right font-bold text-red-700">Rs. {booking.due_amount?.toFixed(2) || "0.00"}</td>
            </tr>
            <tr>
              <td className="py-2 text-right pr-4"><strong>Payment Status:</strong></td>
              <td className="py-2 text-right capitalize font-bold">{booking.payment_status}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {booking.cheque_no && (
        <div className="mb-6">
          <p><strong>Cheque No:</strong> {booking.cheque_no}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 border-black text-center">
        <p className="text-sm">Thank you for your booking!</p>
        <p className="text-xs mt-2">This is a computer-generated receipt</p>
      </div>
    </div>
  );
}
