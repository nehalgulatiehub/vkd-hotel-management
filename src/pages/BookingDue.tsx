import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";

export default function BookingDue() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [ownHotels, setOwnHotels] = useState<any[]>([]);
  const [filterRooms, setFilterRooms] = useState<any[]>([]);
  
  // Dialog states
  const [showViewDetailDialog, setShowViewDetailDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [viewDetailHotelInfo, setViewDetailHotelInfo] = useState<{
    hotelName: string;
    roomName: string;
    numberOfRooms: number;
    notes: string;
    checkIn: string;
    checkOut: string;
    totalAmount: number;
  } | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    fromMonth: "",
    fromDay: "",
    fromYear: "",
    toMonth: "",
    toDay: "",
    toYear: "",
    type: "",
    agentName: "",
    hotel: "",
    room: "",
    package: "",
    customer: "",
    reference: "",
    user: "",
    chequeNo: "",
    searchWithDate: false
  });

  const paymentDialog = usePaymentDialog(() => fetchBookingsWithDue());

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  useEffect(() => {
    fetchBookingsWithDue();
    fetchAgents();
    fetchOwnHotels();
  }, []);

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("*").order("name");
    setAgents(data || []);
  };

  const fetchOwnHotels = async () => {
    const { data } = await supabase.from("own_hotels").select("*").order("name");
    setOwnHotels(data || []);
  };

  const fetchFilterRoomsForHotel = async (hotelId: string) => {
    if (!hotelId) {
      setFilterRooms([]);
      return;
    }
    const { data } = await supabase.from("rooms").select("*").eq("hotel_id", hotelId).order("room_number");
    setFilterRooms(data || []);
  };

  const fetchBookingsWithDue = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, agents(name)")
      .gt("due_amount", 0)
      .neq("status", "cancelled")
      .order("due_amount", { ascending: false });

    if (error) {
      toast.error("Failed to load bookings with due amount");
    } else {
      // Fetch hotel bookings to show hotel and room names
      const bookingIds = (data || []).map(b => b.id);
      if (bookingIds.length > 0) {
        const { data: hotelData } = await supabase
          .from("hotel_bookings")
          .select("*, own_hotels(name), another_hotels(name)")
          .in("booking_id", bookingIds);
        
        // Get room names for UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const roomIds = [...new Set((hotelData || []).map((hb: any) => hb.room_type).filter((rt: any) => rt && uuidRegex.test(rt)))];
        let roomsMap: Record<string, string> = {};
        
        if (roomIds.length > 0) {
          const { data: roomsData } = await supabase.from("rooms").select("id, room_type, room_number").in("id", roomIds);
          roomsMap = (roomsData || []).reduce((acc: Record<string, string>, r: any) => ({ ...acc, [r.id]: r.room_type || r.room_number }), {});
        }
        
        // Map hotel bookings to their booking_id with resolved room names
        const hotelBookingsMap: Record<string, any> = {};
        hotelData?.forEach((hb: any) => {
          const isUuid = hb.room_type && uuidRegex.test(hb.room_type);
          hotelBookingsMap[hb.booking_id] = {
            hotel_id: hb.own_hotel_id || hb.hotel_id,
            room_id: isUuid ? hb.room_type : null,
            hotel_name: hb.own_hotels?.name || hb.another_hotels?.name || null,
            room_type: isUuid ? (roomsMap[hb.room_type] || hb.room_type) : hb.room_type,
            number_of_rooms: hb.number_of_rooms,
            notes: hb.notes
          };
        });
        
        // Attach hotel info to bookings
        const bookingsWithHotelInfo = (data || []).map(b => ({
          ...b,
          hotel_info: hotelBookingsMap[b.id] || null
        }));
        setBookings(bookingsWithHotelInfo);
      } else {
        setBookings(data || []);
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    // Type filter
    const matchesType = !filters.type || booking.booking_type === filters.type;
    
    // Agent filter
    const matchesAgent = !filters.agentName || booking.agent_id === filters.agentName;
    
    // Customer filter
    const matchesCustomer = !filters.customer || 
      booking.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());
    
    // Reference filter
    const matchesReference = !filters.reference || 
      booking.reference?.toLowerCase().includes(filters.reference.toLowerCase());
    
    // Cheque No filter
    const matchesCheque = !filters.chequeNo || 
      booking.cheque_no?.toLowerCase().includes(filters.chequeNo.toLowerCase());
    
    // Hotel filter
    const matchesHotel = !filters.hotel || booking.hotel_info?.hotel_id === filters.hotel;
    
    // Room filter
    const matchesRoom = !filters.room || booking.hotel_info?.room_id === filters.room;
    
    // Date filter
    let matchesDate = true;
    if (filters.searchWithDate && filters.fromYear && filters.fromMonth && filters.fromDay) {
      const fromDate = new Date(`${filters.fromYear}-${filters.fromMonth.padStart(2, '0')}-${filters.fromDay.padStart(2, '0')}`);
      const bookingDate = new Date(booking.check_in_date);
      matchesDate = bookingDate >= fromDate;
      
      if (filters.toYear && filters.toMonth && filters.toDay) {
        const toDate = new Date(`${filters.toYear}-${filters.toMonth.padStart(2, '0')}-${filters.toDay.padStart(2, '0')}`);
        matchesDate = matchesDate && bookingDate <= toDate;
      }
    }
    
    return matchesType && matchesAgent && matchesCustomer && 
           matchesReference && matchesCheque && matchesDate && matchesHotel && matchesRoom;
  });

  const totalDue = filteredBookings.reduce((sum, booking) => sum + (booking.due_amount || 0), 0);
  const totalAmount = filteredBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  const totalPaid = filteredBookings.reduce((sum, booking) => sum + (booking.paid_amount || 0), 0);

  const handleViewDetails = async (booking: any) => {
    setSelectedBooking(booking);
    setViewDetailHotelInfo(null);
    setShowViewDetailDialog(true);
    
    // Fetch hotel booking details
    const { data: hotelData } = await supabase
      .from("hotel_bookings")
      .select("*, own_hotels(name), another_hotels(name)")
      .eq("booking_id", booking.id)
      .maybeSingle();
    
    if (hotelData) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let roomName = hotelData.room_type || "-";
      
      // Resolve room UUID to name
      if (hotelData.room_type && uuidRegex.test(hotelData.room_type)) {
        const { data: roomData } = await supabase
          .from("rooms")
          .select("room_type, room_number")
          .eq("id", hotelData.room_type)
          .maybeSingle();
        if (roomData) {
          roomName = roomData.room_type || roomData.room_number || "-";
        }
      }
      
      setViewDetailHotelInfo({
        hotelName: hotelData.own_hotels?.name || hotelData.another_hotels?.name || "-",
        roomName,
        numberOfRooms: hotelData.number_of_rooms || 1,
        notes: hotelData.notes || "",
        checkIn: hotelData.check_in_date || "",
        checkOut: hotelData.check_out_date || "",
        totalAmount: hotelData.total_amount || 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Due Amount Booking" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">Due Amount Booking</span>
          <Button 
            variant="link" 
            className="text-white p-0 h-auto text-sm hover:text-white/80"
            onClick={() => navigate("/bookings")}
          >
            View All Records
          </Button>
        </div>

        {/* Compact Filter Section */}
        <div className="mb-3 border border-border bg-muted/50">
          {/* Row 1: Dates and Search with Date */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">From :</span>
              <select 
                value={filters.fromMonth} 
                onChange={(e) => setFilters({...filters, fromMonth: e.target.value})}
                className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
              >
                <option value="">Jan</option>
                {months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}
              </select>
              <select 
                value={filters.fromDay} 
                onChange={(e) => setFilters({...filters, fromDay: e.target.value})}
                className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
              >
                <option value="">1</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="2026" 
                value={filters.fromYear} 
                onChange={(e) => setFilters({...filters, fromYear: e.target.value})} 
                className="h-5 w-12 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">To :</span>
              <select 
                value={filters.toMonth} 
                onChange={(e) => setFilters({...filters, toMonth: e.target.value})}
                className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
              >
                <option value="">Jan</option>
                {months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}
              </select>
              <select 
                value={filters.toDay} 
                onChange={(e) => setFilters({...filters, toDay: e.target.value})}
                className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
              >
                <option value="">1</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input 
                type="text" 
                placeholder="2026" 
                value={filters.toYear} 
                onChange={(e) => setFilters({...filters, toYear: e.target.value})} 
                className="h-5 w-12 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Search with Date :</span>
              <label className="flex items-center gap-0.5 text-[11px]">
                <input type="radio" name="searchWithDate" checked={filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: true})} className="w-3 h-3" />
                YES
              </label>
              <label className="flex items-center gap-0.5 text-[11px]">
                <input type="radio" name="searchWithDate" checked={!filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: false})} className="w-3 h-3" />
                NO
              </label>
            </div>
          </div>

          {/* Row 2: Type, Agent, Reference, User */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Type :</span>
              <select 
                value={filters.type} 
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
              >
                <option value="">--Select--</option>
                <option value="agent">Agent</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Agent Name :</span>
              <select 
                value={filters.agentName} 
                onChange={(e) => setFilters({...filters, agentName: e.target.value})}
                className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm"
              >
                <option value="">--Select--</option>
                {agents.map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Reference :</span>
              <input 
                value={filters.reference} 
                onChange={(e) => setFilters({...filters, reference: e.target.value})} 
                className="h-5 w-24 text-[11px] border border-input bg-background px-1 rounded-sm" 
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">User :</span>
              <select 
                value={filters.user} 
                onChange={(e) => setFilters({...filters, user: e.target.value})}
                className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm"
              >
                <option value="">--Select--</option>
                <option value="all">All Users</option>
              </select>
            </div>
          </div>

          {/* Row 3: Hotel, Room, Package, Customer, Cheque, Search */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Hotel :</span>
                <select 
                  value={filters.hotel} 
                  onChange={(e) => {
                    setFilters({...filters, hotel: e.target.value, room: ""});
                    fetchFilterRoomsForHotel(e.target.value);
                  }}
                  className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm"
                >
                  <option value="">--Select--</option>
                  {ownHotels.map(hotel => (<option key={hotel.id} value={hotel.id}>{hotel.name}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Room :</span>
                <select 
                  value={filters.room} 
                  onChange={(e) => setFilters({...filters, room: e.target.value})}
                  disabled={!filters.hotel}
                  className="h-5 text-[11px] border border-input bg-background px-1 min-w-[100px] disabled:bg-muted rounded-sm"
                >
                  <option value="">{filters.hotel ? "--Select--" : "Select hotel"}</option>
                  {filterRooms.map(room => (<option key={room.id} value={room.id}>{room.room_type || room.room_number}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Package :</span>
                <select 
                  value={filters.package} 
                  onChange={(e) => setFilters({...filters, package: e.target.value})}
                  className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm"
                >
                  <option value="">--Select--</option>
                  <option value="all">All Packages</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Customer :</span>
                <input 
                  value={filters.customer} 
                  onChange={(e) => setFilters({...filters, customer: e.target.value})} 
                  className="h-5 w-28 text-[11px] border border-input bg-background px-1 rounded-sm" 
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Cheque No. :</span>
                <input 
                  value={filters.chequeNo} 
                  onChange={(e) => setFilters({...filters, chequeNo: e.target.value})} 
                  className="h-5 w-24 text-[11px] border border-input bg-background px-1 rounded-sm" 
                />
              </div>
            </div>
            <button className="h-6 px-4 text-[11px] bg-primary text-primary-foreground border border-primary/80 hover:bg-primary/90 rounded-sm">Search</button>
          </div>
        </div>

        {/* Main Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">S.No.</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Type</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">User</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer Details</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Package Details</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Booking Price</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                        No bookings with due amount found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking, index) => (
                      <tr key={booking.id} style={{ backgroundColor: "#F5E6E0" }}>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">{index + 1}</td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="capitalize">{booking.booking_type}</div>
                          <div className="text-muted-foreground">
                            {booking.agents?.name || "Direct"}
                          </div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          company
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="font-medium">{booking.customer_name || "-"}</div>
                          <div className="text-muted-foreground">Contact No.: {booking.contact_no || "-"}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="space-y-0.5">
                            {booking.hotel_info && (
                              <>
                                <div><strong>Hotel :</strong> {booking.hotel_info.hotel_name || "-"}</div>
                                <div><strong>Room :</strong> {booking.hotel_info.room_type || "-"}</div>
                                {booking.hotel_info.number_of_rooms && <div>{booking.hotel_info.number_of_rooms} rooms {booking.hotel_info.notes || ""}</div>}
                              </>
                            )}
                            {!booking.hotel_info && booking.include_booking && <div>✓ Hotel Booking</div>}
                            {booking.include_delhi_manali && <div>✓ Delhi-Manali</div>}
                            {booking.include_manali_delhi && <div>✓ Manali-Delhi</div>}
                            {booking.include_safari && <div>✓ Safari</div>}
                            {booking.include_another_hotel && <div>✓ Another Hotel</div>}
                            {booking.include_additional_vehicle && <div>✓ Add. Vehicle</div>}
                          </div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="space-y-0.5">
                            <div><strong>Booking Price:</strong> Rs. {booking.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                            <div><strong>Total Received Payment:</strong> Rs. {booking.paid_amount?.toLocaleString("en-IN") || 0}/-</div>
                            <div className="text-destructive"><strong>Due Payment:</strong> Rs. {booking.due_amount?.toLocaleString("en-IN") || 0}/-</div>
                          </div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="space-y-0.5">
                            <div><strong>Date:</strong> {booking.created_at ? new Date(booking.created_at).toLocaleDateString("en-GB") : "-"}</div>
                            <div><strong>Booking From:</strong> {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("en-GB") : "-"}</div>
                            <div><strong>Booking to:</strong> {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString("en-GB") : "-"}</div>
                          </div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="h-auto p-0 text-[11px] text-primary justify-start"
                              onClick={() => handleViewDetails(booking)}
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="h-auto p-0 text-[11px] text-primary justify-start"
                              onClick={() => window.print()}
                            >
                              Print Booking
                            </Button>
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="h-auto p-0 text-[11px] text-primary justify-start"
                              onClick={() => navigate(`/bookings?edit=${booking.id}`)}
                            >
                              Edit Booking
                            </Button>
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="h-auto p-0 text-[11px] text-primary justify-start"
                              onClick={() => paymentDialog.handleAddPayment(booking)}
                            >
                              Add Payment
                            </Button>
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="h-auto p-0 text-[11px] text-primary justify-start"
                              onClick={() => paymentDialog.handleViewPayment(booking)}
                            >
                              View Payment
                            </Button>
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="h-auto p-0 text-[11px] text-primary justify-start"
                              onClick={() => navigate(`/refunds?booking_id=${booking.id}`)}
                            >
                              Refund Payment
                            </Button>
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="h-auto p-0 text-[11px] text-primary justify-start"
                              onClick={() => navigate(`/refunds?booking_id=${booking.id}&view=true`)}
                            >
                              View Refund Payment
                            </Button>
                            <Button 
                              size="sm" 
                              variant="link" 
                              className="h-auto p-0 text-[11px] text-primary justify-start"
                              onClick={() => toast.info("Cancel booking feature coming soon")}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="flex justify-end gap-6 p-4 border-t" style={{ backgroundColor: "#FDE1E1", borderColor: "#FFC1C1" }}>
              <div className="text-xs">
                <span className="font-semibold">Total Booking Price:</span> ₹{totalAmount.toLocaleString("en-IN")}
              </div>
              <div className="text-xs">
                <span className="font-semibold">Total Received Payment:</span> ₹{totalPaid.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-destructive">
                <span className="font-semibold">Total Due Payment:</span> ₹{totalDue.toLocaleString("en-IN")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={showViewDetailDialog} onOpenChange={setShowViewDetailDialog}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <DialogTitle className="text-white text-sm font-semibold">Booking Details</DialogTitle>
            </div>
            {selectedBooking && (
              <div className="p-4" style={{ backgroundColor: "#FDE1E1" }}>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold w-32">Booking Type</td>
                      <td className="py-1.5 capitalize">{selectedBooking.booking_type}</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">Reference</td>
                      <td className="py-1.5">{selectedBooking.reference || "-"}</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">Customer Name</td>
                      <td className="py-1.5">{selectedBooking.customer_name || "-"}</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">No. of People</td>
                      <td className="py-1.5">{selectedBooking.adults || 0} Adults, {selectedBooking.children || 0} Children</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">Hotel</td>
                      <td className="py-1.5">{viewDetailHotelInfo?.hotelName || "-"}</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">Room</td>
                      <td className="py-1.5">{viewDetailHotelInfo?.roomName || "-"}</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">No. of Rooms</td>
                      <td className="py-1.5">{viewDetailHotelInfo?.numberOfRooms || "-"}</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">Package (Notes)</td>
                      <td className="py-1.5">{viewDetailHotelInfo?.notes || "-"}</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">Price</td>
                      <td className="py-1.5">₹{selectedBooking.total_amount?.toLocaleString("en-IN") || 0}</td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 font-semibold">From - To</td>
                      <td className="py-1.5">
                        {selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString("en-GB") : "-"} - {selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString("en-GB") : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-semibold">Created Date</td>
                      <td className="py-1.5">{selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleDateString("en-GB") : "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <span className="text-white text-xs">Booking Reference: {selectedBooking?.booking_number}</span>
            </div>
          </DialogContent>
        </Dialog>

        <PaymentDialogs
          showViewPaymentDialog={paymentDialog.showViewPaymentDialog}
          setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog}
          showPaymentDialog={paymentDialog.showPaymentDialog}
          setShowPaymentDialog={paymentDialog.setShowPaymentDialog}
          selectedBooking={paymentDialog.selectedBooking}
          bookingPayments={paymentDialog.bookingPayments}
          paymentAmount={paymentDialog.paymentAmount}
          setPaymentAmount={paymentDialog.setPaymentAmount}
          paymentMode={paymentDialog.paymentMode}
          setPaymentMode={paymentDialog.setPaymentMode}
          paymentReference={paymentDialog.paymentReference}
          setPaymentReference={paymentDialog.setPaymentReference}
          isSubmittingPayment={paymentDialog.isSubmittingPayment}
          onSubmitPayment={paymentDialog.submitPayment}
        />
      </main>
    </div>
  );
}
