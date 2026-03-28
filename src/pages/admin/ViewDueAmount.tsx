import { useState, useEffect } from "react";
import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle, filterInputStyle } from "@/components/admin/AdminPageShell";

export default function ViewDueAmount() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const { profiles, getUserName } = useProfilesMap();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [ownHotels, setOwnHotels] = useState<any[]>([]);
  const [filterRooms, setFilterRooms] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    fromMonth: "", fromDay: "", fromYear: "",
    toMonth: "", toDay: "", toYear: "",
    type: "", agentName: "", hotel: "", room: "",
    package: "", customer: "", reference: "", user: "",
    searchWithDate: false
  });

  const paymentDialog = usePaymentDialog(() => fetchBookingsWithDue());

  const [showViewDetailDialog, setShowViewDetailDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [viewDetailOwnHotelInfo, setViewDetailOwnHotelInfo] = useState<any[]>([]);
  const [viewDetailAnotherHotelInfo, setViewDetailAnotherHotelInfo] = useState<any[]>([]);
  const [viewDetailSafariInfo, setViewDetailSafariInfo] = useState<any[]>([]);
  const [viewDetailVehicleInfo, setViewDetailVehicleInfo] = useState<any[]>([]);
  const [viewDetailVolvoDMInfo, setViewDetailVolvoDMInfo] = useState<any[]>([]);
  const [viewDetailVolvoMDInfo, setViewDetailVolvoMDInfo] = useState<any[]>([]);

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchBookingsWithDue();
      fetchAgents();
      fetchOwnHotels();
    }
  }, [authLoading]);

  const fetchAgents = async () => { const { data } = await supabase.from("agents").select("*").order("name"); setAgents(data || []); };
  const fetchOwnHotels = async () => { const { data } = await supabase.from("own_hotels").select("*").order("name"); setOwnHotels(data || []); };
  const fetchFilterRoomsForHotel = async (hotelId: string) => {
    if (!hotelId) { setFilterRooms([]); return; }
    const { data } = await supabase.from("rooms").select("*").eq("hotel_id", hotelId).order("room_number");
    setFilterRooms(data || []);
  };

  const fetchBookingsWithDue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("bookings").select("*, agents(name)").gt("due_amount", 0).neq("status", "cancelled").order("created_at", { ascending: false });
      if (error) throw error;
      const bookingIds = (data || []).map(b => b.id);
      if (bookingIds.length > 0) {
        const { data: hotelData } = await supabase.from("hotel_bookings").select("*, own_hotels(name), another_hotels(name)").in("booking_id", bookingIds);
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const roomIds = [...new Set((hotelData || []).map((hb: any) => hb.room_type).filter((rt: any) => rt && uuidRegex.test(rt)))];
        let roomsMap: Record<string, string> = {};
        if (roomIds.length > 0) {
          const { data: roomsData } = await supabase.from("rooms").select("id, room_type, room_number").in("id", roomIds);
          roomsMap = (roomsData || []).reduce((acc: Record<string, string>, r: any) => ({ ...acc, [r.id]: r.room_type || r.room_number }), {});
        }
        const hotelBookingsMap: Record<string, any> = {};
        hotelData?.forEach((hb: any) => {
          const isUuid = hb.room_type && uuidRegex.test(hb.room_type);
          hotelBookingsMap[hb.booking_id] = { hotel_id: hb.own_hotel_id || hb.hotel_id, room_id: isUuid ? hb.room_type : null, hotel_name: hb.own_hotels?.name || hb.another_hotels?.name || null, room_type: isUuid ? (roomsMap[hb.room_type] || hb.room_type) : hb.room_type, number_of_rooms: hb.number_of_rooms, notes: hb.notes };
        });
        setBookings((data || []).map(b => ({ ...b, hotel_info: hotelBookingsMap[b.id] || null })));
      } else { setBookings(data || []); }
    } catch (error) { console.error("Error fetching bookings with due:", error); }
    finally { setLoading(false); }
  };

  const handleViewDetails = async (booking: any) => {
    setSelectedBooking(booking); setViewDetailOwnHotelInfo([]); setViewDetailAnotherHotelInfo([]); setViewDetailSafariInfo([]); setViewDetailVehicleInfo([]); setViewDetailVolvoDMInfo([]); setViewDetailVolvoMDInfo([]); setShowViewDetailDialog(true);
    const [hotelRes, safariRes, vehicleRes, volvoDMRes, volvoMDRes] = await Promise.all([
      supabase.from("hotel_bookings").select("*, own_hotels(name), another_hotels(name, cities(name))").eq("booking_id", booking.id),
      supabase.from("safari_bookings").select("*").eq("booking_id", booking.id),
      supabase.from("vehicle_bookings").select("*").eq("booking_id", booking.id),
      supabase.from("volvo_bookings").select("*").eq("booking_id", booking.id).eq("route", "delhi_manali"),
      supabase.from("volvo_bookings").select("*").eq("booking_id", booking.id).eq("route", "manali_delhi")
    ]);
    if (hotelRes.data && hotelRes.data.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const roomIds = [...new Set(hotelRes.data.map((hb: any) => hb.room_type).filter((rt: any) => rt && uuidRegex.test(rt)))];
      let roomsMap: Record<string, string> = {};
      if (roomIds.length > 0) { const { data: roomsData } = await supabase.from("rooms").select("id, room_type, room_number").in("id", roomIds); roomsMap = (roomsData || []).reduce((acc: Record<string, string>, r: any) => ({ ...acc, [r.id]: r.room_type || r.room_number }), {}); }
      setViewDetailOwnHotelInfo(hotelRes.data.filter((hb: any) => hb.own_hotel_id && hb.own_hotels?.name).map((hb: any) => ({ hotelName: hb.own_hotels?.name || "-", roomName: hb.room_type && uuidRegex.test(hb.room_type) ? (roomsMap[hb.room_type] || hb.room_type) : (hb.room_type || "-"), numberOfRooms: hb.number_of_rooms || 1, notes: hb.notes || "", checkIn: hb.check_in_date || "", checkOut: hb.check_out_date || "", totalAmount: hb.total_amount || 0, roomRate: hb.room_rate || 0, createdAt: booking.created_at })));
      setViewDetailAnotherHotelInfo(hotelRes.data.filter((hb: any) => hb.hotel_id && hb.another_hotels?.name).map((hb: any) => ({ hotelName: hb.another_hotels?.name || "-", roomName: hb.room_type && uuidRegex.test(hb.room_type) ? (roomsMap[hb.room_type] || hb.room_type) : (hb.room_type || "-"), numberOfRooms: hb.number_of_rooms || 1, notes: hb.notes || "", checkIn: hb.check_in_date || "", checkOut: hb.check_out_date || "", totalAmount: hb.total_amount || 0, roomRate: hb.room_rate || 0, createdAt: booking.created_at })));
    }
    if (safariRes.data) setViewDetailSafariInfo(safariRes.data.map((sb: any) => ({ transporter: sb.transporters?.name || "-", safariDate: sb.safari_date, numberOfPersons: sb.number_of_persons || 0, ratePerPerson: sb.rate_per_person || 0, totalAmount: sb.total_amount || 0, createdAt: booking.created_at })));
    if (vehicleRes.data) setViewDetailVehicleInfo(vehicleRes.data.map((vb: any) => ({ vehicleType: vb.vehicle_type || "-", transporter: vb.transporters?.name || "-", pickupDate: vb.pickup_date, rate: vb.rate || 0, totalAmount: vb.total_amount || 0, createdAt: booking.created_at })));
    if (volvoDMRes.data) setViewDetailVolvoDMInfo(volvoDMRes.data.map((vb: any) => ({ numberOfSeats: vb.number_of_seats || 0, ticketNumber: vb.ticket_number || "-", seatNumbers: vb.seat_numbers || "-", transporter: vb.transporters?.name || "-", travelDate: vb.travel_date, ratePerSeat: vb.rate_per_seat || 0, totalAmount: vb.total_amount || 0, createdAt: booking.created_at })));
    if (volvoMDRes.data) setViewDetailVolvoMDInfo(volvoMDRes.data.map((vb: any) => ({ numberOfSeats: vb.number_of_seats || 0, ticketNumber: vb.ticket_number || "-", seatNumbers: vb.seat_numbers || "-", transporter: vb.transporters?.name || "-", travelDate: vb.travel_date, ratePerSeat: vb.rate_per_seat || 0, totalAmount: vb.total_amount || 0, createdAt: booking.created_at })));
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesType = !filters.type || booking.booking_type === filters.type;
    const matchesAgent = !filters.agentName || booking.agent_id === filters.agentName;
    const matchesCustomer = !filters.customer || booking.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());
    const matchesReference = !filters.reference || booking.reference?.toLowerCase().includes(filters.reference.toLowerCase());
    const matchesHotel = !filters.hotel || booking.hotel_info?.hotel_id === filters.hotel;
    const matchesRoom = !filters.room || booking.hotel_info?.room_id === filters.room;
    const matchesUser = !filters.user || booking.created_by === filters.user;
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
    return matchesType && matchesAgent && matchesCustomer && matchesReference && matchesDate && matchesHotel && matchesRoom && matchesUser;
  });

  const totalAmount = filteredBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const totalPaid = filteredBookings.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
  const totalDue = filteredBookings.reduce((sum, b) => sum + (b.due_amount || 0), 0);

  if (authLoading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  if (!isAdmin()) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Admin access required.</div>;

  const fs: React.CSSProperties = { border: "1px solid #999", padding: "2px 4px", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" };

  const filterSection = (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, borderBottom: "1px solid #ccc", padding: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>From :</span>
          <select value={filters.fromMonth} onChange={(e) => setFilters({...filters, fromMonth: e.target.value})} style={fs}><option value="">Month</option>{months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}</select>
          <select value={filters.fromDay} onChange={(e) => setFilters({...filters, fromDay: e.target.value})} style={fs}><option value="">Day</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
          <input type="text" placeholder="2026" value={filters.fromYear} onChange={(e) => setFilters({...filters, fromYear: e.target.value})} style={{ ...fs, width: 48 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>To :</span>
          <select value={filters.toMonth} onChange={(e) => setFilters({...filters, toMonth: e.target.value})} style={fs}><option value="">Month</option>{months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}</select>
          <select value={filters.toDay} onChange={(e) => setFilters({...filters, toDay: e.target.value})} style={fs}><option value="">Day</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
          <input type="text" placeholder="2026" value={filters.toYear} onChange={(e) => setFilters({...filters, toYear: e.target.value})} style={{ ...fs, width: 48 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <span>Search with Date :</span>
          <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" name="searchWithDate" checked={filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: true})} /> YES</label>
          <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" name="searchWithDate" checked={!filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: false})} /> NO</label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Reference :</span>
          <input value={filters.reference} onChange={(e) => setFilters({...filters, reference: e.target.value})} style={{ ...fs, width: 96 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, borderBottom: "1px solid #ccc", padding: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Type :</span>
          <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} style={fs}><option value="">--Select--</option><option value="agent">Agent</option><option value="direct">Direct</option></select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Agent Name :</span>
          <select value={filters.agentName} onChange={(e) => setFilters({...filters, agentName: e.target.value})} style={{ ...fs, minWidth: 120 }}><option value="">--Select--</option>{agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Hotel :</span>
          <select value={filters.hotel} onChange={(e) => { setFilters({...filters, hotel: e.target.value, room: ""}); fetchFilterRoomsForHotel(e.target.value); }} style={{ ...fs, minWidth: 120 }}><option value="">--Select--</option>{ownHotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}</select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Room :</span>
          <select value={filters.room} onChange={(e) => setFilters({...filters, room: e.target.value})} disabled={!filters.hotel} style={{ ...fs, minWidth: 100 }}><option value="">{filters.hotel ? "--Select--" : "Select hotel"}</option>{filterRooms.map(room => <option key={room.id} value={room.id}>{room.room_type || room.room_number}</option>)}</select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
          <span>User :</span>
          <select value={filters.user} onChange={(e) => setFilters({...filters, user: e.target.value})} style={{ ...fs, minWidth: 100 }}><option value="">--Select--</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.username || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'}</option>)}</select>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span>Package :</span>
            <select value={filters.package} onChange={(e) => setFilters({...filters, package: e.target.value})} style={{ ...fs, minWidth: 120 }}><option value="">--Select--</option></select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span>Customer :</span>
            <input value={filters.customer} onChange={(e) => setFilters({...filters, customer: e.target.value})} style={{ ...fs, width: 112 }} />
          </div>
        </div>
        <button style={{ border: "1px solid #888", padding: "2px 16px", fontSize: 11, backgroundColor: "#f5f5f5", cursor: "pointer" }}>Search</button>
      </div>
    </div>
  );

  return (
    <>
      <AdminPageShell title="Due Amount Booking" actions={[{ label: "View All Records", onClick: () => navigate("/admin/dashboard") }]} filterSection={filterSection}>
        {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
          <>
            <ThemedTable>
              <ThemedTHead>
                <ThemedTH>S.No.</ThemedTH>
                <ThemedTH>Booking↕</ThemedTH>
                <ThemedTH>Type</ThemedTH>
                <ThemedTH>Customer Name↕</ThemedTH>
                <ThemedTH>Price</ThemedTH>
                <ThemedTH>Date↕</ThemedTH>
                <ThemedTH>User↕</ThemedTH>
                <ThemedTH>Action</ThemedTH>
              </ThemedTHead>
              <tbody>
                {filteredBookings.length === 0 ? <ThemedEmptyRow colSpan={8} message="No bookings with due amount found" /> : filteredBookings.map((booking, index) => (
                  <ThemedTR key={booking.id} index={index}>
                    <ThemedTD>{index + 1}</ThemedTD>
                    <ThemedTD>
                      <div>Booking:</div>
                      <div>{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("en-GB") : "-"} - {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString("en-GB") : "-"}</div>
                      <div>No. of Rooms: {booking.hotel_info?.number_of_rooms || 1}</div>
                      <div>{booking.adults || 0} Adult {booking.children || 0} Children</div>
                      <div>Price: Rs. {(booking.total_amount || 0).toLocaleString("en-IN")}/-</div>
                    </ThemedTD>
                    <ThemedTD>
                      <div style={{ textTransform: "capitalize" }}>{booking.booking_type === "agent" ? "Agent" : "Direct"}</div>
                      {booking.agents?.name && <div>{booking.agents.name}</div>}
                    </ThemedTD>
                    <ThemedTD>
                      <div style={{ fontWeight: 500 }}>{booking.customer_name || "-"}</div>
                      <div>Contact No.: {booking.contact_no || ""}</div>
                    </ThemedTD>
                    <ThemedTD>
                      <div>Booking Price : Rs. {(booking.total_amount || 0).toLocaleString("en-IN")} /-</div>
                      <div>Receviced Price : Rs. {(booking.paid_amount || 0).toLocaleString("en-IN")} /-</div>
                      <div>Due Price : Rs. {(booking.due_amount || 0).toLocaleString("en-IN")} /-</div>
                    </ThemedTD>
                    <ThemedTD>{booking.created_at ? new Date(booking.created_at).toLocaleDateString("en-GB") : "-"}</ThemedTD>
                    <ThemedTD>{getUserName(booking.created_by)}</ThemedTD>
                    <ThemedTD>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span onClick={() => handleViewDetails(booking)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>View Booking</span>
                        <span onClick={() => window.print()} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Print Booking</span>
                        <span onClick={() => paymentDialog.handleViewPayment(booking)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>View Payment</span>
                        <span onClick={() => navigate(`/admin/refunds?booking_id=${booking.id}&view=true`)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>View Refund Payment</span>
                        <span onClick={() => toast.info("Delete booking feature coming soon")} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Delete Booking</span>
                      </div>
                    </ThemedTD>
                  </ThemedTR>
                ))}
              </tbody>
            </ThemedTable>
            <div style={{ padding: "6px 10px", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", color: "#c00", fontStyle: "italic" }}>
              <strong>Total Booking Price :</strong> Rs. {totalAmount.toLocaleString('en-IN')} /-&nbsp;&nbsp;
              <strong>Total Received Payment :</strong> Rs. {totalPaid.toLocaleString('en-IN')} /-&nbsp;&nbsp;
              <strong>Total Due Payment :</strong> Rs. {totalDue.toLocaleString('en-IN')} /-
            </div>
          </>
        )}
      </AdminPageShell>

      {/* View Booking Details Dialog */}
      <Dialog open={showViewDetailDialog} onOpenChange={setShowViewDetailDialog}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-auto p-0 rounded-lg">
          <div className="px-4 py-2" style={{ backgroundColor: "#b44a50" }}>
            <DialogTitle className="text-white text-sm font-semibold">View Booking Details</DialogTitle>
          </div>
          {selectedBooking && (
            <div className="p-4">
              <div className="border border-gray-400 rounded" style={{ backgroundColor: "#f6f0f0" }}>
                <div className="p-4 text-[12px]">
                  <table className="w-full">
                    <tbody>
                      <tr><td className="pr-4 py-0.5" style={{ width: '45%' }}>Type :</td><td className="py-0.5 capitalize">{selectedBooking.booking_type === "agent" ? "Agent" : "Direct"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Reference :</td><td className="py-0.5">{selectedBooking.reference || selectedBooking.notes || "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Email-Id :</td><td className="py-0.5">{selectedBooking.email || "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Customer Name :</td><td className="py-0.5">{selectedBooking.customer_name || "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Contact No :</td><td className="py-0.5">{selectedBooking.contact_no || "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">No. of People :</td><td className="py-0.5">{selectedBooking.adults || 0} Adult {selectedBooking.children || 0} Children</td></tr>
                      <tr><td className="pr-4 py-0.5">Booking From :</td><td className="py-0.5">{selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString("en-GB") : "-"}</td></tr>
                      <tr><td className="pr-4 py-0.5">Booking To :</td><td className="py-0.5">{selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString("en-GB") : "-"}</td></tr>
                      {viewDetailOwnHotelInfo.length > 0 && viewDetailOwnHotelInfo.map((hotel, idx) => (
                        <React.Fragment key={`own-hotel-${idx}`}>
                          <tr><td colSpan={2} className="font-bold pt-3 pb-1">Hotel :</td></tr>
                          <tr><td className="pr-4 py-0.5">Hotel Name :</td><td className="py-0.5">{hotel.hotelName}</td></tr>
                          <tr><td className="pr-4 py-0.5">Number of Rooms :</td><td className="py-0.5">{hotel.numberOfRooms}</td></tr>
                          <tr><td className="pr-4 py-0.5">Room Name :</td><td className="py-0.5">{hotel.roomName}</td></tr>
                          <tr><td className="pr-4 py-0.5">Hotel Check In :</td><td className="py-0.5">{hotel.checkIn ? new Date(hotel.checkIn).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Hotel Check Out :</td><td className="py-0.5">{hotel.checkOut ? new Date(hotel.checkOut).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Room Selling Price :</td><td className="py-0.5">Rs. {(hotel.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                        </React.Fragment>
                      ))}
                      {viewDetailAnotherHotelInfo.length > 0 && viewDetailAnotherHotelInfo.map((hotel, idx) => (
                        <React.Fragment key={`another-hotel-${idx}`}>
                          <tr><td colSpan={2} className="font-bold pt-3 pb-1">Another Hotel :</td></tr>
                          <tr><td className="pr-4 py-0.5">Another Hotel Name :</td><td className="py-0.5">{hotel.hotelName}</td></tr>
                          <tr><td className="pr-4 py-0.5">Number of Rooms :</td><td className="py-0.5">{hotel.numberOfRooms}</td></tr>
                          <tr><td className="pr-4 py-0.5">Room Type :</td><td className="py-0.5">{hotel.roomName}</td></tr>
                          <tr><td className="pr-4 py-0.5">Hotel Booking Date :</td><td className="py-0.5">{hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Hotel Check In :</td><td className="py-0.5">{hotel.checkIn ? new Date(hotel.checkIn).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Hotel Check Out :</td><td className="py-0.5">{hotel.checkOut ? new Date(hotel.checkOut).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Room Booking Price :</td><td className="py-0.5">Rs. {(hotel.roomRate || 0).toLocaleString('en-IN')}/-</td></tr>
                          <tr><td className="pr-4 py-0.5">Room Selling Price :</td><td className="py-0.5">Rs. {(hotel.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                        </React.Fragment>
                      ))}
                      {viewDetailSafariInfo.length > 0 && viewDetailSafariInfo.map((safari, idx) => (
                        <React.Fragment key={`safari-${idx}`}>
                          <tr><td colSpan={2} className="font-bold pt-3 pb-1">Safari :</td></tr>
                          <tr><td className="pr-4 py-0.5">Transporter :</td><td className="py-0.5">{safari.transporter}</td></tr>
                          <tr><td className="pr-4 py-0.5">Safari Booking Date :</td><td className="py-0.5">{safari.createdAt ? new Date(safari.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Safari Date :</td><td className="py-0.5">{safari.safariDate ? new Date(safari.safariDate).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">No of Safari :</td><td className="py-0.5">{safari.numberOfPersons}</td></tr>
                          <tr><td className="pr-4 py-0.5">Safari Booking Price :</td><td className="py-0.5">Rs. {(safari.ratePerPerson || 0).toLocaleString('en-IN')}/-</td></tr>
                          <tr><td className="pr-4 py-0.5">Safari Selling Price :</td><td className="py-0.5">Rs. {(safari.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                        </React.Fragment>
                      ))}
                      {viewDetailVolvoDMInfo.length > 0 && viewDetailVolvoDMInfo.map((volvo, idx) => (
                        <React.Fragment key={`dm-${idx}`}>
                          <tr><td colSpan={2} className="font-bold pt-3 pb-1">Delhi - Manali :</td></tr>
                          <tr><td className="pr-4 py-0.5">No. of Tickets :</td><td className="py-0.5">{volvo.numberOfSeats}</td></tr>
                          <tr><td className="pr-4 py-0.5">Ticket No. :</td><td className="py-0.5">{volvo.ticketNumber}</td></tr>
                          <tr><td className="pr-4 py-0.5">Seat No. :</td><td className="py-0.5">{volvo.seatNumbers}</td></tr>
                          <tr><td className="pr-4 py-0.5">Transporter :</td><td className="py-0.5">{volvo.transporter}</td></tr>
                          <tr><td className="pr-4 py-0.5">Volvo Booking Date :</td><td className="py-0.5">{volvo.createdAt ? new Date(volvo.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Volvo Journey Date :</td><td className="py-0.5">{volvo.travelDate ? new Date(volvo.travelDate).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Volvo Booking Price :</td><td className="py-0.5">Rs. {(volvo.ratePerSeat || 0).toLocaleString('en-IN')}/-</td></tr>
                          <tr><td className="pr-4 py-0.5">Volvo Selling Price :</td><td className="py-0.5">Rs. {(volvo.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                        </React.Fragment>
                      ))}
                      {viewDetailVolvoMDInfo.length > 0 && viewDetailVolvoMDInfo.map((volvo, idx) => (
                        <React.Fragment key={`md-${idx}`}>
                          <tr><td colSpan={2} className="font-bold pt-3 pb-1">Manali - Delhi :</td></tr>
                          <tr><td className="pr-4 py-0.5">No. of Tickets :</td><td className="py-0.5">{volvo.numberOfSeats}</td></tr>
                          <tr><td className="pr-4 py-0.5">Ticket No. :</td><td className="py-0.5">{volvo.ticketNumber}</td></tr>
                          <tr><td className="pr-4 py-0.5">Seat No. :</td><td className="py-0.5">{volvo.seatNumbers}</td></tr>
                          <tr><td className="pr-4 py-0.5">Transporter :</td><td className="py-0.5">{volvo.transporter}</td></tr>
                          <tr><td className="pr-4 py-0.5">Volvo Booking Date :</td><td className="py-0.5">{volvo.createdAt ? new Date(volvo.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Volvo Journey Date :</td><td className="py-0.5">{volvo.travelDate ? new Date(volvo.travelDate).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Volvo Booking Price :</td><td className="py-0.5">Rs. {(volvo.ratePerSeat || 0).toLocaleString('en-IN')}/-</td></tr>
                          <tr><td className="pr-4 py-0.5">Volvo Selling Price :</td><td className="py-0.5">Rs. {(volvo.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                        </React.Fragment>
                      ))}
                      {viewDetailVehicleInfo.length > 0 && viewDetailVehicleInfo.map((vehicle, idx) => (
                        <React.Fragment key={`vehicle-${idx}`}>
                          <tr><td colSpan={2} className="font-bold pt-3 pb-1">Another Vehicle :</td></tr>
                          <tr><td className="pr-4 py-0.5">Vehicle Details :</td><td className="py-0.5">{vehicle.vehicleType}</td></tr>
                          <tr><td className="pr-4 py-0.5">Vehicle Selling Price :</td><td className="py-0.5">Rs. {(vehicle.totalAmount || 0).toLocaleString('en-IN')}/-</td></tr>
                          <tr><td className="pr-4 py-0.5">Vehicle Booking Price :</td><td className="py-0.5">Rs. {(vehicle.rate || 0).toLocaleString('en-IN')}/-</td></tr>
                          <tr><td className="pr-4 py-0.5">Transporter :</td><td className="py-0.5">{vehicle.transporter}</td></tr>
                          <tr><td className="pr-4 py-0.5">Vehicle Booking Date :</td><td className="py-0.5">{vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString("en-GB") : "-"}</td></tr>
                          <tr><td className="pr-4 py-0.5">Vehicle Journey Date :</td><td className="py-0.5">{vehicle.pickupDate ? new Date(vehicle.pickupDate).toLocaleDateString("en-GB") : "-"}</td></tr>
                        </React.Fragment>
                      ))}
                      <tr><td className="pr-4 py-0.5 pt-3">Date :</td><td className="py-0.5 pt-3">{selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleDateString("en-GB") : "-"}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <div className="px-4 py-2" style={{ backgroundColor: "#b44a50" }}>
            <span className="text-white text-xs">&nbsp;</span>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentDialogs
        showPaymentDialog={paymentDialog.showPaymentDialog}
        setShowPaymentDialog={paymentDialog.setShowPaymentDialog}
        showViewPaymentDialog={paymentDialog.showViewPaymentDialog}
        setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog}
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
    </>
  );
}
