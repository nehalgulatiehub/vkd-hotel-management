import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, parse, isValid, eachDayOfInterval } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { DateInput } from "@/components/ui/DateInput";

interface Hotel {
  id: string;
  name: string;
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
  total_quantity: number;
  base_price: number;
  hotel_id: string;
  hotel_name?: string;
}

interface HotelBooking {
  id: string;
  own_hotel_id: string;
  room_type: string;
  check_in_date: string;
  check_out_date: string;
  number_of_rooms: number;
}

interface RoomBlock {
  id: string;
  room_id: string;
  block_date: string;
  blocked_quantity: number;
  reason: string | null;
}

const DAYS_TO_SHOW = 15;

export default function BookingAvailability() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [roomBlocks, setRoomBlocks] = useState<RoomBlock[]>([]);
  const [startDate, setStartDate] = useState(startOfDay(new Date()));
  const [loading, setLoading] = useState(true);
  const [searchDate, setSearchDate] = useState(format(new Date(), "dd/MM/yyyy"));
  const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>("all");

  // Bulk Update Modal State
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [bulkFromDate, setBulkFromDate] = useState("");
  const [bulkToDate, setBulkToDate] = useState("");
  const [bulkAction, setBulkAction] = useState<"block" | "unblock">("block");
  const [bulkQuantity, setBulkQuantity] = useState("1");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all hotels
    const { data: hotelsData } = await supabase
      .from("own_hotels")
      .select("id, name")
      .order("name");

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

    // Fetch all room blocks
    const { data: blocksData } = await supabase
      .from("room_blocks")
      .select("id, room_id, block_date, blocked_quantity, reason");

    // Map hotel names to rooms
    const hotelsMap = (hotelsData || []).reduce((acc, hotel) => {
      acc[hotel.id] = hotel.name;
      return acc;
    }, {} as Record<string, string>);

    const roomsWithHotels = (roomsData || []).map((room) => ({
      ...room,
      hotel_name: hotelsMap[room.hotel_id] || "Unknown Hotel",
    }));

    setHotels(hotelsData || []);
    setRooms(roomsWithHotels);
    setHotelBookings(bookingsData || []);
    setRoomBlocks(blocksData || []);
    setLoading(false);
  };

  // Filter rooms by selected hotel
  const filteredRooms = selectedHotelFilter === "all" 
    ? rooms 
    : rooms.filter(room => room.hotel_id === selectedHotelFilter);

  // Generate the dates to display
  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, i) => addDays(startDate, i));

  const getBookingsForDate = (roomId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return hotelBookings.filter((booking) => {
      if (booking.room_type !== roomId) return false;
      return dateStr >= booking.check_in_date && dateStr < booking.check_out_date;
    });
  };

  const getBlocksForDate = (roomId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return roomBlocks.filter((block) => block.room_id === roomId && block.block_date === dateStr);
  };

  const getStats = (room: Room, date: Date) => {
    const bookings = getBookingsForDate(room.id, date);
    const blocks = getBlocksForDate(room.id, date);
    const booked = bookings.reduce((sum, b) => sum + (b.number_of_rooms || 1), 0);
    const blocked = blocks.reduce((sum, b) => sum + (b.blocked_quantity || 0), 0);
    const total = room.total_quantity || 1;
    const available = Math.max(0, total - booked - blocked);
    return { available, booked, blocked, total };
  };

  const handlePrevious = () => {
    setStartDate(addDays(startDate, -DAYS_TO_SHOW));
  };

  const handleNext = () => {
    setStartDate(addDays(startDate, DAYS_TO_SHOW));
  };

  const handleSearch = () => {
    const parsed = parse(searchDate, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) {
      setStartDate(startOfDay(parsed));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

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

  // Download Inventory as Excel
  const handleDownloadInventory = () => {
    if (rooms.length === 0) {
      toast.error("No rooms to export");
      return;
    }

    const exportData: Record<string, unknown>[] = [];

    rooms.forEach((room) => {
      const rowTypes = ["Available", "Booked", "Blocked"] as const;
      rowTypes.forEach((rowType) => {
        const row: Record<string, unknown> = {
          "Hotel Name": room.hotel_name,
          "Room Category": `${room.room_type} (${room.total_quantity})`,
          "Price": room.base_price,
          "Type": rowType,
        };

        dates.forEach((date) => {
          const stats = getStats(room, date);
          const dateKey = format(date, "dd/MM");
          if (rowType === "Available") row[dateKey] = stats.available;
          else if (rowType === "Booked") row[dateKey] = stats.booked;
          else row[dateKey] = stats.blocked;
        });

        exportData.push(row);
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Room Inventory");
    XLSX.writeFile(wb, `Room_Inventory_${format(startDate, "yyyy-MM-dd")}.xlsx`);
    toast.success("Inventory downloaded successfully");
  };

  // Bulk Update Handler
  const handleBulkUpdate = async () => {
    if (!selectedRoomId || !bulkFromDate || !bulkToDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const fromDate = parse(bulkFromDate, "yyyy-MM-dd", new Date());
    const toDate = parse(bulkToDate, "yyyy-MM-dd", new Date());

    if (!isValid(fromDate) || !isValid(toDate)) {
      toast.error("Invalid date format");
      return;
    }

    if (fromDate > toDate) {
      toast.error("From date must be before To date");
      return;
    }

    setBulkUpdating(true);

    try {
      const datesToUpdate = eachDayOfInterval({ start: fromDate, end: toDate });

      if (bulkAction === "block") {
        // Insert or update blocks for each date
        const blocksToUpsert = datesToUpdate.map((date) => ({
          room_id: selectedRoomId,
          block_date: format(date, "yyyy-MM-dd"),
          blocked_quantity: parseInt(bulkQuantity) || 1,
          reason: bulkReason || null,
        }));

        for (const block of blocksToUpsert) {
          const { error } = await supabase
            .from("room_blocks")
            .upsert(block, { onConflict: "room_id,block_date" });
          if (error) throw error;
        }

        toast.success(`Blocked ${datesToUpdate.length} dates successfully`);
      } else {
        // Delete blocks for the date range
        const dateStrings = datesToUpdate.map((date) => format(date, "yyyy-MM-dd"));

        const { error } = await supabase
          .from("room_blocks")
          .delete()
          .eq("room_id", selectedRoomId)
          .in("block_date", dateStrings);

        if (error) throw error;
        toast.success(`Unblocked ${datesToUpdate.length} dates successfully`);
      }

      // Refresh data
      await fetchData();
      setBulkUpdateOpen(false);
      resetBulkForm();
    } catch (error) {
      console.error("Bulk update error:", error);
      toast.error("Failed to update. Please try again.");
    } finally {
      setBulkUpdating(false);
    }
  };

  const resetBulkForm = () => {
    setSelectedRoomId("");
    setBulkFromDate("");
    setBulkToDate("");
    setBulkAction("block");
    setBulkQuantity("1");
    setBulkReason("");
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
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadInventory}>
              <Download className="h-4 w-4" />
              Download Inventory
            </Button>
            <Button variant="default" size="sm" className="gap-2" onClick={() => setBulkUpdateOpen(true)}>
              <Upload className="h-4 w-4" />
              Bulk Update
            </Button>
          </div>
          <div className="flex items-center gap-4">
            {/* Hotel Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hotel</span>
              <Select value={selectedHotelFilter} onValueChange={setSelectedHotelFilter}>
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue placeholder="All Hotels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hotels</SelectItem>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Date Search */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search</span>
              <Input
                type="text"
                placeholder="dd/MM/yyyy"
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
                      <TableHead className="min-w-[120px] sticky left-0 bg-muted z-10 font-semibold">
                        Hotel
                      </TableHead>
                      <TableHead className="min-w-[150px] font-semibold">
                        Room Category
                      </TableHead>
                      <TableHead className="w-16 text-center font-semibold">Price</TableHead>
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
                    {filteredRooms.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={DAYS_TO_SHOW + 4} className="text-center py-8 text-muted-foreground">
                          {rooms.length === 0 
                            ? "No rooms configured. Add rooms to your hotels first."
                            : "No rooms found for the selected hotel."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRooms.map((room) => {
                        const rowTypes = ["available", "booked", "blocked"] as const;
                        return rowTypes.map((rowType, rowIdx) => (
                          <TableRow key={`${room.id}-${rowType}`} className={cn(rowIdx === 2 && "border-b-2")}>
                            {rowIdx === 0 && (
                              <>
                                <TableCell
                                  rowSpan={3}
                                  className="font-medium sticky left-0 bg-background z-10 border-r text-xs"
                                >
                                  {room.hotel_name}
                                </TableCell>
                                <TableCell
                                  rowSpan={3}
                                  className="font-medium border-r text-xs"
                                >
                                  {room.room_type} ({room.total_quantity})
                                </TableCell>
                              </>
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

      {/* Bulk Update Dialog */}
      <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Update Room Availability</DialogTitle>
            <DialogDescription>
              Block or unblock rooms for a date range
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Room Category</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.hotel_name} - {room.room_type} ({room.total_quantity} rooms)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <DateInput
                  value={bulkFromDate}
                  onChange={(e) => setBulkFromDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <DateInput
                  value={bulkToDate}
                  onChange={(e) => setBulkToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={bulkAction} onValueChange={(v) => setBulkAction(v as "block" | "unblock")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block">Block Rooms</SelectItem>
                  <SelectItem value="unblock">Unblock Rooms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkAction === "block" && (
              <>
                <div className="space-y-2">
                  <Label>Quantity to Block</Label>
                  <Input
                    type="number"
                    min="1"
                    value={bulkQuantity}
                    onChange={(e) => setBulkQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Textarea
                    placeholder="Enter reason for blocking..."
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUpdateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate} disabled={bulkUpdating}>
              {bulkUpdating ? "Updating..." : bulkAction === "block" ? "Block Rooms" : "Unblock Rooms"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
