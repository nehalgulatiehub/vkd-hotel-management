import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";
import { PartsDatePicker } from "@/components/ui/PartsDatePicker";
import { LegacyPanelHeader } from "@/components/legacy/LegacyPanelHeader";
import { LegacyFormRow } from "@/components/legacy/LegacyFormRow";
import { legacyFilterContainerStyle, legacyFilterLabelClass, legacyFilterInputClass, legacySearchButtonStyle } from "@/components/legacy/legacyFilterStyles";

export default function SafariDue() {
  const navigate = useNavigate();
  const [safariBookings, setSafariBookings] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
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
    customer: "",
    contactNo: "",
    email: "",
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
    const { data } = await supabase.from("profiles").select("id, username, first_name, last_name").order("username");
    setUsers(data || []);
  };

  const fetchSafariBookings = async () => {
    const { data, error } = await supabase
      .from("safari_bookings")
      .select("*, bookings(id, booking_number, customer_name, email, status, contact_no, address, booking_type, adults, children, check_in_date, check_out_date, notes, reference, created_at, created_by, agents(name))")
      .gt("due_amount", 0)
      .order("safari_date", { ascending: true });
    
    if (error) {
      toast.error("Failed to load safari due amounts");
    } else {
      setSafariBookings(data || []);
    }
  };

  // Helper to get username from users array
  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return "Unknown User";
    const user = users.find(u => u.id === userId);
    if (!user) return "Unknown User";
    return user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || "Unknown User";
  };

  const filteredBookings = safariBookings.filter(booking => {
    const matchesType = !filters.type || booking.bookings?.booking_type === filters.type;
    const matchesAgent = !filters.agentName || booking.bookings?.agent_id === filters.agentName;
    const matchesCustomer = !filters.customer || 
      booking.bookings?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());
    const matchesContact = !filters.contactNo ||
      booking.bookings?.contact_no?.toLowerCase().includes(filters.contactNo.toLowerCase());
    const matchesEmail = !filters.email ||
      booking.bookings?.email?.toLowerCase().includes(filters.email.toLowerCase());
    
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
    
    return matchesType && matchesAgent && matchesCustomer && matchesContact && matchesEmail && matchesDate;
  });

  const totalDue = filteredBookings.reduce((sum, booking) => sum + (booking.due_amount || 0), 0);
  const totalAmount = filteredBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  const totalPaid = filteredBookings.reduce((sum, booking) => sum + (booking.paid_amount || 0), 0);
  const totalBookingPrice = filteredBookings.reduce((sum, booking) => sum + (Number(booking.rate_per_person) || 0), 0);

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

  const handleAddPayment = (booking: any) => { setSelectedBooking(booking); setPaymentAmount(""); setPaymentMode(""); setPaymentReference(""); setShowAddPaymentDialog(true); };
  const submitPayment = async () => {
    if (!paymentAmount || !paymentMode) { toast.error("Please fill in required fields"); return; }
    if (isSubmittingPayment) return;
    setIsSubmittingPayment(true);
    try {
      const bookingId = getBookingId(selectedBooking);
      const amount = parseFloat(paymentAmount);
      
      const { error } = await supabase.from("payments").insert({ 
        booking_id: bookingId, 
        amount: amount, 
        payment_mode: paymentMode, 
        reference_number: paymentReference, 
        payment_date: new Date().toISOString().split('T')[0] 
      });
      if (error) throw error;
      
      // Update safari_bookings paid_amount and due_amount
      const newPaidAmount = (selectedBooking.paid_amount || 0) + amount;
      const newDueAmount = (selectedBooking.total_amount || 0) - newPaidAmount;
      
      await supabase
        .from("safari_bookings")
        .update({ paid_amount: newPaidAmount, due_amount: newDueAmount })
        .eq("id", selectedBooking.id);
      
      toast.success("Payment added"); 
      setShowAddPaymentDialog(false); 
      fetchSafariBookings();
    } catch (error) { toast.error("Failed to add payment"); } finally { setIsSubmittingPayment(false); }
  };

  const getBookingId = (booking: any) => booking.bookings?.id || booking.booking_id;

  return (
    <div className="min-h-screen bg-background">
      <Header title="Safari Due Amount" />
      <main className="p-4">
        <LegacyPanelHeader
          title="Safari Due Amount"
          className="mb-3"
          right={
            <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => navigate("/safari-details")}>
              View All Records
            </Button>
          }
        />

        {/* Compact Filter Section */}
        <div className="mb-3" style={legacyFilterContainerStyle}>
          {/* Row 1: Dates and Search with Date */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2" style={{ borderBottom: "1px solid #666" }}>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>From :</span>
              <PartsDatePicker month={filters.fromMonth} day={filters.fromDay} year={filters.fromYear} onChange={(p) => setFilters({...filters, fromMonth: p.month, fromDay: p.day, fromYear: p.year})} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>To :</span>
              <PartsDatePicker month={filters.toMonth} day={filters.toDay} year={filters.toYear} onChange={(p) => setFilters({...filters, toMonth: p.month, toDay: p.day, toYear: p.year})} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>Search with Date :</span>
              <label className={`flex items-center gap-0.5 ${legacyFilterLabelClass}`}><input type="radio" name="searchWithDate" checked={filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: true})} className="w-3 h-3" />YES</label>
              <label className={`flex items-center gap-0.5 ${legacyFilterLabelClass}`}><input type="radio" name="searchWithDate" checked={!filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: false})} className="w-3 h-3" />NO</label>
            </div>
          </div>

          {/* Row 2: Type, Agent, Reference */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2" style={{ borderBottom: "1px solid #666" }}>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>Type :</span>
              <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className={legacyFilterInputClass}>
                <option value="">--Select--</option>
                <option value="agent">Agent</option>
                <option value="direct">Direct</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>Agent Name :</span>
              <select value={filters.agentName} onChange={(e) => setFilters({...filters, agentName: e.target.value})} className={`${legacyFilterInputClass} min-w-[120px]`}>
                <option value="">--Select--</option>
                {agents.map(agent => (<option key={agent.id} value={agent.id}>{agent.name}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={legacyFilterLabelClass}>Reference :</span>
              <input value={filters.reference} onChange={(e) => setFilters({...filters, reference: e.target.value})} className={`${legacyFilterInputClass} w-28`} />
            </div>
          </div>

          {/* Row 3: User, Customer, Search */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5">
                <span className={legacyFilterLabelClass}>User :</span>
                <select value={filters.user} onChange={(e) => setFilters({...filters, user: e.target.value})} className={`${legacyFilterInputClass} min-w-[100px]`}>
                  <option value="">--Select--</option>
                  {users.map(user => (<option key={user.id} value={user.id}>{user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={legacyFilterLabelClass}>Customer :</span>
                <input value={filters.customer} onChange={(e) => setFilters({...filters, customer: e.target.value})} className={`${legacyFilterInputClass} w-28`} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={legacyFilterLabelClass}>Contact No :</span>
                <input value={filters.contactNo} onChange={(e) => setFilters({...filters, contactNo: e.target.value})} className={`${legacyFilterInputClass} w-28`} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className={legacyFilterLabelClass}>Email :</span>
                <input value={filters.email} onChange={(e) => setFilters({...filters, email: e.target.value})} className={`${legacyFilterInputClass} w-32`} />
              </div>
            </div>
            <button style={legacySearchButtonStyle}>Search</button>
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
                          {getUserName(booking.bookings?.created_by)}
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
            <div className="p-3 border-t" style={{ backgroundColor: "#fff", borderColor: "#ccc", fontSize: 11 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 32px" }}>
                <span><strong>Total Booking Price :</strong> Rs. {totalBookingPrice.toLocaleString("en-IN")} /-</span>
                <span><strong>Total Selling Price :</strong> Rs. {totalAmount.toLocaleString("en-IN")} /-</span>
                <span><strong>Net Profit :</strong> Rs. {(totalAmount - totalBookingPrice).toLocaleString("en-IN")} /-</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 32px", marginTop: 2 }}>
                <span><strong>Total Received Payment :</strong> Rs. {totalPaid.toLocaleString("en-IN")} /-</span>
                <span><strong>Total Due Payment :</strong> Rs. {totalDue.toLocaleString("en-IN")} /-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Details Dialog - Using shared component */}
        <BookingDetailsDialog
          open={showViewDetailDialog}
          onOpenChange={setShowViewDetailDialog}
          booking={selectedBooking?.bookings}
          serviceType="safari"
          serviceData={selectedBooking}
        />

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

        {/* Add Payment Dialog */}
        <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
          <DialogContent className="max-w-md p-0 overflow-hidden">
            <div className="px-4 py-2" style={{ backgroundColor: "#1e6e99" }}>
              <DialogTitle className="text-white text-sm font-semibold">Add Payment - {selectedBooking?.bookings?.booking_number}</DialogTitle>
            </div>
            <div className="p-4 space-y-3" style={{ backgroundColor: "#F5E6E0" }}>
              <LegacyFormRow label="Amount" required>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" className="w-full h-8 text-xs border border-input bg-white px-2 rounded-sm" />
              </LegacyFormRow>
              <LegacyFormRow label="Payment Mode" required>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full h-8 text-xs border border-input bg-white px-2 rounded-sm">
                  <option value="">Select mode</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </LegacyFormRow>
              <LegacyFormRow label="Reference Number">
                <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Transaction/Cheque number" className="w-full h-8 text-xs border border-input bg-white px-2 rounded-sm" />
              </LegacyFormRow>
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
