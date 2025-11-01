import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function BookingAvailability() {
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [ownHotels, setOwnHotels] = useState<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);
  const [availabilityResults, setAvailabilityResults] = useState<any[]>([]);

  useEffect(() => {
    fetchOwnHotels();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      fetchRooms();
    }
  }, [selectedHotel]);

  const fetchOwnHotels = async () => {
    const { data } = await supabase
      .from("own_hotels")
      .select("*")
      .order("name");
    setOwnHotels(data || []);
  };

  const fetchRooms = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("hotel_id", selectedHotel)
      .order("room_number");
    setRooms(data || []);
  };

  const checkAvailability = async () => {
    if (!checkInDate || !checkOutDate || !selectedHotel) {
      toast.error("Please select hotel and dates");
      return;
    }

    // Get all bookings that overlap with the selected dates
    const { data: hotelBookings, error } = await supabase
      .from("hotel_bookings")
      .select("*, rooms(room_number, room_type)")
      .eq("own_hotel_id", selectedHotel)
      .or(`and(check_in_date.lte.${format(checkOutDate, "yyyy-MM-dd")},check_out_date.gte.${format(checkInDate, "yyyy-MM-dd")})`);

    if (error) {
      toast.error("Failed to check availability");
      return;
    }

    // Calculate room availability
    const roomAvailability = rooms.map(room => {
      const bookedForRoom = hotelBookings?.filter(b => b.room_type === room.id) || [];
      const isAvailable = bookedForRoom.length === 0;
      
      return {
        ...room,
        isAvailable,
        bookings: bookedForRoom
      };
    });

    setAvailabilityResults(roomAvailability);
    toast.success("Availability checked");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Booking Availability" />
      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Check Room Availability</h2>
          <p className="text-muted-foreground">See which rooms are available for your selected dates</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label>Select Hotel</Label>
                <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownHotels.map((hotel) => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Check-in Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkInDate ? format(checkInDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={setCheckInDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Check-out Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOutDate ? format(checkOutDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={checkOutDate}
                      onSelect={setCheckOutDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={checkAvailability} 
                  className="w-full bg-gradient-primary"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Check Availability
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {availabilityResults.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Availability Results</h3>
              <div className="space-y-4">
                {availabilityResults.map((room) => (
                  <div 
                    key={room.id} 
                    className={`p-4 border rounded-lg ${
                      room.isAvailable ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">Room {room.room_number}</h4>
                        <p className="text-sm text-muted-foreground">{room.room_type}</p>
                        <p className="text-sm">
                          Capacity: {room.adult_capacity} adults, {room.child_capacity} children
                        </p>
                        <p className="text-sm font-semibold">₹{room.base_price.toLocaleString()}/night</p>
                      </div>
                      <div>
                        {room.isAvailable ? (
                          <Badge className="bg-green-600">Available</Badge>
                        ) : (
                          <Badge className="bg-red-600">Booked</Badge>
                        )}
                      </div>
                    </div>
                    {!room.isAvailable && room.bookings.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          Booked for {room.bookings.length} booking(s) during this period
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {availabilityResults.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Select a hotel and dates to check room availability
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
