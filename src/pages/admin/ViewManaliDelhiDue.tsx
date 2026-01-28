import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";

interface VolvoWithBooking {
  id: string;
  route: string;
  travel_date: string;
  number_of_seats: number | null;
  rate_per_seat: number | null;
  total_amount: number | null;
  paid_amount: number | null;
  due_amount: number | null;
  booking: {
    id: string;
    booking_number: string;
    customer_name: string | null;
    contact_no: string | null;
    address: string | null;
    booking_type: string | null;
    created_at: string | null;
    total_amount: number | null;
    paid_amount: number | null;
    due_amount: number | null;
    agents?: { name: string } | null;
  } | null;
}

export default function ViewManaliDelhiDue() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [volvos, setVolvos] = useState<VolvoWithBooking[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    fromMonth: "", fromDay: "", fromYear: "",
    toMonth: "", toDay: "", toYear: "",
    type: "", agentName: "", user: "", customer: "", ticketNo: "",
    searchWithDate: false
  });

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchVolvos();
      fetchAgents();
      fetchUsers();
    }
  }, [authLoading, canManage]);

  const fetchAgents = async () => {
    const { data } = await supabase.from("agents").select("*").order("name");
    setAgents(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("first_name");
    setUsers(data || []);
  };

  const fetchVolvos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("volvo_bookings")
        .select(`
          id, route, travel_date, number_of_seats, rate_per_seat,
          total_amount, paid_amount, due_amount,
          booking:bookings(id, booking_number, customer_name, contact_no, address, booking_type, created_at, total_amount, paid_amount, due_amount, agents(name))
        `)
        .eq("route", "manali_delhi")
        .gt("due_amount", 0)
        .order("travel_date", { ascending: false });

      if (error) throw error;
      setVolvos(data || []);
    } catch (error) {
      console.error("Error fetching volvos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVolvos = volvos.filter(volvo => {
    const matchesType = !filters.type || volvo.booking?.booking_type === filters.type;
    const matchesAgent = !filters.agentName || volvo.booking?.agents?.name?.toLowerCase().includes(filters.agentName.toLowerCase());
    const matchesCustomer = !filters.customer || volvo.booking?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());
    
    let matchesDate = true;
    if (filters.searchWithDate && filters.fromYear && filters.fromMonth && filters.fromDay) {
      const fromDate = new Date(`${filters.fromYear}-${filters.fromMonth.padStart(2, '0')}-${filters.fromDay.padStart(2, '0')}`);
      const travelDate = new Date(volvo.travel_date);
      matchesDate = travelDate >= fromDate;
      
      if (filters.toYear && filters.toMonth && filters.toDay) {
        const toDate = new Date(`${filters.toYear}-${filters.toMonth.padStart(2, '0')}-${filters.toDay.padStart(2, '0')}`);
        matchesDate = matchesDate && travelDate <= toDate;
      }
    }
    
    return matchesType && matchesAgent && matchesCustomer && matchesDate;
  });

  const totalDue = filteredVolvos.reduce((sum, v) => sum + (v.due_amount || 0), 0);
  const totalAmount = filteredVolvos.reduce((sum, v) => sum + (v.total_amount || 0), 0);
  const totalPaid = filteredVolvos.reduce((sum, v) => sum + (v.paid_amount || 0), 0);

  const handleViewDetails = (volvo: any) => {
    setSelectedBooking(volvo);
    setShowViewDetailDialog(true);
  };

  const fetchBookingPayments = async (bookingId: string) => {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, payment_date, payment_mode, reference_number, notes, approval_status")
      .eq("booking_id", bookingId)
      .order("payment_date", { ascending: false });
    setBookingPayments(data || []);
  };

  const handleViewPayment = async (volvo: any) => {
    setSelectedBooking(volvo);
    setBookingPayments([]);
    setShowViewPaymentDialog(true);
    const bookingId = volvo.booking?.id;
    if (bookingId) {
      await fetchBookingPayments(bookingId);
    }
  };

  const handleAddPayment = (volvo: any) => {
    setSelectedBooking(volvo);
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
      const amount = parseFloat(paymentAmount);
      const { error } = await supabase.from("payments").insert({
        booking_id: selectedBooking?.booking?.id,
        amount: amount,
        payment_mode: paymentMode,
        reference_number: paymentReference,
        payment_date: new Date().toISOString().split('T')[0]
      });
      if (error) throw error;
      
      // Update volvo_bookings paid_amount and due_amount
      const newPaidAmount = (selectedBooking?.paid_amount || 0) + amount;
      const newDueAmount = (selectedBooking?.total_amount || 0) - newPaidAmount;
      
      await supabase
        .from("volvo_bookings" as any)
        .update({ paid_amount: newPaidAmount, due_amount: newDueAmount })
        .eq("id", selectedBooking?.id);
      
      toast.success("Payment added");
      setShowAddPaymentDialog(false);
      fetchVolvos();
    } catch (error) {
      toast.error("Failed to add payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Manali-Delhi Due Amount" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        </main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Access Denied" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Access denied.</CardContent></Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Manali-Delhi Due Amount" />
      <main className="p-4">
        {/* Blue Header Bar */}
        <div className="flex justify-between items-center px-4 py-2 mb-3" style={{ backgroundColor: "#1e6e99" }}>
          <span className="text-white font-semibold text-sm">Manali-Delhi Volvo Due Amount</span>
          <Button variant="link" className="text-white p-0 h-auto text-sm hover:text-white/80" onClick={() => navigate("/admin/volvo-manali-delhi")}>
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

          {/* Row 2: Type, Agent, Ticket No */}
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
                {agents.map(agent => (<option key={agent.id} value={agent.name}>{agent.name}</option>))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground">Ticket No :</span>
              <input value={filters.ticketNo} onChange={(e) => setFilters({...filters, ticketNo: e.target.value})} className="h-5 w-24 text-[11px] border border-input bg-background px-1 rounded-sm" />
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
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredVolvos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No Manali-Delhi due amounts found</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: "#D4A59A" }}>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">S.No.</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Type</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Customer Details</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Volvo Details</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Date</th>
                        <th className="border border-[#c99] px-3 py-2 text-left text-xs font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVolvos.map((volvo, index) => (
                        <tr key={volvo.id} style={{ backgroundColor: "#F5E6E0" }}>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">{index + 1}</td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div className="capitalize">{volvo.booking?.booking_type || "Direct"}</div>
                            <div className="text-muted-foreground">{volvo.booking?.agents?.name || ""}</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div className="font-medium">{volvo.booking?.customer_name || "-"}</div>
                            {volvo.booking?.address && <div className="text-muted-foreground">{volvo.booking.address}</div>}
                            <div className="text-muted-foreground">Contact No.: {volvo.booking?.contact_no || ""}</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div><strong>Route :</strong> Manali → Delhi</div>
                            <div><strong>No of Seats :</strong> {volvo.number_of_seats || 1}</div>
                            <div><strong>Booking Price :</strong> Rs. {volvo.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                            <div><strong>Total Received :</strong> Rs. {volvo.paid_amount?.toLocaleString("en-IN") || 0}/-</div>
                            <div className="text-destructive"><strong>Due Payment :</strong> Rs. {volvo.due_amount?.toLocaleString("en-IN") || 0}/-</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 text-xs align-top">
                            <div><strong>Booking Date :</strong> {volvo.booking?.created_at ? new Date(volvo.booking.created_at).toLocaleDateString("en-GB") : "-"}</div>
                            <div><strong>Travel Date :</strong> {volvo.travel_date ? new Date(volvo.travel_date).toLocaleDateString("en-GB") : "-"}</div>
                          </td>
                          <td className="border border-[#c99] px-3 py-2 align-top">
                            <div className="flex flex-col gap-0.5">
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleViewDetails(volvo)}>View Details</Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => volvo.booking && navigate(`/bookings/${volvo.booking.id}`)}>Print Booking</Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => volvo.booking && navigate(`/admin/bookings?edit=${volvo.booking.id}`)}>Edit Booking</Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleAddPayment(volvo)}>Add Payment</Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => handleViewPayment(volvo)}>View Payment</Button>
                              <Button size="sm" variant="link" className="h-auto p-0 text-[11px] text-primary justify-start" onClick={() => volvo.booking && navigate(`/refunds?booking_id=${volvo.booking.id}`)}>Refund Payment</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Summary Footer */}
                <div className="flex justify-end gap-6 p-4 border-t" style={{ backgroundColor: "#FDE1E1", borderColor: "#FFC1C1" }}>
                  <div className="text-xs"><span className="font-semibold">Total Amount:</span> Rs. {totalAmount.toLocaleString("en-IN")}/-</div>
                  <div className="text-xs"><span className="font-semibold">Total Received:</span> Rs. {totalPaid.toLocaleString("en-IN")}/-</div>
                  <div className="text-xs text-destructive"><span className="font-semibold">Total Due:</span> Rs. {totalDue.toLocaleString("en-IN")}/-</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* View Details Dialog */}
      <BookingDetailsDialog
        open={showViewDetailDialog}
        onOpenChange={setShowViewDetailDialog}
        booking={selectedBooking?.booking}
        serviceType="volvo_md"
        serviceData={selectedBooking}
      />

      {/* View Payment Dialog */}
      <Dialog open={showViewPaymentDialog} onOpenChange={setShowViewPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Payment History</DialogTitle>
          <div className="p-3 rounded mb-4" style={{ backgroundColor: "#1e6e99" }}>
            <div className="flex justify-between text-white text-sm">
              <span>Total: Rs. {selectedBooking?.total_amount?.toLocaleString("en-IN") || 0}/-</span>
              <span>Received: Rs. {selectedBooking?.paid_amount?.toLocaleString("en-IN") || 0}/-</span>
              <span>Due: Rs. {selectedBooking?.due_amount?.toLocaleString("en-IN") || 0}/-</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr style={{ backgroundColor: "#D4A59A" }}>
                  <th className="border border-[#c99] px-2 py-1.5 text-left">Date</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left">Mode</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left">Reference</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-right">Amount</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingPayments.length === 0 ? (
                  <tr><td colSpan={5} className="border border-[#c99] px-2 py-4 text-center text-muted-foreground">No payments found</td></tr>
                ) : (
                  bookingPayments.map(payment => (
                    <tr key={payment.id} style={{ backgroundColor: "#F5E6E0" }}>
                      <td className="border border-[#c99] px-2 py-1.5">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-GB") : "-"}</td>
                      <td className="border border-[#c99] px-2 py-1.5">{payment.payment_mode || "-"}</td>
                      <td className="border border-[#c99] px-2 py-1.5">{payment.reference_number || "-"}</td>
                      <td className="border border-[#c99] px-2 py-1.5 text-right">Rs. {payment.amount?.toLocaleString("en-IN")}/-</td>
                      <td className="border border-[#c99] px-2 py-1.5 capitalize">{payment.approval_status || "pending"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPaymentDialog} onOpenChange={setShowAddPaymentDialog}>
        <DialogContent>
          <DialogTitle>Add Payment</DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount *</label>
              <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder="Enter amount" />
            </div>
            <div>
              <label className="text-sm font-medium">Payment Mode *</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                <option value="">Select mode</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Reference Number</label>
              <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddPaymentDialog(false)}>Cancel</Button>
              <Button onClick={submitPayment} disabled={isSubmittingPayment}>{isSubmittingPayment ? "Saving..." : "Add Payment"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
