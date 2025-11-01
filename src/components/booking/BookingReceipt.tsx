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
    <div className="hidden print:block p-8 bg-white text-black max-w-5xl mx-auto">
      {/* Company Header */}
      <div className="text-center mb-6 pb-6 border-b-4 border-black">
        <h1 className="text-4xl font-bold mb-1">YOUR HOTEL NAME</h1>
        <p className="text-sm mb-3">Address Line 1, City, State - PIN CODE</p>
        <p className="text-sm">Phone: +91 XXXXX XXXXX | Email: info@yourhotel.com | Website: www.yourhotel.com</p>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-400">
        <h2 className="text-3xl font-bold mb-2">BOOKING CONFIRMATION</h2>
        <div className="flex justify-between px-4 mt-3">
          <div className="text-left">
            <p className="text-sm"><strong>Booking No:</strong> {booking.booking_number}</p>
            <p className="text-sm"><strong>Booking Date:</strong> {new Date(booking.created_at).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm"><strong>Status:</strong> <span className="uppercase">{booking.status}</span></p>
            <p className="text-sm"><strong>Payment Status:</strong> <span className="uppercase">{booking.payment_status}</span></p>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-3 border-b-2 border-gray-400 pb-2">GUEST INFORMATION</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="mb-2"><strong>Guest Name:</strong> {booking.customer_name || "-"}</p>
            <p className="mb-2"><strong>Contact Number:</strong> {booking.contact_no || "-"}</p>
            <p className="mb-2"><strong>Email Address:</strong> {booking.email || "-"}</p>
            {booking.address && <p className="mb-2"><strong>Address:</strong> {booking.address}</p>}
          </div>
          <div>
            <p className="mb-2"><strong>Booking Type:</strong> <span className="capitalize">{booking.booking_type}</span></p>
            {booking.agents && <p className="mb-2"><strong>Agent Name:</strong> {booking.agents.name}</p>}
            <p className="mb-2"><strong>Reference:</strong> {booking.reference || "-"}</p>
            {booking.cheque_no && <p className="mb-2"><strong>Cheque No:</strong> {booking.cheque_no}</p>}
          </div>
        </div>
      </div>

      {/* Booking Information */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-3 border-b-2 border-gray-400 pb-2">STAY DETAILS</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Check-in Date</p>
            <p className="font-bold text-lg">{new Date(booking.check_in_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Check-out Date</p>
            <p className="font-bold text-lg">{new Date(booking.check_out_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Number of Nights</p>
            <p className="font-bold text-lg">{Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mt-4">
          <p><strong>Number of Adults:</strong> {booking.adults}</p>
          <p><strong>Number of Children:</strong> {booking.children}</p>
        </div>
        {booking.notes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm"><strong>Special Notes:</strong> {booking.notes}</p>
          </div>
        )}
      </div>

      {/* Services Breakdown */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 border-b-2 border-gray-400 pb-2">SERVICES BREAKDOWN</h2>
        
        <table className="w-full border-collapse border-2 border-black mb-4">
          <thead>
            <tr className="bg-gray-300">
              <th className="border border-black p-3 text-left font-bold">SERVICE TYPE</th>
              <th className="border border-black p-3 text-left font-bold">DESCRIPTION</th>
              <th className="border border-black p-3 text-right font-bold">AMOUNT (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {hotelBookings.map((hotel, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-black p-3 font-semibold">Hotel Accommodation</td>
                <td className="border border-black p-3">
                  <p className="font-semibold">{hotel.own_hotels?.name || hotel.another_hotels?.name}</p>
                  <p className="text-sm">Room Type: {hotel.room_type}</p>
                  <p className="text-sm">Number of Rooms: {hotel.number_of_rooms}</p>
                  <p className="text-sm">Duration: {new Date(hotel.check_in_date).toLocaleDateString()} to {new Date(hotel.check_out_date).toLocaleDateString()}</p>
                </td>
                <td className="border border-black p-3 text-right font-semibold">{hotel.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}

            {volvoBookings.map((volvo, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-black p-3 font-semibold">Volvo Transport</td>
                <td className="border border-black p-3">
                  <p className="font-semibold">Route: {volvo.route}</p>
                  <p className="text-sm">Number of Seats: {volvo.number_of_seats}</p>
                  <p className="text-sm">Travel Date: {new Date(volvo.travel_date).toLocaleDateString()}</p>
                </td>
                <td className="border border-black p-3 text-right font-semibold">{volvo.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}

            {safariBookings.map((safari, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-black p-3 font-semibold">Safari Booking</td>
                <td className="border border-black p-3">
                  <p className="font-semibold">{safari.safari_name}</p>
                  <p className="text-sm">Number of Persons: {safari.number_of_persons}</p>
                  <p className="text-sm">Safari Date: {new Date(safari.safari_date).toLocaleDateString()}</p>
                </td>
                <td className="border border-black p-3 text-right font-semibold">{safari.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}

            {vehicleBookings.map((vehicle, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-black p-3 font-semibold">Vehicle Service</td>
                <td className="border border-black p-3">
                  <p className="font-semibold">Vehicle Type: {vehicle.vehicle_type}</p>
                  <p className="text-sm">Transporter: {vehicle.transporters?.name || "N/A"}</p>
                  <p className="text-sm">Pickup Date: {vehicle.pickup_date ? new Date(vehicle.pickup_date).toLocaleDateString() : "-"}</p>
                  {vehicle.dropoff_date && <p className="text-sm">Dropoff Date: {new Date(vehicle.dropoff_date).toLocaleDateString()}</p>}
                </td>
                <td className="border border-black p-3 text-right font-semibold">{vehicle.total_amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}

            {groupExpenses.map((expense, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-black p-3 font-semibold">Additional Expense</td>
                <td className="border border-black p-3">
                  <p className="font-semibold">{expense.category || "Group Expense"}</p>
                  <p className="text-sm">{expense.description}</p>
                </td>
                <td className="border border-black p-3 text-right font-semibold">{expense.amount?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Summary */}
      <div className="mb-6 bg-gray-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-4 border-b-2 border-gray-400 pb-2">PAYMENT SUMMARY</h2>
        <table className="w-full border-2 border-black">
          <tbody>
            <tr className="border-b border-black bg-gray-100">
              <td className="py-3 px-4 text-right text-lg"><strong>TOTAL AMOUNT:</strong></td>
              <td className="py-3 px-4 text-right font-bold text-xl">Rs. {booking.total_amount?.toFixed(2) || "0.00"}/-</td>
            </tr>
            <tr className="border-b border-black">
              <td className="py-3 px-4 text-right text-lg"><strong>AMOUNT PAID:</strong></td>
              <td className="py-3 px-4 text-right font-bold text-xl text-green-700">Rs. {booking.paid_amount?.toFixed(2) || "0.00"}/-</td>
            </tr>
            <tr className="bg-red-50 border-b-2 border-black">
              <td className="py-3 px-4 text-right text-lg"><strong>BALANCE DUE:</strong></td>
              <td className="py-3 px-4 text-right font-bold text-2xl text-red-700">Rs. {booking.due_amount?.toFixed(2) || "0.00"}/-</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-right">
          <p className="text-sm"><strong>Payment Status:</strong> <span className="uppercase font-bold px-3 py-1 bg-gray-200 rounded">{booking.payment_status}</span></p>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-6 text-xs border-t border-gray-300 pt-4">
        <h3 className="font-bold mb-2">TERMS & CONDITIONS:</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Check-in time: 2:00 PM | Check-out time: 11:00 AM</li>
          <li>Early check-in and late check-out subject to availability and additional charges</li>
          <li>Cancellation policy: Please refer to booking terms</li>
          <li>Valid ID proof required at check-in</li>
          <li>Damages to hotel property will be charged separately</li>
        </ul>
      </div>

      {/* Signature Section */}
      <div className="mt-8 mb-6 grid grid-cols-2 gap-8">
        <div className="text-center">
          <div className="border-t-2 border-black pt-2 mt-16">
            <p className="font-semibold">Guest Signature</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-black pt-2 mt-16">
            <p className="font-semibold">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-4 border-black text-center">
        <p className="font-semibold text-lg mb-1">Thank you for choosing us!</p>
        <p className="text-xs text-gray-600">This is a computer-generated receipt and does not require a signature</p>
        <p className="text-xs text-gray-600 mt-1">For queries, please contact us at the above mentioned details</p>
      </div>
    </div>
  );
}
