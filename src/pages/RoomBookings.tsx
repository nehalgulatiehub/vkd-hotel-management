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

interface DateBooking {
  date: string;
  hotelName: string;
  rooms: RoomData[];
  totalRooms: number;
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
    if (!selectedHotel) {
      toast.error("Please select a hotel");
      return;
    }

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
      // Fetch hotel bookings for the selected hotel within date range
      const { data: bookingsData, error } = await supabase
        .from("hotel_bookings")
        .select(`
          *,
          bookings!inner(status),
          own_hotels(name)
        `)
        .eq("own_hotel_id", selectedHotel)
        .in("bookings.status", ["confirmed", "completed", "hold"])
        .gte("check_in_date", format(fromDate, "yyyy-MM-dd"))
        .lte("check_in_date", format(toDate, "yyyy-MM-dd"));

      if (error) throw error;

      // Get hotel name
      const hotel = hotels.find(h => h.id === selectedHotel);
      const hotelName = hotel?.name || "Unknown Hotel";

      // Get all rooms for this hotel
      const hotelRooms = rooms.filter(r => r.hotel_id === selectedHotel);

      // Create a map of room_id to room_name
      const roomMap: Record<string, string> = {};
      hotelRooms.forEach(r => {
        roomMap[r.id] = r.room_type || r.room_number || "Unknown Room";
      });

      // Get all dates in range
      const allDates = eachDayOfInterval({ start: fromDate, end: toDate });

      // Group bookings by date
      const results: DateBooking[] = allDates.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        
        // Filter bookings where this date falls between check_in and check_out
        const dateBookings = (bookingsData || []).filter((b: any) => {
          return dateStr >= b.check_in_date && dateStr < b.check_out_date;
        });

        // Count rooms by type for this date
        const roomCounts: Record<string, number> = {};
        hotelRooms.forEach(r => {
          const roomName = r.room_type || r.room_number || "Unknown Room";
          roomCounts[roomName] = 0;
        });

        dateBookings.forEach((b: any) => {
          const roomName = roomMap[b.room_type] || b.room_type || "Unknown Room";
          roomCounts[roomName] = (roomCounts[roomName] || 0) + (b.number_of_rooms || 1);
        });

        const roomsArray: RoomData[] = Object.entries(roomCounts).map(([name, count]) => ({
          roomName: name,
          count: count as number
        }));

        const totalRooms = roomsArray.reduce((sum, r) => sum + r.count, 0);

        return {
          date: format(date, "dd/MM/yyyy"),
          hotelName,
          rooms: roomsArray,
          totalRooms
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
                  <option value="">Select Hotel</option>
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
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ backgroundColor: "#D4A59A" }}>
                  <th className="text-left p-2 font-semibold border-r border-gray-400 w-[120px]">Date.</th>
                  <th className="text-left p-2 font-semibold">Booking Detail</th>
                </tr>
              </thead>
              <tbody>
                {dateBookings.length === 0 ? (
                  <tr style={{ backgroundColor: "#F5E6E0" }}>
                    <td colSpan={2} className="text-center py-8 text-muted-foreground">
                      {loading ? "Loading..." : "Select hotel and date range, then click Search"}
                    </td>
                  </tr>
                ) : (
                  dateBookings.map((dateBooking, idx) => (
                    <tr key={idx} style={{ backgroundColor: "#F5E6E0" }} className="border-b border-gray-300">
                      <td className="p-2 border-r border-gray-300 align-top font-medium">
                        {dateBooking.date}
                      </td>
                      <td className="p-2">
                        <div className="font-bold mb-1">{dateBooking.hotelName}</div>
                        {dateBooking.rooms.map((room, roomIdx) => (
                          <div key={roomIdx}>{room.roomName}:{room.count}</div>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Footer */}
          {dateBookings.length > 0 && (
            <div className="p-2 border-t border-gray-300" style={{ backgroundColor: "#F5E6E0" }}>
              <span className="font-bold text-[12px]">
                Total no. of Rooms : <span className="text-blue-700">{dateBookings.reduce((sum, d) => sum + d.totalRooms, 0)}</span>
              </span>
            </div>
          )}

          {/* Blue Footer */}
          <div className="h-4" style={{ backgroundColor: "#1e6e99" }}></div>
        </div>
      </main>
    </div>
  );
}
