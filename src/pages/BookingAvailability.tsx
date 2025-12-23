import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Room {
  id: string;
  room_number: string;
  total_quantity: number;
  base_price: number;
  hotel_id: string;
}

interface Hotel {
  id: string;
  name: string;
  rooms?: Room[];
}

interface HotelBooking {
  id: string;
  own_hotel_id: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  number_of_rooms: number;
}

export default function BookingAvailability() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [baseDate, setBaseDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch hotels with their rooms
    const { data: hotelsData } = await supabase
      .from("own_hotels")
      .select("id, name")
      .order("name");

    // Fetch all rooms
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("id, room_number, total_quantity, base_price, hotel_id")
      .order("room_number");

    // Fetch all hotel bookings (from confirmed/completed bookings only, exclude cancelled)
    const { data: bookingsData } = await supabase
      .from("hotel_bookings")
      .select(`
        id, own_hotel_id, room_type, check_in_date, check_out_date, number_of_rooms,
        bookings!inner(status)
      `)
      .not("own_hotel_id", "is", null)
      .in("bookings.status", ["confirmed", "completed", "hold"]);

    // Map rooms to hotels
    const hotelsWithRooms = (hotelsData || []).map(hotel => ({
      ...hotel,
      rooms: (roomsData || []).filter(room => room.hotel_id === hotel.id)
    }));

    setHotels(hotelsWithRooms);
    setHotelBookings(bookingsData || []);
    setLoading(false);
  };

  // Generate 12 months starting from baseDate
  const months = Array.from({ length: 12 }, (_, i) => addMonths(baseDate, i));

  const getDaysInMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachDayOfInterval({ start, end });
  };

  const getBookingsForDate = (hotelId: string, roomId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return hotelBookings.filter(booking => {
      if (booking.own_hotel_id !== hotelId) return false;
      // room_type in hotel_bookings stores the room id, not the room name
      if (booking.room_type !== roomId) return false;
      return dateStr >= booking.check_in_date && dateStr < booking.check_out_date;
    });
  };

  const getAvailableRooms = (room: Room, date: Date) => {
    const bookings = getBookingsForDate(room.hotel_id, room.id, date);
    const bookedRooms = bookings.reduce((sum, b) => sum + (b.number_of_rooms || 1), 0);
    return Math.max(0, (room.total_quantity || 1) - bookedRooms);
  };

  const isDateBooked = (room: Room, date: Date) => {
    return getAvailableRooms(room, date) === 0;
  };

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Booking Availability" />
        <main className="p-6">
          <div className="text-center py-12">Loading availability...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Booking Availability" />
      <main className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Booking Availability</h2>
            <p className="text-muted-foreground">View room availability across all hotels</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setBaseDate(addMonths(baseDate, -12))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {format(baseDate, "yyyy")} - {format(addMonths(baseDate, 11), "yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setBaseDate(addMonths(baseDate, 12))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {months.map((month, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="py-2 px-3 bg-primary/10">
                <CardTitle className="text-sm font-semibold text-center">
                  {format(month, "MMMM yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                  {weekDays.map((day, i) => (
                    <div key={i} className="text-xs font-medium text-muted-foreground p-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {/* Empty cells for days before the first of the month */}
                  {Array.from({ length: getDay(startOfMonth(month)) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {/* Days of the month */}
                  {getDaysInMonth(month).map((day) => {
                    const isToday = isSameDay(day, new Date());
                    const hasBookings = hotels.some(hotel => 
                      hotel.rooms?.some(room => getBookingsForDate(hotel.id, room.id, day).length > 0)
                    );
                    
                    return (
                      <HoverCard key={day.toISOString()} openDelay={200}>
                        <HoverCardTrigger asChild>
                          <div
                            className={cn(
                              "aspect-square flex items-center justify-center text-xs rounded cursor-pointer transition-colors",
                              isToday && "ring-2 ring-primary",
                              hasBookings ? "bg-rose-100 text-rose-700 hover:bg-rose-200" : "hover:bg-muted"
                            )}
                          >
                            {format(day, "d")}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-3" side="right">
                          <div className="space-y-2">
                            <p className="font-semibold text-sm">
                              {format(day, "EEEE, MMMM d, yyyy")}
                            </p>
                            {hotels.filter(h => h.rooms && h.rooms.length > 0).map(hotel => (
                              <div key={hotel.id} className="text-xs">
                                <p className="font-medium text-primary">{hotel.name}</p>
                                <div className="ml-2 space-y-0.5">
                                  {hotel.rooms?.map(room => {
                                    const available = getAvailableRooms(room, day);
                                    const total = room.total_quantity || 1;
                                    return (
                                      <p key={room.id} className={cn(
                                        available === 0 ? "text-destructive" : "text-muted-foreground"
                                      )}>
                                        {room.room_number}: {available}/{total} available
                                      </p>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                            {hotels.filter(h => h.rooms && h.rooms.length > 0).length === 0 && (
                              <p className="text-xs text-muted-foreground">No rooms configured</p>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hotel Room Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Room Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {hotels.filter(h => h.rooms && h.rooms.length > 0).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hotels with rooms configured. Add rooms to your hotels first.
              </p>
            ) : (
              <div className="space-y-6">
                {hotels.filter(h => h.rooms && h.rooms.length > 0).map(hotel => (
                  <div key={hotel.id}>
                    <h3 className="font-semibold text-primary mb-2">{hotel.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {hotel.rooms?.map(room => (
                        <div 
                          key={room.id} 
                          className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm"
                        >
                          <span>{room.room_number}</span>
                          <span className="font-medium">{room.total_quantity || 1} Rooms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}