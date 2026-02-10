import { useState, useEffect } from "react";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";

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

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchBookingsWithDue();
      fetchAgents();
      fetchOwnHotels();
    }
  }, [authLoading]);

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("*").order("name");
    setAgents(data || []);
  };

  const fetchOwnHotels = async () => {
    const { data } = await supabase.from("own_hotels").select("*").order("name");
    setOwnHotels(data || []);
  };

  const fetchFilterRoomsForHotel = async (hotelId: string) => {
    if (!hotelId) { setFilterRooms([]); return; }
    const { data } = await supabase.from("rooms").select("*").eq("hotel_id", hotelId).order("room_number");
    setFilterRooms(data || []);
  };

  const fetchBookingsWithDue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, agents(name)")
        .gt("due_amount", 0)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bookingIds = (data || []).map(b => b.id);
      if (bookingIds.length > 0) {
        const { data: hotelData } = await supabase
          .from("hotel_bookings")
          .select("*, own_hotels(name), another_hotels(name)")
          .in("booking_id", bookingIds);

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
          hotelBookingsMap[hb.booking_id] = {
            hotel_id: hb.own_hotel_id || hb.hotel_id,
            room_id: isUuid ? hb.room_type : null,
            hotel_name: hb.own_hotels?.name || hb.another_hotels?.name || null,
            room_type: isUuid ? (roomsMap[hb.room_type] || hb.room_type) : hb.room_type,
            number_of_rooms: hb.number_of_rooms,
            notes: hb.notes
          };
        });

        setBookings((data || []).map(b => ({ ...b, hotel_info: hotelBookingsMap[b.id] || null })));
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error("Error fetching bookings with due:", error);
    } finally {
      setLoading(false);
    }
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

  if (authLoading) return <div className="p-4 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin()) return <div className="p-4 text-center text-muted-foreground">Admin access required.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        {/* Title */}
        <h1 className="text-sm font-medium mb-3 flex items-center gap-1">
          <span>📋</span> Due Amount Booking
        </h1>

        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-0" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">Search</span>
          <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => navigate("/admin/dashboard")}>
            View All Records
          </Button>
        </div>

        {/* Compact Filter Section */}
        <div className="mb-3 border border-border bg-muted/50">
          {/* Row 1: Dates and Search with Date */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">From :</span>
              <select value={filters.fromMonth} onChange={(e) => setFilters({...filters, fromMonth: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">Month</option>
                {months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}
              </select>
              <select value={filters.fromDay} onChange={(e) => setFilters({...filters, fromDay: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">Day</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="text" placeholder="2026" value={filters.fromYear} onChange={(e) => setFilters({...filters, fromYear: e.target.value})} className="h-5 w-12 text-[11px] border border-input bg-background px-1 rounded-sm" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">To :</span>
              <select value={filters.toMonth} onChange={(e) => setFilters({...filters, toMonth: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">Month</option>
                {months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}
              </select>
              <select value={filters.toDay} onChange={(e) => setFilters({...filters, toDay: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">Day</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="text" placeholder="2026" value={filters.toYear} onChange={(e) => setFilters({...filters, toYear: e.target.value})} className="h-5 w-12 text-[11px] border border-input bg-background px-1 rounded-sm" />
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[11px] text-muted-foreground">Search with Date :</span>
              <label className="flex items-center gap-0.5 text-[11px]">
                <input type="radio" name="searchWithDate" checked={filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: true})} className="w-3 h-3" /> YES
              </label>
              <label className="flex items-center gap-0.5 text-[11px]">
                <input type="radio" name="searchWithDate" checked={!filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: false})} className="w-3 h-3" /> NO
              </label>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Reference :</span>
              <input value={filters.reference} onChange={(e) => setFilters({...filters, reference: e.target.value})} className="h-5 w-24 text-[11px] border border-input bg-background px-1 rounded-sm" />
            </div>
          </div>

          {/* Row 2: Type, Agent, Hotel, Room */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-2 py-1.5 border-b border-border">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Type :</span>
              <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">--Select--</option>
                <option value="agent">Agent</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Agent Name :</span>
              <select value={filters.agentName} onChange={(e) => setFilters({...filters, agentName: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm">
                <option value="">--Select--</option>
                {agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Hotel :</span>
              <select value={filters.hotel} onChange={(e) => { setFilters({...filters, hotel: e.target.value, room: ""}); fetchFilterRoomsForHotel(e.target.value); }} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm">
                <option value="">--Select--</option>
                {ownHotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Room :</span>
              <select value={filters.room} onChange={(e) => setFilters({...filters, room: e.target.value})} disabled={!filters.hotel} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[100px] disabled:bg-muted rounded-sm">
                <option value="">{filters.hotel ? "--Select--" : "Select hotel"}</option>
                {filterRooms.map(room => <option key={room.id} value={room.id}>{room.room_type || room.room_number}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[11px] text-muted-foreground">User :</span>
              <select value={filters.user} onChange={(e) => setFilters({...filters, user: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[100px] rounded-sm">
                <option value="">--Select--</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name || p.username || 'User'} {p.last_name || ''}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Package, Customer, Search */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Package :</span>
                <select value={filters.package} onChange={(e) => setFilters({...filters, package: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm">
                  <option value="">--Select--</option>
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Customer :</span>
                <input value={filters.customer} onChange={(e) => setFilters({...filters, customer: e.target.value})} className="h-5 w-28 text-[11px] border border-input bg-background px-1 rounded-sm" />
              </div>
            </div>
            <button className="h-6 px-4 text-[11px] bg-primary text-primary-foreground border border-primary/80 hover:bg-primary/90 rounded-sm">Search</button>
          </div>
        </div>

        {/* Main Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "#D4A59A" }}>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">S.No.</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Booking↕</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Type</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer Name↕</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Price</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date↕</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">User↕</th>
                      <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Action</th>
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
                            <div className="space-y-0.5">
                              <div>Booking:</div>
                              <div>{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("en-GB") : "-"} - {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString("en-GB") : "-"}</div>
                              <div>No. of Rooms: {booking.hotel_info?.number_of_rooms || 1}</div>
                              <div>{booking.adults || 0} Adult {booking.children || 0} Children</div>
                              <div>Price: Rs. {(booking.total_amount || 0).toLocaleString("en-IN")}/-</div>
                            </div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top text-center">
                            <div className="capitalize">{booking.booking_type === "agent" ? "Agent" : "Direct"}</div>
                            {booking.agents?.name && <div>{booking.agents.name}</div>}
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div className="font-medium">{booking.customer_name || "-"}</div>
                            <div className="text-muted-foreground">Contact No.: {booking.contact_no || ""}</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div className="space-y-0.5">
                              <div>Booking Price : Rs. {(booking.total_amount || 0).toLocaleString("en-IN")} /-</div>
                              <div>Receviced Price : Rs. {(booking.paid_amount || 0).toLocaleString("en-IN")} /-</div>
                              <div>Due Price : Rs. {(booking.due_amount || 0).toLocaleString("en-IN")} /-</div>
                            </div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            {booking.created_at ? new Date(booking.created_at).toLocaleDateString("en-GB") : "-"}
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            {getUserName(booking.created_by)}
                          </td>
                          <td className="border border-[#c99] px-3 py-2 align-top">
                            <div className="flex flex-col gap-0.5">
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => navigate(`/admin/bookings/${booking.id}`)}>
                                View Booking
                              </Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => window.print()}>
                                Print Booking
                              </Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => paymentDialog.handleViewPayment(booking)}>
                                View Payment
                              </Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => navigate(`/admin/refunds?booking_id=${booking.id}&view=true`)}>
                                View Refund Payment
                              </Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-destructive justify-start" onClick={() => toast.info("Delete booking feature coming soon")}>
                                Delete Booking
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

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
      </div>

      {/* Payment Dialogs */}
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
    </div>
  );
}