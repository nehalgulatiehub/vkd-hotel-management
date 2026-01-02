import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";
import { BookingReceipt } from "@/components/booking/BookingReceipt";

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [booking, setBooking] = useState<any>(null);
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [volvoBookings, setVolvoBookings] = useState<any[]>([]);
  const [safariBookings, setSafariBookings] = useState<any[]>([]);
  const [vehicleBookings, setVehicleBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);

      // Fetch main booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*, agents(name), guests(first_name, last_name)")
        .eq("id", id)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      // Fetch hotel bookings
      const { data: hotelData } = await supabase
        .from("hotel_bookings")
        .select("*, own_hotels(name), another_hotels(name)")
        .eq("booking_id", id);
      setHotelBookings(hotelData || []);

      // Fetch volvo bookings
      const { data: volvoData } = await supabase
        .from("volvo_bookings")
        .select("*")
        .eq("booking_id", id);
      setVolvoBookings(volvoData || []);

      // Fetch safari bookings
      const { data: safariData } = await supabase
        .from("safari_bookings")
        .select("*")
        .eq("booking_id", id);
      setSafariBookings(safariData || []);

      // Fetch vehicle bookings
      const { data: vehicleData } = await supabase
        .from("vehicle_bookings")
        .select("*, transporters(name)")
        .eq("booking_id", id);
      setVehicleBookings(vehicleData || []);

    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setShowPrint(false), 100);
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Booking Details" />
        <main className="p-6">
          <div className="text-center py-12">Loading...</div>
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Booking Details" />
        <main className="p-6">
          <div className="text-center py-12">Booking not found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Booking Details" />
      <main className="p-6 print:hidden">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate(isAdminRoute ? "/admin/bookings" : "/bookings")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Main Booking Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Booking Number</p>
                <p className="font-semibold">{booking.booking_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold capitalize">{booking.booking_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{booking.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer Name</p>
                <p className="font-semibold">{booking.customer_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact No</p>
                <p className="font-semibold">{booking.contact_no || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{booking.email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in Date</p>
                <p className="font-semibold">{new Date(booking.check_in_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out Date</p>
                <p className="font-semibold">{new Date(booking.check_out_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guests</p>
                <p className="font-semibold">{booking.adults} Adults, {booking.children} Children</p>
              </div>
              {booking.agents && (
                <div>
                  <p className="text-sm text-muted-foreground">Agent</p>
                  <p className="font-semibold">{booking.agents.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-semibold">{booking.reference || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cheque No</p>
                <p className="font-semibold">{booking.cheque_no || "-"}</p>
              </div>
            </div>
            {booking.address && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-semibold">{booking.address}</p>
              </div>
            )}
            {booking.notes && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-semibold">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-semibold text-lg">Rs. {booking.total_amount || 0}/-</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="font-semibold text-lg text-green-600">Rs. {booking.paid_amount || 0}/-</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Amount</p>
                <p className="font-semibold text-lg text-red-600">Rs. {booking.due_amount || 0}/-</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <p className="font-semibold capitalize">{booking.payment_status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hotel Bookings */}
        {hotelBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Hotel Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {hotelBookings.map((hotel, index) => (
                <div key={hotel.id} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hotel</p>
                      <p className="font-semibold">{hotel.own_hotels?.name || hotel.another_hotels?.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Room Type</p>
                      <p className="font-semibold">{hotel.room_type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Number of Rooms</p>
                      <p className="font-semibold">{hotel.number_of_rooms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="font-semibold">{new Date(hotel.check_in_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p className="font-semibold">{new Date(hotel.check_out_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">Rs. {hotel.total_amount || 0}/-</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Volvo Bookings */}
        {volvoBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Volvo Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {volvoBookings.map((volvo, index) => (
                <div key={volvo.id} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Route</p>
                      <p className="font-semibold">{volvo.route}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Travel Date</p>
                      <p className="font-semibold">{new Date(volvo.travel_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Seats</p>
                      <p className="font-semibold">{volvo.number_of_seats}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">Rs. {volvo.total_amount || 0}/-</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Safari Bookings */}
        {safariBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Safari Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {safariBookings.map((safari, index) => (
                <div key={safari.id} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Safari Name</p>
                      <p className="font-semibold">{safari.safari_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Safari Date</p>
                      <p className="font-semibold">{new Date(safari.safari_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Persons</p>
                      <p className="font-semibold">{safari.number_of_persons}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">Rs. {safari.total_amount || 0}/-</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Vehicle Bookings */}
        {vehicleBookings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Vehicle Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleBookings.map((vehicle, index) => (
                <div key={vehicle.id} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Type</p>
                      <p className="font-semibold capitalize">{vehicle.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transporter</p>
                      <p className="font-semibold">{vehicle.transporters?.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup Date</p>
                      <p className="font-semibold">{vehicle.pickup_date ? new Date(vehicle.pickup_date).toLocaleDateString() : "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-semibold">Rs. {vehicle.total_amount || 0}/-</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Print Receipt */}
      {showPrint && id && <BookingReceipt bookingId={id} />}
    </div>
  );
}
