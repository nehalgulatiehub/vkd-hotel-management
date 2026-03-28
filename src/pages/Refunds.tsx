import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterInputStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";
import { Header } from "@/components/layout/Header";

export default function Refunds() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const bookingId = searchParams.get("id");

  const [bookings, setBookings] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ booking_id: "", cancellation_id: "", refund_amount: "", refund_mode: "", reference_number: "", notes: "" });

  useEffect(() => { fetchBookings(); fetchRefunds(); if (bookingId) fetchBookingById(bookingId); }, [bookingId]);

  const fetchBookings = async () => { const { data } = await supabase.from("bookings").select("*, agents(name)").eq("status", "cancelled").order("created_at", { ascending: false }); setBookings(data || []); };
  const fetchRefunds = async () => { const { data } = await supabase.from("refunds").select("*, bookings(booking_number, customer_name), cancellations(cancellation_reason)").order("created_at", { ascending: false }); setRefunds(data || []); };

  const fetchBookingById = async (id: string) => {
    const { data } = await supabase.from("bookings").select("*, agents(name)").eq("id", id).single();
    if (data) {
      setSelectedBooking(data);
      const { data: cancelData } = await supabase.from("cancellations").select("*").eq("booking_id", id).single();
      setFormData({ booking_id: id, cancellation_id: cancelData?.id || "", refund_amount: data.paid_amount?.toString() || "", refund_mode: "", reference_number: "", notes: "" });
      setShowForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("refunds").insert({ booking_id: formData.booking_id, cancellation_id: formData.cancellation_id || null, refund_amount: parseFloat(formData.refund_amount), refund_mode: formData.refund_mode, reference_number: formData.reference_number, notes: formData.notes, refund_date: new Date().toISOString().split('T')[0] });
      if (error) throw error;
      toast.success("Refund processed successfully");
      setShowForm(false); setSelectedBooking(null); fetchRefunds();
      setFormData({ booking_id: "", cancellation_id: "", refund_amount: "", refund_mode: "", reference_number: "", notes: "" });
    } catch (error) { console.error("Error processing refund:", error); toast.error("Failed to process refund"); }
  };

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(refunds);
  const sty = filterInputStyle;

  const formContent = showForm ? (
    <div style={{ padding: 12, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 8, color: "#333" }}>📋 Process Refund</div>
      <div style={{ border: "1px solid #ccc" }}>
        <div style={{ backgroundColor: "#b44a50", color: "#fff", padding: "4px 10px", fontSize: 11, fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
          <span>Refund Form</span>
          <span onClick={() => { setShowForm(false); setSelectedBooking(null); navigate(isAdminRoute ? "/admin/refund-payments" : "/refunds"); }} style={{ color: "#fff", cursor: "pointer", textDecoration: "underline" }}>View Refunds</span>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 16, backgroundColor: "#fff" }}>
          {!bookingId && (
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ width: 140, textAlign: "right" }}>Cancelled Booking :</label>
              <select value={formData.booking_id} onChange={e => { const b = bookings.find(x => x.id === e.target.value); setSelectedBooking(b); setFormData({ ...formData, booking_id: e.target.value, refund_amount: b?.paid_amount?.toString() || "" }); }} style={{ ...sty, flex: 1, border: "1px solid #999", padding: "2px 4px" }}>
                <option value="">--Select Booking--</option>
                {bookings.map(b => <option key={b.id} value={b.id}>{b.booking_number} - {b.customer_name}</option>)}
              </select>
            </div>
          )}
          {selectedBooking && (
            <>
              <div style={{ backgroundColor: "#f6f0f0", padding: 8, marginBottom: 12, border: "1px solid #ddd" }}>
                <div><strong>Booking:</strong> {selectedBooking.booking_number}</div>
                <div><strong>Customer:</strong> {selectedBooking.customer_name}</div>
                <div><strong>Total Paid:</strong> Rs. {selectedBooking.paid_amount || 0}/-</div>
              </div>
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ width: 140, textAlign: "right" }}>Refund Amount :</label>
                <input type="number" step="0.01" required value={formData.refund_amount} onChange={e => setFormData({ ...formData, refund_amount: e.target.value })} style={{ ...sty, border: "1px solid #999", padding: "2px 4px", width: 200 }} />
                <span style={{ color: "red" }}>*</span>
              </div>
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ width: 140, textAlign: "right" }}>Refund Mode :</label>
                <select required value={formData.refund_mode} onChange={e => setFormData({ ...formData, refund_mode: e.target.value })} style={{ ...sty, border: "1px solid #999", padding: "2px 4px" }}>
                  <option value="">--Select--</option>
                  <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option><option value="upi">UPI</option><option value="card">Card</option>
                </select>
                <span style={{ color: "red" }}>*</span>
              </div>
              <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ width: 140, textAlign: "right" }}>Reference No. :</label>
                <input value={formData.reference_number} onChange={e => setFormData({ ...formData, reference_number: e.target.value })} style={{ ...sty, border: "1px solid #999", padding: "2px 4px", width: 200 }} placeholder="Transaction/Cheque number" />
              </div>
              <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <label style={{ width: 140, textAlign: "right", paddingTop: 4 }}>Notes :</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} style={{ ...sty, border: "1px solid #999", padding: "2px 4px", flex: 1, maxWidth: 400, fontFamily: "Arial", fontSize: 11 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                <button type="submit" style={filterButtonStyle}>Process Refund</button>
                <button type="button" onClick={() => { setShowForm(false); setSelectedBooking(null); navigate(isAdminRoute ? "/admin/refund-payments" : "/refunds"); }} style={filterButtonStyle}>Cancel</button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  ) : null;

  const tableContent = !showForm ? (
    <AdminPageShell title="View Refunds" actions={[{ label: "Process Refund", onClick: () => setShowForm(true) }]} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Booking No</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Refund Amount</ThemedTH><ThemedTH>Mode</ThemedTH><ThemedTH>Reference</ThemedTH><ThemedTH>Status</ThemedTH></ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={8} message="No refunds found" /> : paginatedItems.map((refund, index) => (
            <ThemedTR key={refund.id} index={index}>
              <ThemedTD>{startIndex + index + 1}</ThemedTD>
              <ThemedTD>{refund.refund_date ? new Date(refund.refund_date).toLocaleDateString() : "-"}</ThemedTD>
              <ThemedTD>{refund.bookings?.booking_number || "-"}</ThemedTD>
              <ThemedTD>{refund.bookings?.customer_name || "-"}</ThemedTD>
              <ThemedTD>Rs. {refund.refund_amount?.toFixed(2) || "0.00"}/-</ThemedTD>
              <ThemedTD>{refund.refund_mode || "-"}</ThemedTD>
              <ThemedTD>{refund.reference_number || "-"}</ThemedTD>
              <ThemedTD><span style={{ color: "green", fontWeight: "bold" }}>Processed</span></ThemedTD>
            </ThemedTR>
          ))}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  ) : null;

  if (!isAdminRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Refunds Management" />
        <main className="p-6">{formContent || tableContent}</main>
      </div>
    );
  }

  return <>{formContent || tableContent}</>;
}
