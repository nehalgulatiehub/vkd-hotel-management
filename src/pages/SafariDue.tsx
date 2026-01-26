import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function SafariDue() {
  const navigate = useNavigate();
  const [safariBookings, setSafariBookings] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
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
    user: "",
    customer: "",
    reference: "",
    searchWithDate: false
  });

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  useEffect(() => {
    fetchSafariBookings();
    fetchAgents();
    fetchUsers();
  }, []);

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("*").order("name");
    setAgents(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("first_name");
    setUsers(data || []);
  };

  const fetchSafariBookings = async () => {
    const { data, error } = await supabase
      .from("safari_bookings")
      .select("*, bookings(id, booking_number, customer_name, status, contact_no, address, booking_type, created_at, agents(name))")
      .gt("due_amount", 0)
      .order("safari_date", { ascending: true });
    
    if (error) {
      toast.error("Failed to load safari due amounts");
    } else {
      setSafariBookings(data || []);
    }
  };

  const filteredBookings = safariBookings.filter(booking => {
    const matchesType = !filters.type || booking.bookings?.booking_type === filters.type;
    const matchesAgent = !filters.agentName || booking.bookings?.agent_id === filters.agentName;
    const matchesCustomer = !filters.customer || 
      booking.bookings?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());
    
    let matchesDate = true;
    if (filters.searchWithDate && filters.fromYear && filters.fromMonth && filters.fromDay) {
      const fromDate = new Date(`${filters.fromYear}-${filters.fromMonth.padStart(2, '0')}-${filters.fromDay.padStart(2, '0')}`);
      const bookingDate = new Date(booking.safari_date);
      matchesDate = bookingDate >= fromDate;
      
      if (filters.toYear && filters.toMonth && filters.toDay) {
        const toDate = new Date(`${filters.toYear}-${filters.toMonth.padStart(2, '0')}-${filters.toDay.padStart(2, '0')}`);
        matchesDate = matchesDate && bookingDate <= toDate;
      }
    }
    
    return matchesType && matchesAgent && matchesCustomer && matchesDate;
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

  const getBookingId = (booking: any) => booking.bookings?.id || booking.booking_id;

  return (
    <div className="min-h-screen bg-background">
      <Header title="Safari Due Amount" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">Safari Due Amount</span>
          <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => navigate("/safari-details")}>
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
              <label className="flex items-center gap-0.5 text-[11px]"><input type="radio" name="searchWithDate" checked={filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: true})} className="w-3 h-3" />YES</label>
              <label className="flex items-center gap-0.5 text-[11px]"><input type="radio" name="searchWithDate" checked={!filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: false})} className="w-3 h-3" />NO</label>
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

          {/* Row 3: User, Customer, Search */}
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
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Safari Details</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date</th>
                    <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr><td colSpan={7} className="border border-[#c99] px-4 py-8 text-center text-muted-foreground">No safari due amounts found</td></tr>
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
                          <div><strong>No of Persons :</strong> {booking.number_of_persons || 1}</div>
                          <div><strong>Booking Price :</strong> Rs. {booking.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                          <div><strong>Selling Price :</strong> Rs. {booking.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                          <div><strong>Total Received Payment :</strong> Rs. {booking.paid_amount?.toLocaleString("en-IN") || 0}/-</div>
                          <div className="text-destructive"><strong>Due Payment :</strong> Rs. {booking.due_amount?.toLocaleString("en-IN") || 0}/-</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                          <div><strong>Date :</strong>{booking.bookings?.created_at ? new Date(booking.bookings.created_at).toLocaleDateString("en-GB") : "-"}</div>
                          <div><strong>Safari Date</strong></div>
                          <div>:{booking.safari_date ? new Date(booking.safari_date).toLocaleDateString("en-GB") : "-"}</div>
                        </td>
                        <td className="border border-[#c99] px-3 py-2 align-top">
                          <div className="flex flex-col gap-0.5">
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleViewDetails(booking)}>View Details</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/booking-details/${getBookingId(booking)}`)}>Print Booking</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/booking-details/${getBookingId(booking)}`)}>Edit Booking</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/booking-payments?booking_id=${getBookingId(booking)}`)}>Add Payment</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleViewPayment(booking)}>View Payment</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/refunds?booking_id=${getBookingId(booking)}`)}>Refund Payment</Button>
                            <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => getBookingId(booking) && navigate(`/refunds?booking_id=${getBookingId(booking)}`)}>View Refund Payment</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
              <DialogTitle className="text-white text-sm font-semibold">Safari Booking Details</DialogTitle>
            </div>
            {selectedBooking && (
              <div className="p-4" style={{ backgroundColor: "#FDE1E1" }}>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold w-32">Booking No</td><td className="py-1.5">{selectedBooking.bookings?.booking_number || "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Customer</td><td className="py-1.5">{selectedBooking.bookings?.customer_name || "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Contact</td><td className="py-1.5">{selectedBooking.bookings?.contact_no || "-"}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">No. of Persons</td><td className="py-1.5">{selectedBooking.number_of_persons || 1}</td></tr>
                    <tr className="border-b border-[#FFC1C1]"><td className="py-1.5 font-semibold">Safari Date</td><td className="py-1.5">{selectedBooking.safari_date ? new Date(selectedBooking.safari_date).toLocaleDateString("en-GB") : "-"}</td></tr>
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
                        <Button variant="link" size="sm" className="h-auto p-0 text-[11px] text-primary" onClick={() => { setShowViewPaymentDialog(false); handleViewDetails(selectedBooking); }}>View Details</Button>
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
      </main>
    </div>
  );
}
