import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parse, isValid, eachDayOfInterval } from "date-fns";
import { useAuthContext } from "@/contexts/AuthContext";

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

interface DateGroupedData {
  date: string;
  totalRooms: number;
  users: UserBooking[];
}

export default function AdminRoomBookings() {
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [fromMonth, setFromMonth] = useState(String(new Date().getMonth() + 1));
  const [fromDay, setFromDay] = useState(String(new Date().getDate()));
  const [fromYear, setFromYear] = useState(String(new Date().getFullYear()));
  const [toMonth, setToMonth] = useState(String(new Date().getMonth() + 1));
  const [toDay, setToDay] = useState(String(new Date().getDate()));
  const [toYear, setToYear] = useState(String(new Date().getFullYear()));
  const [dateGroupedData, setDateGroupedData] = useState<DateGroupedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);

  const canManage = isAdmin() || isAccount();

  const months = [
    { value: "1", label: "Jan" }, { value: "2", label: "Feb" }, { value: "3", label: "Mar" },
    { value: "4", label: "Apr" }, { value: "5", label: "May" }, { value: "6", label: "Jun" },
    { value: "7", label: "Jul" }, { value: "8", label: "Aug" }, { value: "9", label: "Sep" },
    { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
  ];

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - 2 + i));

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchHotels();
      fetchRooms();
    }
  }, [authLoading, canManage]);

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

      // Get all unique created_by user IDs
      const userIds = [...new Set(
        (bookingsData || [])
          .map((b: any) => b.bookings?.created_by)
          .filter(Boolean)
      )];

      // Fetch profiles for these users
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, first_name, last_name")
          .in("id", userIds);

        if (profiles) {
          profiles.forEach((p: any) => {
            if (p.username) {
              profilesMap[p.id] = p.username;
            } else if (p.first_name || p.last_name) {
              profilesMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim();
            } else {
              profilesMap[p.id] = "Unknown User";
            }
          });
        }
      }

      // Create a map of room_id to room_name
      const roomMap: Record<string, string> = {};
      rooms.forEach(r => {
        roomMap[r.id] = r.room_type || r.room_number || "Unknown Room";
      });

      // Group by date first, then by user
      const dateMap: Record<string, Record<string, { hotels: Record<string, Record<string, number>> }>> = {};

      (bookingsData || []).forEach((booking: any) => {
        // Skip bookings without own_hotel_id (only show own hotels)
        if (!booking.own_hotel_id || !booking.own_hotels?.name) {
          return;
        }

        const checkInDate = booking.check_in_date;
        const createdBy = booking.bookings?.created_by;
        const userName = createdBy ? (profilesMap[createdBy] || "Unknown User") : "Unknown User";
        const hotelName = booking.own_hotels.name;
        const roomName = roomMap[booking.room_type] || booking.room_type || "Unknown Room";
        const roomCount = booking.number_of_rooms || 1;

        // Initialize date group if not exists
        if (!dateMap[checkInDate]) {
          dateMap[checkInDate] = {};
        }

        // Initialize user if not exists
        if (!dateMap[checkInDate][userName]) {
          dateMap[checkInDate][userName] = { hotels: {} };
        }

        // Initialize hotel if not exists
        if (!dateMap[checkInDate][userName].hotels[hotelName]) {
          dateMap[checkInDate][userName].hotels[hotelName] = {};
        }

        // Add room count
        dateMap[checkInDate][userName].hotels[hotelName][roomName] = 
          (dateMap[checkInDate][userName].hotels[hotelName][roomName] || 0) + roomCount;
      });

      // Convert to array format grouped by date
      const results: DateGroupedData[] = Object.entries(dateMap)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, usersData]) => {
          const users: UserBooking[] = Object.entries(usersData).map(([userName, data]) => {
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
          }).sort((a, b) => a.userName.localeCompare(b.userName));

          const dateTotalRooms = users.reduce((sum, u) => sum + u.totalRooms, 0);

          return {
            date,
            totalRooms: dateTotalRooms,
            users
          };
        });

      const total = results.reduce((sum, d) => sum + d.totalRooms, 0);
      setGrandTotal(total);
      setDateGroupedData(results);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!canManage) {
    return <div className="p-6 text-center">Access Denied</div>;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-[#1e6e99] text-white px-4 py-2 flex items-center justify-between mb-0">
        <span className="text-sm font-medium">View Room Booking</span>
      </div>

      {/* Search Filter Section */}
      <div className="border border-t-0 border-gray-300 bg-[#F5E6E0] p-3">
        <div className="bg-[#8B0000] text-white px-3 py-1 text-sm font-medium mb-3 inline-block">
          Search
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Booking From */}
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Booking From :</label>
            <select
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
              className="h-6 text-xs border border-gray-300 rounded px-1 bg-white"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={fromDay}
              onChange={(e) => setFromDay(e.target.value)}
              className="h-6 text-xs border border-gray-300 rounded px-1 bg-white"
            >
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value)}
              className="h-6 text-xs border border-gray-300 rounded px-1 bg-white"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Booking To */}
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Booking To :</label>
            <select
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
              className="h-6 text-xs border border-gray-300 rounded px-1 bg-white"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={toDay}
              onChange={(e) => setToDay(e.target.value)}
              className="h-6 text-xs border border-gray-300 rounded px-1 bg-white"
            >
              {days.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={toYear}
              onChange={(e) => setToYear(e.target.value)}
              className="h-6 text-xs border border-gray-300 rounded px-1 bg-white"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Hotel Dropdown */}
          <div className="flex items-center gap-2">
            <label className="font-medium text-gray-700">Hotel :</label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="h-6 text-xs border border-gray-300 rounded px-2 bg-white min-w-[140px]"
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
            className="h-6 px-4 text-xs bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-400"
          >
            {loading ? "..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-t-0 border-gray-300 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#D4A59A] text-gray-800">
              <th className="border border-gray-400 px-3 py-1.5 text-left font-medium w-32">Date</th>
              <th className="border border-gray-400 px-3 py-1.5 text-left font-medium">Booking Details</th>
            </tr>
          </thead>
          <tbody>
            {dateGroupedData.length === 0 ? (
              <tr className="bg-[#F5E6E0]">
                <td colSpan={2} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                  {loading ? "Loading..." : "Select date range and click Search to view room bookings"}
                </td>
              </tr>
            ) : (
              dateGroupedData.map((dateGroup, dateIdx) => (
                <>
                  {/* Date row with booking details for that date */}
                  <tr key={`date-${dateIdx}`} className="bg-[#F5E6E0] border-b border-gray-300">
                    <td className="border border-gray-300 px-3 py-2 align-top font-medium">
                      {dateGroup.date}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {/* Show all users' booking details for this date */}
                      {dateGroup.users.map((user, userIdx) => (
                        <div key={userIdx} className="mb-1">
                          {user.hotels.map((hotel, hotelIdx) => (
                            <div key={hotelIdx}>
                              <span className="font-bold">{hotel.hotelName}</span>
                              {hotel.rooms.map((room, roomIdx) => (
                                <div key={roomIdx} className="ml-0">{room.roomName}:{room.count}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ))}
                    </td>
                  </tr>
                  
                  {/* Total no. of Rooms row after date */}
                  <tr key={`total-${dateIdx}`} className="bg-white border-b border-gray-300">
                    <td className="border border-gray-300 px-3 py-2"></td>
                    <td className="border border-gray-300 px-3 py-2 font-bold">
                      Total no. of Rooms : {dateGroup.totalRooms}
                    </td>
                  </tr>

                  {/* Individual user rows */}
                  {dateGroup.users.map((user, userIdx) => (
                    <tr key={`user-${dateIdx}-${userIdx}`} className="bg-[#F5E6E0] border-b border-gray-300">
                      <td className="border border-gray-300 px-3 py-2 align-top font-medium">
                        {user.userName}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {user.hotels.map((hotel, hotelIdx) => (
                          <div key={hotelIdx} className="mb-1">
                            <span className="font-bold">{hotel.hotelName}</span>
                            {hotel.rooms.map((room, roomIdx) => (
                              <div key={roomIdx}>{room.roomName}:{room.count}</div>
                            ))}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
