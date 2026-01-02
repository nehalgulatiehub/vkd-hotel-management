import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, parse, isValid } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  total_quantity: number;
  base_price: number;
  hotel_id: string;
}

interface HotelBooking {
  id: string;
  own_hotel_id: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  number_of_rooms: number;
}

const DAYS_TO_SHOW = 15;

export default function BookingAvailability() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState(format(new Date(), "dd-MM-yyyy"));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all rooms
    const { data: roomsData } = await supabase
      .from("rooms")
      .select("id, room_number, room_type, total_quantity, base_price, hotel_id")
      .order("room_type");

    // Fetch all hotel bookings (from confirmed/completed/hold bookings only, exclude cancelled)
    const { data: bookingsData } = await supabase
      .from("hotel_bookings")
      .select(`
        id, own_hotel_id, room_type, check_in_date, check_out_date, number_of_rooms,
        bookings!inner(status)
      `)
      .not("own_hotel_id", "is", null)
      .in("bookings.status", ["confirmed", "completed", "hold"]);

    setRooms(roomsData || []);
    setHotelBookings(bookingsData || []);
    setLoading(false);
  };

  // Generate the dates to display
  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(startDate, i));

  const getBookingsForDate = (roomId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return hotelBookings.filter((booking) => {
      if (booking.room_type !== roomId) return false;
      return dateStr >= booking.check_in_date && dateStr < booking.check_out_date;
    });
  };

  const getStats = (room: Room, date: Date) => {
    const bookings = getBookingsForDate(room.id, date);
    const booked = bookings.reduce((sum, b) => sum + (b.number_of_rooms || 1), 0);
    const total = room.total_quantity || 1;
    const available = Math.max(0, total - booked);
    // For now, we don't track blocked separately - could be added later
    const blocked = 0;
    return { available, booked, blocked, total };
  };

  const handlePrevious = () => {
    setStartDate(addDays(startDate, -DAYS_TO_SHOW));
  };

  const handleNext = () => {
    setStartDate(addDays(startDate, DAYS_TO_SHOW));
  };

  const handleSearch = () => {
    const parsed = parse(searchDate, "dd-MM-yyyy", new Date());
    if (isValid(parsed)) {
      setStartDate(startOfDay(parsed));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Group rooms by room_type for display
  const groupedRooms = rooms.reduce((acc, room) => {
    const key = `${room.room_type} (${room.total_quantity})`;
    if (!acc[key]) {
      acc[key] = room;
    }
    return acc;
  }, {} as Record<string, Room>);

  const roomCategories = Object.entries(groupedRooms);

  const getCellColor = (value: number, type: "available" | "booked" | "blocked", total: number) => {
    if (type === "available") {
      if (value === 0) return "bg-red-500 text-white";
      if (value === total) return "bg-green-500 text-white";
      return "bg-yellow-500 text-white";
    }
    if (type === "booked") {
      if (value === 0) return "bg-gray-100 text-gray-600";
      if (value === total) return "bg-red-500 text-white";
      return "bg-orange-400 text-white";
    }
    if (type === "blocked") {
      if (value === 0) return "bg-gray-100 text-gray-600";
      return "bg-purple-500 text-white";
    }
    return "bg-gray-100 text-gray-600";
  };

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
      <main className="p-4">
        {/* Top Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download Inventory
            </Button>
            <Button variant="default" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Update
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Search</span>
            <Input
              type="text"
              placeholder="dd-MM-yyyy"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-32 h-8 text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleSearch}>
              Go
            </Button>
          </div>
        </div>

        {/* Availability Grid */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center">
              {/* Prev Button */}
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-full rounded-none border-r"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              {/* Table */}
              <div className="flex-1 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="min-w-[180px] sticky left-0 bg-muted z-10 font-semibold">
                        Room Category
                      </TableHead>
                      <TableHead className="w-16 text-center font-semibold">Pre</TableHead>
                      <TableHead className="w-16 text-center font-semibold">Type</TableHead>
                      {dates.map((date) => (
                        <TableHead key={date.toISOString()} className="w-12 text-center p-1">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-medium">{format(date, "EEE")}</span>
                            <span className="text-xs font-bold">{format(date, "d")}</span>
                            <span className="text-[10px] text-muted-foreground">{format(date, "MMM")}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={DAYS_TO_SHOW + 3} className="text-center py-8 text-muted-foreground">
                          No rooms configured. Add rooms to your hotels first.
                        </TableCell>
                      </TableRow>
                    ) : (
                      roomCategories.map(([categoryName, room]) => {
                        const rowTypes = ["available", "booked", "blocked"] as const;
                        return rowTypes.map((rowType, rowIdx) => (
                          <TableRow key={`${room.id}-${rowType}`} className={cn(rowIdx === 2 && "border-b-2")}>
                            {rowIdx === 0 && (
                              <TableCell
                                rowSpan={3}
                                className="font-medium sticky left-0 bg-background z-10 border-r"
                              >
                                {categoryName}
                              </TableCell>
                            )}
                            <TableCell className="text-center p-1">
                              <span className="text-xs font-medium">₹{room.base_price}</span>
                            </TableCell>
                            <TableCell className="text-center p-1">
                              <span
                                className={cn(
                                  "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded",
                                  rowType === "available" && "bg-green-100 text-green-700",
                                  rowType === "booked" && "bg-orange-100 text-orange-700",
                                  rowType === "blocked" && "bg-purple-100 text-purple-700"
                                )}
                              >
                                {rowType}
                              </span>
                            </TableCell>
                            {dates.map((date) => {
                              const stats = getStats(room, date);
                              const value = stats[rowType];
                              return (
                                <TableCell
                                  key={date.toISOString()}
                                  className={cn(
                                    "text-center p-1 min-w-[40px]",
                                    getCellColor(value, rowType, stats.total)
                                  )}
                                >
                                  <span className="text-xs font-bold">{value}</span>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ));
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Next Button */}
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-full rounded-none border-l"
                onClick={handleNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Fully Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>Partially Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Sold Out</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-orange-400" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-purple-500" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-gray-100 border" />
            <span>None</span>
          </div>
        </div>
      </main>
    </div>
  );
}
