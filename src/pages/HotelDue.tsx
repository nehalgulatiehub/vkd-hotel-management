import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function HotelDue() {
  const navigate = useNavigate();
  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  
  // Dialog states
  const [showViewDetailDialog, setShowViewDetailDialog] = useState(false);
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);

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
    customer: "",
    reference: "",
    searchWithDate: false
  });

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  useEffect(() => {
    fetchHotelBookings();
    fetchAgents();
    fetchHotels();
  }, []);

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("*").order("name");
    setAgents(data || []);
  };

  const fetchHotels = async () => {
    const { data } = await supabase.from("another_hotels").select("*").order("name");
    setHotels(data || []);
  };

  const fetchHotelBookings = async () => {
    const { data, error } = await supabase
      .from("hotel_bookings")
      .select(`
        *,
        bookings(id, booking_number, customer_name, status, contact_no, booking_type, check_in_date, check_out_date, total_amount, paid_amount, due_amount, created_at, agents(name)),
        another_hotels:hotel_id(name)
      `)
      .not("hotel_id", "is", null)
      .gt("due_amount", 0)
      .order("check_in_date", { ascending: true });
    
    if (error) {
      toast.error("Failed to load hotel due amounts");
    } else {
      setHotelBookings(data || []);
    }
  };

  const filteredBookings = hotelBookings.filter(booking => {
    const matchesType = !filters.type || booking.bookings?.booking_type === filters.type;
    const matchesAgent = !filters.agentName || booking.bookings?.agent_id === filters.agentName;
    const matchesCustomer = !filters.customer || 
      booking.bookings?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());
    const matchesHotel = !filters.hotel || booking.hotel_id === filters.hotel;
    
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
    
    return matchesType && matchesAgent && matchesCustomer && matchesHotel && matchesDate;
  });

  const totalDue = filteredBookings.reduce((sum, booking) => sum + (booking.due_amount || 0), 0);
  const totalAmount = filteredBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  const totalPaid = filteredBookings.reduce((sum, booking) => sum + (booking.paid_amount || 0), 0);

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowViewDetailDialog(true);
  };

  const fetchBookingPayments = async (bookingId: string) => {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, payment_date, payment_mode, reference_number, notes, approval_status, cities(name)")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });
    setBookingPayments(data || []);
  };

  const handleViewPayment = async (booking: any) => {
    setSelectedBooking(booking);
    setBookingPayments([]);
    setShowViewPaymentDialog(true);
    if (booking.bookings?.id) {
      await fetchBookingPayments(booking.bookings.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Another Hotel Due Amount" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">Another Hotel Due Amount</span>
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
              <select value={filters.fromMonth} onChange={(e) => setFilters({...filters, fromMonth: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">Jan</option>
                {months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}
              </select>
              <select value={filters.fromDay} onChange={(e) => setFilters({...filters, fromDay: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">1</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="text" placeholder="2026" value={filters.fromYear} onChange={(e) => setFilters({...filters, fromYear: e.target.value})} className="h-5 w-12 text-[11px] border border-input bg-background px-1 rounded-sm" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">To :</span>
              <select value={filters.toMonth} onChange={(e) => setFilters({...filters, toMonth: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">Jan</option>
                {months.map(m => <option key={m} value={m}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}</option>)}
              </select>
              <select value={filters.toDay} onChange={(e) => setFilters({...filters, toDay: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 rounded-sm">
                <option value="">1</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="text" placeholder="2026" value={filters.toYear} onChange={(e) => setFilters({...filters, toYear: e.target.value})} className="h-5 w-12 text-[11px] border border-input bg-background px-1 rounded-sm" />
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

          {/* Row 2: Type, Agent, Hotel, Customer */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
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
                  {agents.map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Hotel :</span>
                <select value={filters.hotel} onChange={(e) => setFilters({...filters, hotel: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[120px] rounded-sm">
                  <option value="">--Select--</option>
                  {hotels.map(hotel => (<option key={hotel.id} value={hotel.id}>{hotel.name}</option>))}
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#D4A59A" }}>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">S.No.</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Type</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer Details</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Hotel Details</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Booking Price</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">
                        No hotel due amounts found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking, index) => (
                      <tr key={booking.id} style={{ backgroundColor: "#F5E6E0" }}>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">{index + 1}</td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="capitalize">{booking.bookings?.booking_type || "-"}</div>
                          <div className="text-muted-foreground">{booking.bookings?.agents?.name || "Direct"}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="font-medium">{booking.bookings?.customer_name || "-"}</div>
                          <div className="text-muted-foreground">Contact: {booking.bookings?.contact_no || "-"}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div><strong>Hotel:</strong> {booking.another_hotels?.name || "-"}</div>
                          <div><strong>Room:</strong> {booking.room_type || "-"}</div>
                          <div><strong>Rooms:</strong> {booking.number_of_rooms || 1}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div><strong>Total:</strong> Rs. {booking.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                          <div><strong>Paid:</strong> Rs. {booking.paid_amount?.toLocaleString("en-IN") || 0}/-</div>
                          <div className="text-destructive"><strong>Due:</strong> Rs. {booking.due_amount?.toLocaleString("en-IN") || 0}/-</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div><strong>Check-in:</strong> {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("en-GB") : "-"}</div>
                          <div><strong>Check-out:</strong> {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString("en-GB") : "-"}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleViewDetails(booking)}>View Details</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleViewPayment(booking)}>View Payment</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => navigate(`/hotel-payments?booking_id=${booking.bookings?.id}`)}>Add Payment</Button>
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
              <div className="text-xs"><span className="font-semibold">Total Amount:</span> ₹{totalAmount.toLocaleString("en-IN")}</div>
              <div className="text-xs"><span className="font-semibold">Total Paid:</span> ₹{totalPaid.toLocaleString("en-IN")}</div>
              <div className="text-xs text-destructive"><span className="font-semibold">Total Due:</span> ₹{totalDue.toLocaleString("en-IN")}</div>
            </div>
          </CardContent>
        </Card>

        {/* View Details Dialog */}
        <Dialog open={showViewDetailDialog} onOpenChange={setShowViewDetailDialog}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <DialogTitle className="text-white text-sm font-semibold">Hotel Booking Details</DialogTitle>
            </div>
            {selectedBooking && (
              <div className="p-4" style={{ backgroundColor: "#FDE1E1" }}>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold w-32">Booking No</td><td className="py-1.5">{selectedBooking.bookings?.booking_number || "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Customer</td><td className="py-1.5">{selectedBooking.bookings?.customer_name || "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Hotel</td><td className="py-1.5">{selectedBooking.another_hotels?.name || "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Room Type</td><td className="py-1.5">{selectedBooking.room_type || "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">No. of Rooms</td><td className="py-1.5">{selectedBooking.number_of_rooms || 1}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Check-in</td><td className="py-1.5">{selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString("en-GB") : "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Check-out</td><td className="py-1.5">{selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString("en-GB") : "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Total Amount</td><td className="py-1.5">₹{selectedBooking.total_amount?.toLocaleString("en-IN") || 0}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Paid Amount</td><td className="py-1.5">₹{selectedBooking.paid_amount?.toLocaleString("en-IN") || 0}</td></tr>
                    <tr><td className="py-1.5 font-semibold">Due Amount</td><td className="py-1.5 text-destructive">₹{selectedBooking.due_amount?.toLocaleString("en-IN") || 0}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}></div>
          </DialogContent>
        </Dialog>

        {/* View Payment Dialog */}
        <Dialog open={showViewPaymentDialog} onOpenChange={setShowViewPaymentDialog}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <DialogTitle className="text-white text-sm font-semibold">View Payment</DialogTitle>
            </div>
            {selectedBooking && (
              <div className="p-4">
                <table className="w-full mb-4 text-xs border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "#D4A59A" }}>
                      <th className="border border-[#c99] px-3 py-1.5 text-left font-semibold">Total</th>
                      <th className="border border-[#c99] px-3 py-1.5 text-left font-semibold">Paid</th>
                      <th className="border border-[#c99] px-3 py-1.5 text-left font-semibold">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="border border-[#c99] px-3 py-1.5">₹{selectedBooking.total_amount?.toLocaleString("en-IN") || 0}</td>
                      <td className="border border-[#c99] px-3 py-1.5">₹{selectedBooking.paid_amount?.toLocaleString("en-IN") || 0}</td>
                      <td className="border border-[#c99] px-3 py-1.5 text-destructive">₹{selectedBooking.due_amount?.toLocaleString("en-IN") || 0}</td>
                    </tr>
                  </tbody>
                </table>
                <h4 className="text-xs font-semibold mb-2">Payment History</h4>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "#D4A59A" }}>
                      <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">S.No.</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Amount</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Date</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Mode</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingPayments.length === 0 ? (
                      <tr><td colSpan={5} className="border border-[#c99] px-2 py-4 text-center text-muted-foreground">No payments found</td></tr>
                    ) : (
                      bookingPayments.map((payment, idx) => (
                        <tr key={payment.id} style={{ backgroundColor: "#F5E6E0" }}>
                          <td className="border border-[#c99] px-2 py-1.5">{idx + 1}</td>
                          <td className="border border-[#c99] px-2 py-1.5">₹{payment.amount?.toLocaleString("en-IN") || 0}</td>
                          <td className="border border-[#c99] px-2 py-1.5">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-GB") : "-"}</td>
                          <td className="border border-[#c99] px-2 py-1.5">{payment.payment_mode || "-"}</td>
                          <td className="border border-[#c99] px-2 py-1.5 capitalize">{payment.approval_status || "pending"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}></div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
