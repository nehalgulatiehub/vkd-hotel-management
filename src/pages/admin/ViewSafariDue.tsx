import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";

interface SafariWithBooking {
  id: string;
  safari_name: string;
  safari_date: string;
  number_of_persons: number | null;
  rate_per_person: number | null;
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

export default function ViewSafariDue() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [safaris, setSafaris] = useState<SafariWithBooking[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showViewDetailDialog, setShowViewDetailDialog] = useState(false);
  const [showViewPaymentDialog, setShowViewPaymentDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [filters, setFilters] = useState({
    fromMonth: "", fromDay: "", fromYear: "",
    toMonth: "", toDay: "", toYear: "",
    type: "", agentName: "", user: "", customer: "", reference: "",
    searchWithDate: false
  });

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) { fetchSafaris(); fetchAgents(); fetchUsers(); }
  }, [authLoading, canManage]);

  const fetchAgents = async () => { const { data } = await supabase.from("agents").select("*").order("name"); setAgents(data || []); };
  const fetchUsers = async () => { const { data } = await supabase.from("profiles").select("id, username, first_name, last_name").order("username"); setUsers(data || []); };
  const getUserName = (userId: string | null | undefined) => { if (!userId) return "Unknown User"; const user = users.find(u => u.id === userId); if (!user) return "Unknown User"; return user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || "Unknown User"; };

  const fetchSafaris = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("safari_bookings").select(`id, safari_name, safari_date, number_of_persons, rate_per_person, total_amount, paid_amount, due_amount, booking:bookings(id, booking_number, customer_name, contact_no, address, booking_type, created_at, created_by, total_amount, paid_amount, due_amount, agents(name))`).gt("due_amount", 0).order("safari_date", { ascending: false });
      if (error) throw error;
      setSafaris(data || []);
    } catch (error) { console.error("Error fetching safaris:", error); }
    finally { setLoading(false); }
  };

  const filteredSafaris = safaris.filter(safari => {
    const matchesType = !filters.type || safari.booking?.booking_type === filters.type;
    const matchesAgent = !filters.agentName || safari.booking?.agents?.name?.toLowerCase().includes(filters.agentName.toLowerCase());
    const matchesCustomer = !filters.customer || safari.booking?.customer_name?.toLowerCase().includes(filters.customer.toLowerCase());
    let matchesDate = true;
    if (filters.searchWithDate && filters.fromYear && filters.fromMonth && filters.fromDay) {
      const fromDate = new Date(`${filters.fromYear}-${filters.fromMonth.padStart(2, '0')}-${filters.fromDay.padStart(2, '0')}`);
      const safariDate = new Date(safari.safari_date);
      matchesDate = safariDate >= fromDate;
      if (filters.toYear && filters.toMonth && filters.toDay) {
        const toDate = new Date(`${filters.toYear}-${filters.toMonth.padStart(2, '0')}-${filters.toDay.padStart(2, '0')}`);
        matchesDate = matchesDate && safariDate <= toDate;
      }
    }
    return matchesType && matchesAgent && matchesCustomer && matchesDate;
  });

  const totalDue = filteredSafaris.reduce((sum, s) => sum + (s.due_amount || 0), 0);
  const totalAmount = filteredSafaris.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const totalPaid = filteredSafaris.reduce((sum, s) => sum + (s.paid_amount || 0), 0);

  const handleViewDetails = (safari: any) => { setSelectedBooking(safari); setShowViewDetailDialog(true); };
  const fetchBookingPayments = async (bookingId: string) => { const { data } = await supabase.from("payments").select("id, amount, payment_date, payment_mode, reference_number, notes, approval_status, cities(name)").eq("booking_id", bookingId).order("payment_date", { ascending: false }); setBookingPayments(data || []); };
  const handleViewPayment = async (safari: any) => { setSelectedBooking(safari); setBookingPayments([]); setShowViewPaymentDialog(true); if (safari.booking?.id) await fetchBookingPayments(safari.booking.id); };
  const handleAddPayment = (safari: any) => { setSelectedBooking(safari); setPaymentAmount(""); setPaymentMode(""); setPaymentReference(""); setShowAddPaymentDialog(true); };
  const submitPayment = async () => {
    if (!paymentAmount || !paymentMode) { toast.error("Please fill in required fields"); return; }
    if (isSubmittingPayment) return;
    setIsSubmittingPayment(true);
    try {
      const amount = parseFloat(paymentAmount);
      const { error } = await supabase.from("payments").insert({ booking_id: selectedBooking?.booking?.id, amount, payment_mode: paymentMode, reference_number: paymentReference, payment_date: new Date().toISOString().split('T')[0] });
      if (error) throw error;
      const newPaidAmount = (selectedBooking?.paid_amount || 0) + amount;
      const newDueAmount = (selectedBooking?.total_amount || 0) - newPaidAmount;
      await supabase.from("safari_bookings").update({ paid_amount: newPaidAmount, due_amount: newDueAmount }).eq("id", selectedBooking?.id);
      toast.success("Payment added"); setShowAddPaymentDialog(false); fetchSafaris();
    } catch (error) { toast.error("Failed to add payment"); }
    finally { setIsSubmittingPayment(false); }
  };

  if (authLoading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;

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
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Search with Date :</span>
          <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" name="safariSearchDate" checked={filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: true})} /> YES</label>
          <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" name="safariSearchDate" checked={!filters.searchWithDate} onChange={() => setFilters({...filters, searchWithDate: false})} /> NO</label>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, borderBottom: "1px solid #ccc", padding: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Type :</span>
          <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} style={fs}><option value="">--Select--</option><option value="agent">Agent</option><option value="direct">Direct</option></select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Agent Name :</span>
          <select value={filters.agentName} onChange={(e) => setFilters({...filters, agentName: e.target.value})} style={{ ...fs, minWidth: 120 }}><option value="">--Select--</option>{agents.map(agent => <option key={agent.id} value={agent.name}>{agent.name}</option>)}</select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Reference :</span>
          <input value={filters.reference} onChange={(e) => setFilters({...filters, reference: e.target.value})} style={{ ...fs, width: 112 }} />
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span>User :</span>
            <select value={filters.user} onChange={(e) => setFilters({...filters, user: e.target.value})} style={{ ...fs, minWidth: 100 }}><option value="">--Select--</option>{users.map(user => <option key={user.id} value={user.id}>{user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'}</option>)}</select>
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
      <AdminPageShell title="Safari Due Amount" actions={[{ label: "View All Records", onClick: () => navigate("/admin/safari-details") }]} filterSection={filterSection}>
        {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
          <>
            <ThemedTable>
              <ThemedTHead>
                <ThemedTH>S.No.</ThemedTH>
                <ThemedTH>Type</ThemedTH>
                <ThemedTH>User</ThemedTH>
                <ThemedTH>Customer Details</ThemedTH>
                <ThemedTH>Safari Details</ThemedTH>
                <ThemedTH>Date</ThemedTH>
                <ThemedTH>Actions</ThemedTH>
              </ThemedTHead>
              <tbody>
                {filteredSafaris.length === 0 ? <ThemedEmptyRow colSpan={7} message="No safari due amounts found" /> : filteredSafaris.map((safari, index) => (
                  <ThemedTR key={safari.id} index={index}>
                    <ThemedTD>{index + 1}</ThemedTD>
                    <ThemedTD>
                      <div style={{ textTransform: "capitalize" }}>{safari.booking?.booking_type || "Direct"}</div>
                      <div style={{ color: "#999" }}>{safari.booking?.agents?.name || ""}</div>
                    </ThemedTD>
                    <ThemedTD>{getUserName((safari.booking as any)?.created_by)}</ThemedTD>
                    <ThemedTD>
                      <div style={{ fontWeight: 500 }}>{safari.booking?.customer_name || "-"}</div>
                      {safari.booking?.address && <div style={{ color: "#999" }}>{safari.booking.address}</div>}
                      <div style={{ color: "#999" }}>Contact No.: {safari.booking?.contact_no || ""}</div>
                    </ThemedTD>
                    <ThemedTD>
                      <div><strong>No of Persons :</strong> {safari.number_of_persons || 1}</div>
                      <div><strong>Booking Price :</strong> Rs. {safari.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                      <div><strong>Selling Price :</strong> Rs. {safari.total_amount?.toLocaleString("en-IN") || 0}/-</div>
                      <div><strong>Total Received Payment :</strong> Rs. {safari.paid_amount?.toLocaleString("en-IN") || 0}/-</div>
                      <div style={{ color: "#c00" }}><strong>Due Payment :</strong> Rs. {safari.due_amount?.toLocaleString("en-IN") || 0}/-</div>
                    </ThemedTD>
                    <ThemedTD>
                      <div><strong>Date :</strong> {safari.booking?.created_at ? new Date(safari.booking.created_at).toLocaleDateString("en-GB") : "-"}</div>
                      <div><strong>Safari Date :</strong></div>
                      <div>{safari.safari_date ? new Date(safari.safari_date).toLocaleDateString("en-GB") : "-"}</div>
                    </ThemedTD>
                    <ThemedTD>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span onClick={() => handleViewDetails(safari)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>View Details</span>
                        <span onClick={() => safari.booking && navigate(`/bookings/${safari.booking.id}`)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Print Booking</span>
                        <span onClick={() => safari.booking && navigate(`/admin/bookings?edit=${safari.booking.id}`)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Edit Booking</span>
                        <span onClick={() => handleAddPayment(safari)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Add Payment</span>
                        <span onClick={() => handleViewPayment(safari)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>View Payment</span>
                        <span onClick={() => safari.booking && navigate(`/refunds?booking_id=${safari.booking.id}`)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Refund Payment</span>
                      </div>
                    </ThemedTD>
                  </ThemedTR>
                ))}
              </tbody>
            </ThemedTable>
            <div style={{ padding: "6px 10px", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", color: "#c00", fontStyle: "italic" }}>
              <strong>Total Amount :</strong> Rs. {totalAmount.toLocaleString("en-IN")}/-&nbsp;&nbsp;
              <strong>Total Received :</strong> Rs. {totalPaid.toLocaleString("en-IN")}/-&nbsp;&nbsp;
              <strong>Total Due :</strong> Rs. {totalDue.toLocaleString("en-IN")}/-
            </div>
          </>
        )}
      </AdminPageShell>

      <BookingDetailsDialog open={showViewDetailDialog} onOpenChange={setShowViewDetailDialog} booking={selectedBooking?.booking} serviceType="safari" serviceData={selectedBooking} />

      <Dialog open={showViewPaymentDialog} onOpenChange={setShowViewPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Payment History</DialogTitle>
          <div className="p-3 rounded mb-4" style={{ backgroundColor: "#b44a50" }}>
            <div className="flex justify-between text-white text-sm">
              <span>Total: Rs. {selectedBooking?.total_amount?.toLocaleString("en-IN") || 0}/-</span>
              <span>Received: Rs. {selectedBooking?.paid_amount?.toLocaleString("en-IN") || 0}/-</span>
              <span>Due: Rs. {selectedBooking?.due_amount?.toLocaleString("en-IN") || 0}/-</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr style={{ backgroundColor: "#c47a7e" }}>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left text-white">Date</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left text-white">Mode</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left text-white">Reference</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-right text-white">Amount</th>
                  <th className="border border-[#ddd] px-2 py-1.5 text-left text-white">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingPayments.length === 0 ? (
                  <tr><td colSpan={5} className="border border-[#ddd] px-2 py-4 text-center text-gray-500">No payments found</td></tr>
                ) : bookingPayments.map(payment => (
                  <tr key={payment.id} style={{ backgroundColor: "#f6f0f0" }}>
                    <td className="border border-[#ddd] px-2 py-1.5">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-GB") : "-"}</td>
                    <td className="border border-[#ddd] px-2 py-1.5">{payment.payment_mode || "-"}</td>
                    <td className="border border-[#ddd] px-2 py-1.5">{payment.reference_number || "-"}</td>
                    <td className="border border-[#ddd] px-2 py-1.5 text-right">Rs. {payment.amount?.toLocaleString("en-IN")}/-</td>
                    <td className="border border-[#ddd] px-2 py-1.5 capitalize">{payment.approval_status || "pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

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
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option>
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
    </>
  );
}
