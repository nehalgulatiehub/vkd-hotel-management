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
  totalRooms: number;
}

interface DateBooking {
  date: string;
  hotels: HotelBookingData[];
}

interface UserBooking {
  userName: string;
  hotels: HotelBookingData[];
  totalRooms: number;
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
  const [dateBookings, setDateBookings] = useState<DateBooking[]>([]);
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
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

      // Group by DATE
      const dateMap: Record<string, Record<string, Record<string, number>>> = {};
      // Group by USER (across all dates)
      const userMap: Record<string, Record<string, Record<string, number>>> = {};

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

        // Group by date -> hotel -> room
        if (!dateMap[checkInDate]) {
          dateMap[checkInDate] = {};
        }
        if (!dateMap[checkInDate][hotelName]) {
          dateMap[checkInDate][hotelName] = {};
        }
        dateMap[checkInDate][hotelName][roomName] = 
          (dateMap[checkInDate][hotelName][roomName] || 0) + roomCount;

        // Group by user -> hotel -> room (aggregate across all dates)
        if (!userMap[userName]) {
          userMap[userName] = {};
        }
        if (!userMap[userName][hotelName]) {
          userMap[userName][hotelName] = {};
        }
        userMap[userName][hotelName][roomName] = 
          (userMap[userName][hotelName][roomName] || 0) + roomCount;
      });

      // Convert DATE map to array with all room types shown
      const relevantHotels = selectedHotel 
        ? hotels.filter(h => h.id === selectedHotel)
        : hotels;

      const dateResults: DateBooking[] = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateStr, hotelData]) => {
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
          }).filter(h => h.rooms.length > 0);

          return {
            date: dateStr,
            hotels: hotelsArray
          };
        });

      // Convert USER map to array with all room types shown
      const userResults: UserBooking[] = Object.entries(userMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([userName, hotelData]) => {
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
          }).filter(h => h.totalRooms > 0); // Only show hotels with actual bookings for users

          const userTotalRooms = hotelsArray.reduce((sum, h) => sum + h.totalRooms, 0);

          return {
            userName,
            hotels: hotelsArray,
            totalRooms: userTotalRooms
          };
        }).filter(u => u.totalRooms > 0);

      // Calculate grand total from date bookings
      const total = dateResults.reduce((sum, d) => 
        sum + d.hotels.reduce((hSum, h) => hSum + h.totalRooms, 0), 0
      );

      setGrandTotal(total);
      setDateBookings(dateResults);
      setUserBookings(userResults);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  }

  if (!canManage) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;
  }

  return (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>📋 View Room Booking</div>

      {/* Maroon header */}
      <div style={{ backgroundColor: "#b44a50", color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: "bold" }}>
        <span>Search</span>
      </div>

      {/* Search Filter Section */}
      <div style={{ border: "1px solid #ccc", borderTop: "none", padding: "8px 10px", backgroundColor: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 11 }}>Booking From :</label>
          <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} style={{ border: "1px solid #999", padding: "2px 4px", fontSize: 11 }}>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={fromDay} onChange={(e) => setFromDay(e.target.value)} style={{ border: "1px solid #999", padding: "2px 4px", fontSize: 11 }}>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} style={{ border: "1px solid #999", padding: "2px 4px", fontSize: 11 }}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <label style={{ fontSize: 11, marginLeft: 16 }}>Booking To :</label>
          <select value={toMonth} onChange={(e) => setToMonth(e.target.value)} style={{ border: "1px solid #999", padding: "2px 4px", fontSize: 11 }}>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={toDay} onChange={(e) => setToDay(e.target.value)} style={{ border: "1px solid #999", padding: "2px 4px", fontSize: 11 }}>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={toYear} onChange={(e) => setToYear(e.target.value)} style={{ border: "1px solid #999", padding: "2px 4px", fontSize: 11 }}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          <label style={{ fontSize: 11, marginLeft: 16 }}>Hotel :</label>
          <select value={selectedHotel} onChange={(e) => setSelectedHotel(e.target.value)} style={{ border: "1px solid #999", padding: "2px 4px", fontSize: 11, minWidth: 140 }}>
            <option value="">Select Hotel</option>
            {hotels.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
          </select>

          <button onClick={handleSearch} disabled={loading} style={{ border: "1px solid #888", padding: "2px 12px", fontSize: 11, backgroundColor: "#f5f5f5", cursor: "pointer", marginLeft: 8 }}>
            {loading ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Date Bookings Table */}
      <div style={{ border: "1px solid #ccc", borderTop: "none", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
          <tbody>
            {dateBookings.length === 0 ? (
              <tr style={{ backgroundColor: "#f6f0f0" }}>
                <td colSpan={2} style={{ border: "1px solid #ddd", padding: "20px 8px", textAlign: "center", color: "#999", fontSize: 11 }}>
                  {loading ? "Loading..." : "Select date range and click Search to view room bookings"}
                </td>
              </tr>
            ) : (
              <>
                {dateBookings.map((dateBooking, dateIdx) => (
                  <tr key={`date-${dateIdx}`} style={{ backgroundColor: dateIdx % 2 === 0 ? "#fff" : "#f6f0f0" }}>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", verticalAlign: "top", fontWeight: 500, width: 120, fontSize: 11, color: "#606060" }}>
                      {dateBooking.date}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, color: "#606060" }}>
                      {dateBooking.hotels.map((hotel, hotelIdx) => (
                        <div key={hotelIdx} style={{ marginBottom: 6 }}>
                          <div style={{ fontWeight: "bold" }}>{hotel.hotelName}</div>
                          {hotel.rooms.map((room, roomIdx) => (
                            <div key={roomIdx}>{room.roomName}:{room.count}</div>
                          ))}
                          <div>Rooms:{hotel.totalRooms}</div>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}

                <tr style={{ backgroundColor: "#fff" }}>
                  <td colSpan={2} style={{ border: "1px solid #ddd", padding: "5px 8px", fontWeight: "bold", fontSize: 12 }}>
                    Total no. of Rooms : {grandTotal}
                  </td>
                </tr>

                {userBookings.map((userBooking, userIdx) => (
                  <tr key={`user-${userIdx}`} style={{ backgroundColor: userIdx % 2 === 0 ? "#f6f0f0" : "#fff" }}>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", verticalAlign: "top", fontWeight: 500, width: 120, fontSize: 11, color: "#606060" }}>
                      {userBooking.userName}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "5px 8px", fontSize: 11, color: "#606060" }}>
                      {userBooking.hotels.map((hotel, hotelIdx) => (
                        <div key={hotelIdx} style={{ marginBottom: 6 }}>
                          <div style={{ fontWeight: "bold" }}>{hotel.hotelName}</div>
                          {hotel.rooms.map((room, roomIdx) => (
                            <div key={roomIdx}>{room.roomName}:{room.count}</div>
                          ))}
                          <div>Rooms:{hotel.totalRooms}</div>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
