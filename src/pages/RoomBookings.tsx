import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parse, isValid } from "date-fns";

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
}

interface UserBooking {
  userName: string;
  hotels: HotelBookingData[];
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
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [totalRooms, setTotalRooms] = useState(0);
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
          bookings!inner(status, reference, customer_name, agents(name)),
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

      // Group bookings by user (reference or customer_name)
      const userMap: Record<string, { hotels: Record<string, Record<string, number>> }> = {};

      (bookingsData || []).forEach((booking: any) => {
        // Determine user name: prefer reference, then agent name, then customer_name
        const userName = booking.bookings?.reference || 
                        booking.bookings?.agents?.name || 
                        booking.bookings?.customer_name || 
                        "Unknown User";

        // Get hotel name
        const hotelName = booking.own_hotels?.name || "Unknown Hotel";

        // Get room name
        const roomName = roomMap[booking.room_type] || booking.room_type || "Unknown Room";
        const roomCount = booking.number_of_rooms || 1;

        // Initialize user if not exists
        if (!userMap[userName]) {
          userMap[userName] = { hotels: {} };
        }

        // Initialize hotel if not exists
        if (!userMap[userName].hotels[hotelName]) {
          userMap[userName].hotels[hotelName] = {};
        }

        // Add room count
        userMap[userName].hotels[hotelName][roomName] = 
          (userMap[userName].hotels[hotelName][roomName] || 0) + roomCount;
      });

      // Convert to array format
      const results: UserBooking[] = Object.entries(userMap).map(([userName, data]) => {
        const hotelsArray: HotelBookingData[] = Object.entries(data.hotels).map(([hotelName, roomCounts]) => ({
          hotelName,
          rooms: Object.entries(roomCounts).map(([roomName, count]) => ({
            roomName,
            count
          }))
        }));

        const userTotalRooms = hotelsArray.reduce(
          (sum, h) => sum + h.rooms.reduce((rSum, r) => rSum + r.count, 0),
          0
        );

        return {
          userName,
          hotels: hotelsArray,
          totalRooms: userTotalRooms
        };
      });

      // Sort by user name
      results.sort((a, b) => a.userName.localeCompare(b.userName));

      // Calculate grand total
      const grandTotal = results.reduce((sum, u) => sum + u.totalRooms, 0);

      setUserBookings(results);
      setTotalRooms(grandTotal);
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

          {/* Total Rooms Summary */}
          {userBookings.length > 0 && (
            <div className="p-2 border-b border-gray-300" style={{ backgroundColor: "#F5E6E0" }}>
              <span className="font-bold text-[12px]">
                Total no. of Rooms : <span className="text-blue-700">{totalRooms}</span>
              </span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <tbody>
                {userBookings.length === 0 ? (
                  <tr style={{ backgroundColor: "#F5E6E0" }}>
                    <td colSpan={2} className="text-center py-8 text-muted-foreground">
                      {loading ? "Loading..." : "Select date range and click Search to view room bookings by user"}
                    </td>
                  </tr>
                ) : (
                  userBookings.map((userBooking, idx) => (
                    <tr key={idx} style={{ backgroundColor: "#F5E6E0" }} className="border-b border-gray-300">
                      <td className="p-2 border-r border-gray-300 align-top font-medium w-[150px]">
                        {userBooking.userName}
                      </td>
                      <td className="p-2">
                        {userBooking.hotels.map((hotel, hotelIdx) => (
                          <div key={hotelIdx} className="mb-2">
                            <div className="font-bold">{hotel.hotelName}</div>
                            {hotel.rooms.map((room, roomIdx) => (
                              <div key={roomIdx}>{room.roomName}:{room.count}</div>
                            ))}
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
