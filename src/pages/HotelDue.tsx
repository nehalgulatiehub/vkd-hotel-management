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
  const [users, setUsers] = useState<any[]>([]);
  
  // Dialog states
  const [showViewDetailDialog, setShowViewDetailDialog] = useState(false);
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

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
    user: "",
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
    fetchUsers();
  }, []);

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("*").order("name");
    setAgents(data || []);
  };

  const fetchHotels = async () => {
    const { data } = await supabase.from("another_hotels").select("*").order("name");
    setHotels(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("first_name");
    setUsers(data || []);
  };

  const fetchHotelBookings = async () => {
    const { data, error } = await supabase
      .from("hotel_bookings")
      .select(`
        *,
        bookings(id, booking_number, customer_name, status, contact_no, address, booking_type, check_in_date, check_out_date, total_amount, paid_amount, due_amount, created_at, created_by, agents(name)),
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
    const matchesUser = !filters.user || booking.bookings?.created_by === filters.user;
    
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
    
    return matchesType && matchesAgent && matchesCustomer && matchesHotel && matchesUser && matchesDate;
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
    const bookingId = booking.bookings?.id || booking.booking_id;
    if (bookingId) {
      await fetchBookingPayments(bookingId);
    }
  };

  const handleAddPayment = (booking: any) => {
    setSelectedBooking(booking);
    setPaymentAmount("");
    setPaymentMode("");
    setPaymentReference("");
    setShowAddPaymentDialog(true);
  };

  const submitPayment = async () => {
    if (!paymentAmount || !paymentMode) {
      toast.error("Please fill in required fields");
      return;
    }
    if (isSubmittingPayment) return;
    setIsSubmittingPayment(true);
    try {
      const bookingId = getBookingId(selectedBooking);
      const amount = parseFloat(paymentAmount);
      const { error } = await supabase.from("payments").insert({
        booking_id: bookingId,
        amount,
        payment_mode: paymentMode,
        reference_number: paymentReference,
        payment_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      toast.success("Payment added successfully");
      setShowAddPaymentDialog(false);
      fetchHotelBookings();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to add payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const getBookingId = (booking: any) => booking.bookings?.id || booking.booking_id;

  return (
    <div className="min-h-screen bg-background">
      <Header title="Due Amount Another Hotel Detail" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">Due Amount Another Hotel Detail</span>
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

          {/* Row 2: Type, Agent, Reference */}
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
                {agents.map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Reference :</span>
              <input value={filters.reference} onChange={(e) => setFilters({...filters, reference: e.target.value})} className="h-5 w-28 text-[11px] border border-input bg-background px-1 rounded-sm" />
            </div>
          </div>

          {/* Row 3: User, Customer, Hotel Name, Search button */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">User :</span>
                <select value={filters.user} onChange={(e) => setFilters({...filters, user: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[100px] rounded-sm">
                  <option value="">--Select--</option>
                  {users.map(user => (<option key={user.id} value={user.id}>{user.first_name} {user.last_name}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Customer :</span>
                <input value={filters.customer} onChange={(e) => setFilters({...filters, customer: e.target.value})} className="h-5 w-28 text-[11px] border border-input bg-background px-1 rounded-sm" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Hotel Name :</span>
                <select value={filters.hotel} onChange={(e) => setFilters({...filters, hotel: e.target.value})} className="h-5 text-[11px] border border-input bg-background px-1 min-w-[140px] rounded-sm">
                  <option value="">-------Select-------</option>
                  {hotels.map(hotel => (<option key={hotel.id} value={hotel.id}>{hotel.name}</option>))}
                </select>
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
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Hotel Detail</th>
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
                          <div className="capitalize">{booking.bookings?.booking_type || "Direct"}</div>
                          <div className="text-muted-foreground">{booking.bookings?.agents?.name || ""}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          company
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div className="font-medium">{booking.bookings?.customer_name || "-"}</div>
                          {booking.bookings?.address && <div className="text-muted-foreground">{booking.bookings?.address}</div>}
                          <div className="text-muted-foreground">Contact No.: {booking.bookings?.contact_no || ""}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div><strong>Hotel Name :</strong> {booking.another_hotels?.name || "-"}</div>
                          <div><strong>No of Rooms :</strong> {booking.number_of_rooms || 1}</div>
                          <div><strong>Room Type :</strong> {booking.room_type || "-"}</div>
                          <div><strong>Booking Price :</strong> Rs. {booking.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                          <div><strong>Selling Price :</strong> Rs. {booking.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                          <div><strong>Total Received Payment :</strong> Rs. {booking.paid_amount?.toLocaleString("en-IN") || 0}/-</div>
                          <div className="text-destructive"><strong>Due Payment :</strong> Rs. {booking.due_amount?.toLocaleString("en-IN") || 0}/-</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div><strong>Date :</strong>{booking.bookings?.created_at ? new Date(booking.bookings.created_at).toLocaleDateString("en-GB") : "-"}</div>
                          <div className="text-right"><strong>Booking From</strong></div>
                          <div className="text-right">:{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("en-GB") : "-"}</div>
                          <div className="text-right"><strong>Booking To</strong></div>
                          <div className="text-right">:{booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString("en-GB") : "-"}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleViewDetails(booking)}>View Details</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/bookings/${getBookingId(booking)}`)}>Print Booking</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/bookings?edit=${getBookingId(booking)}`)}>Edit Booking</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleAddPayment(booking)}>Add Payment</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleViewPayment(booking)}>View Payment</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/refunds?booking_id=${getBookingId(booking)}`)}>Refund Payment</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/refunds?booking_id=${getBookingId(booking)}&view=true`)}>View Refund Payment</Button>
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
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Booking Price</td><td className="py-1.5">₹{selectedBooking.total_amount?.toLocaleString("en-IN") || 0}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Received</td><td className="py-1.5">₹{selectedBooking.paid_amount?.toLocaleString("en-IN") || 0}</td></tr>
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
                {/* Summary */}
                <table className="w-full text-xs border-collapse mb-4" style={{ backgroundColor: "#FDE1E1" }}>
                  <tbody>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 px-2 font-semibold">Total Payment</td>
                      <td className="py-1.5 px-2">₹{selectedBooking.total_amount?.toLocaleString("en-IN") || 0}</td>
                      <td className="py-1.5 px-2">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-[11px] text-primary"
                          onClick={() => { setShowViewPaymentDialog(false); handleViewDetails(selectedBooking); }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-b border-[#FFC1C1]">
                      <td className="py-1.5 px-2 font-semibold">Total Received Payment</td>
                      <td className="py-1.5 px-2">₹{selectedBooking.paid_amount?.toLocaleString("en-IN") || 0}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-2 font-semibold">Total Due Payment</td>
                      <td className="py-1.5 px-2 text-destructive">₹{selectedBooking.due_amount?.toLocaleString("en-IN") || 0}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                {/* Payment History */}
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "#D4A59A" }}>
                      <th className="border border-[#c99] px-2 py-1.5 text-left">S.No.</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left">Amount</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left">Date</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left">Mode</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left">Notes</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left">City/Place</th>
                      <th className="border border-[#c99] px-2 py-1.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingPayments.length === 0 ? (
                      <tr><td colSpan={7} className="border border-[#c99] px-2 py-4 text-center text-muted-foreground">No payments recorded</td></tr>
                    ) : (
                      bookingPayments.map((payment, idx) => (
                        <tr key={payment.id} style={{ backgroundColor: "#F5E6E0" }}>
                          <td className="border border-[#c99] px-2 py-1.5">{idx + 1}</td>
                          <td className="border border-[#c99] px-2 py-1.5">₹{payment.amount?.toLocaleString("en-IN")}</td>
                          <td className="border border-[#c99] px-2 py-1.5">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-GB") : "-"}</td>
                          <td className="border border-[#c99] px-2 py-1.5">{payment.payment_mode || "-"}{payment.reference_number ? ` (${payment.reference_number})` : ""}</td>
                          <td className="border border-[#c99] px-2 py-1.5">{payment.notes || "-"}</td>
                          <td className="border border-[#c99] px-2 py-1.5">{payment.cities?.name || "-"}</td>
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

        {/* Add Payment Dialog */}
        <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <DialogTitle className="text-white text-sm font-semibold">Add Payment - {selectedBooking?.bookings?.booking_number}</DialogTitle>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Amount *</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" className="w-full h-8 text-xs border border-input bg-background px-2 rounded-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Payment Mode *</label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full h-8 text-xs border border-input bg-background px-2 rounded-sm">
                  <option value="">Select mode</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Reference Number</label>
                <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction/Cheque number" className="w-full h-8 text-xs border border-input bg-background px-2 rounded-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddPaymentDialog(false)}>Cancel</Button>
                <Button size="sm" onClick={submitPayment} disabled={isSubmittingPayment}>{isSubmittingPayment ? "Adding..." : "Add Payment"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
