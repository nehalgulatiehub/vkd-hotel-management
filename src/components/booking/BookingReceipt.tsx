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
    <div className="fixed inset-0 bg-white z-[9999] hidden print:static print:block w-full overflow-auto">
      <div className="p-4 bg-white text-black max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-4">{new Date(booking.created_at).toLocaleDateString('en-GB')}</p>
          <h1 className="text-3xl font-bold mb-1">YOUR HOTEL NAME</h1>
          <p className="text-sm text-gray-600">This is your receipt</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-2">This is your receipt</p>
          <p className="text-sm text-gray-600">Booking Number</p>
          <p className="text-lg font-semibold">{booking.booking_number}</p>
        </div>
      </div>

      {/* YOUR DETAILS */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-4 uppercase">Your Details</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Name</p>
            <p className="text-sm">{booking.customer_name || "-"}</p>
          </div>
          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Email address</p>
            <p className="text-sm">{booking.email || "-"}</p>
          </div>
          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Contact number</p>
            <p className="text-sm">{booking.contact_no || "-"}</p>
          </div>
          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Date</p>
            <p className="text-sm">{new Date(booking.created_at).toLocaleDateString('en-GB')}</p>
          </div>
          {booking.address && (
            <div className="grid grid-cols-2">
              <p className="text-sm text-gray-600">Address</p>
              <p className="text-sm">{booking.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* BOOKING DETAILS */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-4 uppercase">Booking Details</h2>
        <div className="space-y-3">
          {hotelBookings.map((hotel, idx) => (
            <div key={idx}>
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-600">Property name</p>
                <p className="text-sm font-semibold">{hotel.own_hotels?.name || hotel.another_hotels?.name}</p>
              </div>
              <div className="grid grid-cols-2 mt-2">
                <p className="text-sm text-gray-600">Room type</p>
                <p className="text-sm">{hotel.room_type}</p>
              </div>
              <div className="grid grid-cols-2 mt-2">
                <p className="text-sm text-gray-600">Number of rooms</p>
                <p className="text-sm">{hotel.number_of_rooms}</p>
              </div>
            </div>
          ))}

          {volvoBookings.map((volvo, idx) => (
            <div key={idx}>
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-600">Volvo route</p>
                <p className="text-sm">{volvo.route}</p>
              </div>
              <div className="grid grid-cols-2 mt-2">
                <p className="text-sm text-gray-600">Number of seats</p>
                <p className="text-sm">{volvo.number_of_seats}</p>
              </div>
              <div className="grid grid-cols-2 mt-2">
                <p className="text-sm text-gray-600">Travel date</p>
                <p className="text-sm">{new Date(volvo.travel_date).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          ))}

          {safariBookings.map((safari, idx) => (
            <div key={idx}>
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-600">Safari name</p>
                <p className="text-sm">{safari.safari_name}</p>
              </div>
              <div className="grid grid-cols-2 mt-2">
                <p className="text-sm text-gray-600">Number of persons</p>
                <p className="text-sm">{safari.number_of_persons}</p>
              </div>
              <div className="grid grid-cols-2 mt-2">
                <p className="text-sm text-gray-600">Safari date</p>
                <p className="text-sm">{new Date(safari.safari_date).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
          ))}

          {vehicleBookings.map((vehicle, idx) => (
            <div key={idx}>
              <div className="grid grid-cols-2">
                <p className="text-sm text-gray-600">Vehicle type</p>
                <p className="text-sm">{vehicle.vehicle_type}</p>
              </div>
              <div className="grid grid-cols-2 mt-2">
                <p className="text-sm text-gray-600">Transporter</p>
                <p className="text-sm">{vehicle.transporters?.name || "N/A"}</p>
              </div>
              {vehicle.pickup_date && (
                <div className="grid grid-cols-2 mt-2">
                  <p className="text-sm text-gray-600">Pickup date</p>
                  <p className="text-sm">{new Date(vehicle.pickup_date).toLocaleDateString('en-GB')}</p>
                </div>
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 mt-4">
            <p className="text-sm text-gray-600">Booking number</p>
            <p className="text-sm">{booking.booking_number}</p>
          </div>

          {booking.reference && (
            <div className="grid grid-cols-2">
              <p className="text-sm text-gray-600">Payment reference</p>
              <p className="text-sm">{booking.reference}</p>
            </div>
          )}

          {booking.cheque_no && (
            <div className="grid grid-cols-2">
              <p className="text-sm text-gray-600">Cheque number</p>
              <p className="text-sm">{booking.cheque_no}</p>
            </div>
          )}

          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Check-in</p>
            <p className="text-sm">{new Date(booking.check_in_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Check-out</p>
            <p className="text-sm">{new Date(booking.check_out_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Adults</p>
            <p className="text-sm">{booking.adults}</p>
          </div>

          {booking.children > 0 && (
            <div className="grid grid-cols-2">
              <p className="text-sm text-gray-600">Children</p>
              <p className="text-sm">{booking.children}</p>
            </div>
          )}

          {booking.agents && (
            <div className="grid grid-cols-2">
              <p className="text-sm text-gray-600">Agent name</p>
              <p className="text-sm">{booking.agents.name}</p>
            </div>
          )}

          <div className="grid grid-cols-2 pt-2 border-t">
            <p className="text-sm text-gray-600">Total amount</p>
            <p className="text-sm font-semibold">₹ {booking.total_amount?.toFixed(2) || "0.00"}</p>
          </div>

          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Amount paid on {new Date(booking.created_at).toLocaleDateString('en-GB')}</p>
            <p className="text-sm font-semibold">₹ {booking.paid_amount?.toFixed(2) || "0.00"}</p>
          </div>

          {booking.due_amount > 0 && (
            <div className="grid grid-cols-2">
              <p className="text-sm text-gray-600">Balance due</p>
              <p className="text-sm font-semibold text-red-600">₹ {booking.due_amount?.toFixed(2) || "0.00"}</p>
            </div>
          )}

          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Payment status</p>
            <p className="text-sm uppercase">{booking.payment_status}</p>
          </div>

          <div className="grid grid-cols-2">
            <p className="text-sm text-gray-600">Booking status</p>
            <p className="text-sm uppercase">{booking.status}</p>
          </div>

          {booking.notes && (
            <div className="grid grid-cols-2 pt-2">
              <p className="text-sm text-gray-600">Special notes</p>
              <p className="text-sm">{booking.notes}</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
