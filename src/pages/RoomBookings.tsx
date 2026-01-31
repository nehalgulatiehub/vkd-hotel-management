import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parse, isValid, eachDayOfInterval } from "date-fns";

interface Hotel {
  id: string;
  name: string;
}

interface RoomData {
  roomName: string;
  count: number;
}

interface HotelBookingData {
  hotelName: string;
  rooms: RoomData[];
  totalRooms: number;
}

interface DateBooking {
  date: string;
  hotels: HotelBookingData[];
}

export default function RoomBookings() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [fromMonth, setFromMonth] = useState(String(new Date().getMonth() + 1));
  const [fromDay, setFromDay] = useState(String(new Date().getDate()));
  const [fromYear, setFromYear] = useState(String(new Date().getFullYear()));
  const [toMonth, setToMonth] = useState(String(new Date().getMonth() + 1));
  const [toDay, setToDay] = useState(String(new Date().getDate()));
  const [toYear, setToYear] = useState(String(new Date().getFullYear()));
  const [dateBookings, setDateBookings] = useState<DateBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

  const months = [
    { value: "1", label: "Jan" }, { value: "2", label: "Feb" }, { value: "3", label: "Mar" },
    { value: "4", label: "Apr" }, { value: "5", label: "May" }, { value: "6", label: "Jun" },
    { value: "7", label: "Jul" }, { value: "8", label: "Aug" }, { value: "9", label: "Sep" },
    { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
  ];

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - 2 + i));

  useEffect(() => {
    fetchHotels();
    fetchRooms();
  }, []);

  const fetchHotels = async () => {
    const { data, error } = await supabase
      .from("own_hotels")
      .select("id, name")
      .order("name");
    if (!error && data) {
      setHotels(data);
    }
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, room_type, room_number, hotel_id");
    if (!error && data) {
      setRooms(data);
    }
  };

  const handleSearch = async () => {
    const fromDate = parse(`${fromYear}-${fromMonth.padStart(2, "0")}-${fromDay.padStart(2, "0")}`, "yyyy-MM-dd", new Date());
    const toDate = parse(`${toYear}-${toMonth.padStart(2, "0")}-${toDay.padStart(2, "0")}`, "yyyy-MM-dd", new Date());

    if (!isValid(fromDate) || !isValid(toDate)) {
      toast.error("Invalid date format");
      return;
    }

    if (fromDate > toDate) {
      toast.error("From date must be before To date");
      return;
    }

    setLoading(true);

    try {
      // Fetch hotel bookings within date range with booking and hotel details
      let query = supabase
        .from("hotel_bookings")
        .select(`
          *,
          bookings!inner(
            status, 
            reference, 
            customer_name,
            created_by
          ),
          own_hotels(id, name)
        `)
        .in("bookings.status", ["confirmed", "completed", "hold"])
        .gte("check_in_date", format(fromDate, "yyyy-MM-dd"))
        .lte("check_in_date", format(toDate, "yyyy-MM-dd"));

      // Filter by selected hotel if specified
      if (selectedHotel) {
        query = query.eq("own_hotel_id", selectedHotel);
      }

      const { data: bookingsData, error } = await query;

      if (error) throw error;

      // Create a map of room_id to room_name
      const roomMap: Record<string, string> = {};
      rooms.forEach(r => {
        roomMap[r.id] = r.room_type || r.room_number || "Unknown Room";
      });

      // Get all dates in the range
      const allDates = eachDayOfInterval({ start: fromDate, end: toDate });

      // Group bookings by date -> hotel -> room
      const dateMap: Record<string, Record<string, Record<string, number>>> = {};

      // Initialize all dates
      allDates.forEach(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        dateMap[dateStr] = {};
      });

      (bookingsData || []).forEach((booking: any) => {
        // Skip bookings without own_hotel_id (only show own hotels)
        if (!booking.own_hotel_id || !booking.own_hotels?.name) {
          return;
        }

        const checkInDate = booking.check_in_date;
        const hotelName = booking.own_hotels.name;
        const roomName = roomMap[booking.room_type] || booking.room_type || "Unknown Room";
        const roomCount = booking.number_of_rooms || 1;

        // Initialize date if not exists
        if (!dateMap[checkInDate]) {
          dateMap[checkInDate] = {};
        }

        // Initialize hotel if not exists
        if (!dateMap[checkInDate][hotelName]) {
          dateMap[checkInDate][hotelName] = {};
        }

        // Add room count
        dateMap[checkInDate][hotelName][roomName] = 
          (dateMap[checkInDate][hotelName][roomName] || 0) + roomCount;
      });

      // Get all rooms for each hotel to show all room types (even with 0 count)
      const hotelRoomsMap: Record<string, string[]> = {};
      rooms.forEach(r => {
        const hotel = hotels.find(h => h.id === r.hotel_id);
        if (hotel) {
          if (!hotelRoomsMap[hotel.name]) {
            hotelRoomsMap[hotel.name] = [];
          }
          const roomName = r.room_type || r.room_number || "Unknown Room";
          if (!hotelRoomsMap[hotel.name].includes(roomName)) {
            hotelRoomsMap[hotel.name].push(roomName);
          }
        }
      });

      // Convert to array format
      const results: DateBooking[] = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateStr, hotelData]) => {
          // Get all hotels that should be displayed (either selected or all)
          const relevantHotels = selectedHotel 
            ? hotels.filter(h => h.id === selectedHotel)
            : hotels;

          const hotelsArray: HotelBookingData[] = relevantHotels.map(hotel => {
            const hotelBookings = hotelData[hotel.name] || {};
            const allRoomTypes = hotelRoomsMap[hotel.name] || [];
            
            const roomsWithCounts = allRoomTypes.map(roomName => ({
              roomName,
              count: hotelBookings[roomName] || 0
            }));

            const totalRooms = roomsWithCounts.reduce((sum, r) => sum + r.count, 0);

            return {
              hotelName: hotel.name,
              rooms: roomsWithCounts,
              totalRooms
            };
          });

          return {
            date: dateStr,
            hotels: hotelsArray
          };
        });

      setDateBookings(results);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, "yyyy-MM-dd", new Date());
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="View Room Booking" />
      <main className="p-4">
        {/* Main Container with rounded corners */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {/* Blue Header */}
          <div className="text-white px-4 py-2 font-semibold text-[14px]" style={{ backgroundColor: "#1e6e99" }}>
            View Room Booking
          </div>

          {/* Filter Section */}
          <div className="p-3 border-b" style={{ backgroundColor: "#F5E6E0" }}>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              {/* Booking From */}
              <div className="flex items-center gap-1">
                <span className="whitespace-nowrap">Booking From</span>
                <select
                  value={fromMonth}
                  onChange={(e) => setFromMonth(e.target.value)}
                  className="border border-gray-400 px-1 py-0.5 text-[11px] bg-white"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={fromDay}
                  onChange={(e) => setFromDay(e.target.value)}
                  className="border border-gray-400 px-1 py-0.5 text-[11px] bg-white"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={fromYear}
                  onChange={(e) => setFromYear(e.target.value)}
                  className="border border-gray-400 px-1 py-0.5 text-[11px] bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Booking To */}
              <div className="flex items-center gap-1">
                <span className="whitespace-nowrap">Booking To</span>
                <select
                  value={toMonth}
                  onChange={(e) => setToMonth(e.target.value)}
                  className="border border-gray-400 px-1 py-0.5 text-[11px] bg-white"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={toDay}
                  onChange={(e) => setToDay(e.target.value)}
                  className="border border-gray-400 px-1 py-0.5 text-[11px] bg-white"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={toYear}
                  onChange={(e) => setToYear(e.target.value)}
                  className="border border-gray-400 px-1 py-0.5 text-[11px] bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Hotel */}
              <div className="flex items-center gap-1">
                <span>Hotel :</span>
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="border border-gray-400 px-1 py-0.5 text-[11px] bg-white min-w-[140px]"
                >
                  <option value="">All Hotels</option>
                  {hotels.map((hotel) => (
                    <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <Button
                size="sm"
                onClick={handleSearch}
                disabled={loading}
                className="h-6 px-3 text-[11px]"
                style={{ backgroundColor: "#1e6e99" }}
              >
                {loading ? "..." : "Search"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#D4A59A" }}>
                  <th className="text-left p-2 border border-gray-400 w-[120px]">Date.</th>
                  <th className="text-left p-2 border border-gray-400">Booking Detail</th>
                </tr>
              </thead>
              <tbody>
                {dateBookings.length === 0 ? (
                  <tr style={{ backgroundColor: "#F5E6E0" }}>
                    <td colSpan={2} className="text-center py-8 text-muted-foreground border border-gray-400">
                      {loading ? "Loading..." : "Select date range and click Search to view room bookings"}
                    </td>
                  </tr>
                ) : (
                  dateBookings.map((dateBooking, idx) => (
                    <tr key={idx} style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="p-2 border border-gray-400 align-top font-medium">
                        {formatDisplayDate(dateBooking.date)}
                      </td>
                      <td className="p-2 border border-gray-400">
                        {dateBooking.hotels.map((hotel, hotelIdx) => (
                          <div key={hotelIdx} className="mb-2">
                            <div className="font-bold">{hotel.hotelName}</div>
                            {hotel.rooms.map((room, roomIdx) => (
                              <div key={roomIdx}>{room.roomName}:{room.count}</div>
                            ))}
                            <div>Rooms:{hotel.totalRooms}</div>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Blue Footer */}
          <div className="h-4" style={{ backgroundColor: "#1e6e99" }}></div>
        </div>
      </main>
    </div>
  );
}
