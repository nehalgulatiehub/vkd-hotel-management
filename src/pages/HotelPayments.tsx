import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";
import { PartsDatePicker } from "@/components/ui/PartsDatePicker";
import { SERVICE_PAYMENT_TYPES } from "@/utils/paymentCategories";
import { matchesPaymentMode, paymentModeLabel } from "@/utils/paymentMode";
import { useAuthContext } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type HotelPayment = Database["public"]["Tables"]["payments"]["Row"] & { hotel_name: string | null };

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function HotelPayments() {
  const { isAdmin, isAccount } = useAuthContext();
  const canManage = isAdmin() || isAccount();
  const [payments, setPayments] = useState<HotelPayment[]>([]);
  const [hotels, setHotels] = useState<Array<{ id: string; name: string }>>([]);
  const [fromMonth, setFromMonth] = useState(months[new Date().getMonth()]);
  const [fromDay, setFromDay] = useState(new Date().getDate());
  const [fromYear, setFromYear] = useState(new Date().getFullYear());
  const [toMonth, setToMonth] = useState(months[new Date().getMonth()]);
  const [toDay, setToDay] = useState(new Date().getDate());
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [searchWithDate, setSearchWithDate] = useState(false);
  const [hotelFilter, setHotelFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");
  const [chequeFilter, setChequeFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPayment, setEditingPayment] = useState<HotelPayment | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMode, setEditMode] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchPayments(); fetchHotels(); }, []);

  const fetchHotels = async () => { const { data } = await supabase.from("another_hotels").select("id, name").order("name"); setHotels(data || []); };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(`*, bookings(id, booking_number, customer_name, contact_no), direct_hotel:another_hotels!payments_hotel_id_fkey(id, name)`)
      .in("payment_type", [...SERVICE_PAYMENT_TYPES.anotherHotel])
      .order("payment_date", { ascending: false });
    if (error) { toast.error("Failed to load hotel payments"); } else {
      const bookingIds = [...new Set((data || []).map(payment => payment.booking_id).filter(Boolean))] as string[];
      const hotelBookingsMap = new Map<string, string>();
      if (bookingIds.length > 0) {
        const { data: hotelBookings } = await supabase
          .from("hotel_bookings")
          .select("booking_id, another_hotels:hotel_id(id, name)")
          .in("booking_id", bookingIds)
          .not("hotel_id", "is", null);
        (hotelBookings || []).forEach(hotelBooking => {
          if (hotelBooking.booking_id && hotelBooking.another_hotels?.name && !hotelBookingsMap.has(hotelBooking.booking_id)) {
            hotelBookingsMap.set(hotelBooking.booking_id, hotelBooking.another_hotels.name);
          }
        });
      }
      const paymentsWithDetails = (data || []).map(payment => ({
        ...payment,
        hotel_name: payment.direct_hotel?.name || (payment.booking_id ? hotelBookingsMap.get(payment.booking_id) : null) || null,
      }));
      setPayments(paymentsWithDetails);
    }
  };

  const filteredPayments = payments.filter(payment => {
    let matchesDate = true;
    if (searchWithDate && payment.payment_date) {
      const paymentDate = new Date(payment.payment_date);
      matchesDate = paymentDate >= new Date(fromYear, months.indexOf(fromMonth), fromDay) && paymentDate <= new Date(toYear, months.indexOf(toMonth), toDay);
    }
    const matchesHotel = !hotelFilter || payment.hotel_name?.toLowerCase() === hotelFilter.toLowerCase();
    const matchesCheque = !chequeFilter || payment.reference_number?.toLowerCase().includes(chequeFilter.toLowerCase());
    return matchesDate && matchesHotel && matchesCheque && matchesPaymentMode(payment.payment_mode, paymentModeFilter);
  });

  const totalPayments = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments);
  const visibleIds = paginatedItems.map(payment => payment.id as string);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const selectedPayments = payments.filter(payment => selectedIds.has(payment.id));
  const selectedApprovedCount = selectedPayments.filter(payment => payment.approval_status?.toLowerCase() === "approved").length;
  const selectedAmount = selectedPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const sty = filterSelectStyle;

  const clearSelection = () => setSelectedIds(new Set());
  const togglePayment = (id: string) => setSelectedIds(previous => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleVisible = () => setSelectedIds(previous => {
    const next = new Set(previous);
    visibleIds.forEach(id => { if (allVisibleSelected) next.delete(id); else next.add(id); });
    return next;
  });

  const openEdit = (payment: HotelPayment) => {
    setEditingPayment(payment);
    setEditAmount(String(payment.amount));
    setEditDate(payment.payment_date || "");
    setEditMode(payment.payment_mode || "");
    setEditReference(payment.reference_number || "");
    setEditNotes(payment.notes || "");
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || !editingPayment) return;
    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !editDate || !editMode.trim()) {
      toast.error("Enter a valid amount, date, and payment mode");
      return;
    }
    setSaving(true);
    const wasApproved = editingPayment.approval_status?.toLowerCase() === "approved";
    const { data, error } = await supabase.from("payments").update({
      amount,
      payment_date: editDate,
      payment_mode: editMode,
      reference_number: editReference.trim() || null,
      notes: editNotes.trim() || null,
      ...(wasApproved ? { approval_status: "pending", approved_at: null, approved_by: null } : {}),
    }).eq("id", editingPayment.id).in("payment_type", [...SERVICE_PAYMENT_TYPES.anotherHotel]).select("id");
    setSaving(false);
    if (error || !data?.length) {
      toast.error("Could not update this payment");
      return;
    }
    setEditingPayment(null);
    toast.success(wasApproved ? "Payment updated and returned to pending approval" : "Payment updated");
    await fetchPayments();
  };

  const deleteSelected = async () => {
    if (!canManage || selectedPayments.length === 0) return;
    setDeleting(true);
    const { data, error } = await supabase.from("payments").delete()
      .in("id", selectedPayments.map(payment => payment.id))
      .in("payment_type", [...SERVICE_PAYMENT_TYPES.anotherHotel])
      .select("id");
    setDeleting(false);
    setDeleteOpen(false);
    if (error || data?.length !== selectedPayments.length) {
      toast.error(error?.message || "Some selected payments could not be deleted");
      await fetchPayments();
      return;
    }
    toast.success(`${data.length} payment${data.length === 1 ? "" : "s"} deleted`);
    clearSelection();
    await fetchPayments();
  };

  const legacyLabel: React.CSSProperties = { fontWeight: "bold", color: "#000" };
  const legacyButton: React.CSSProperties = { backgroundColor: "#adadb0", border: "2px outset #4a4a4b", fontFamily: '"Courier New", Courier, monospace', fontSize: 13, fontWeight: "bold", padding: "1px 14px", color: "#000", borderRadius: 0, cursor: "pointer" };

  const filterSection = (
    <div style={{ width: "100%", fontSize: 13, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "4px 0" }}>
        <span style={legacyLabel}>From :</span>
        <PartsDatePicker month={String(months.indexOf(fromMonth) + 1)} day={String(fromDay)} year={String(fromYear)} onChange={(p) => { setFromMonth(months[Number(p.month) - 1] || fromMonth); setFromDay(Number(p.day)); setFromYear(Number(p.year)); }} />
        <span style={{ marginLeft: 16, ...legacyLabel }}>To :</span>
        <PartsDatePicker month={String(months.indexOf(toMonth) + 1)} day={String(toDay)} year={String(toYear)} onChange={(p) => { setToMonth(months[Number(p.month) - 1] || toMonth); setToDay(Number(p.day)); setToYear(Number(p.year)); }} />
        <span style={{ marginLeft: 16, ...legacyLabel }}>Search with Date :</span>
        <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" checked={searchWithDate} onChange={() => setSearchWithDate(true)} /> YES</label>
        <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" checked={!searchWithDate} onChange={() => setSearchWithDate(false)} /> NO</label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "4px 0" }}>
        <span style={legacyLabel}>Another Hotel :</span>
        <select value={hotelFilter} onChange={e => { setHotelFilter(e.target.value); clearSelection(); }} style={{ ...sty, minWidth: 200 }}>
          <option value="">--Select--</option>
          {hotels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
        </select>
        <span style={{ marginLeft: 16, ...legacyLabel }}>Payment Mode :</span>
        <select value={paymentModeFilter} onChange={e => { setPaymentModeFilter(e.target.value); clearSelection(); }} style={sty}>
          <option value="">---Select Mode---</option>
          <option value="cash">Cash in Hand</option><option value="cash in bank">Cash in Bank</option><option value="net banking">Net Banking</option><option value="bank_transfer">Bank Transfer</option><option value="upi">UPI</option><option value="card">Card</option><option value="credit card">Credit Card</option><option value="cheque">Cheque</option>
        </select>
        <span style={legacyLabel}>Cheque No :</span>
        <input value={chequeFilter} onChange={e => { setChequeFilter(e.target.value); clearSelection(); }} style={{ ...sty, minWidth: 120 }} />
        <button onClick={fetchPayments} style={legacyButton}>Search</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: "bold" }}>Total: Rs. {totalPayments.toLocaleString("en-IN")}/-</span>
      </div>
    </div>
  );

  return (
    <AdminPageShell legacyHeader title="View Another Hotel Payment" filterSection={filterSection} actions={[{ label: "View All Records", onClick: () => { setHotelFilter(""); setPaymentModeFilter(""); setChequeFilter(""); setSearchWithDate(false); clearSelection(); } }]} pagination={{ currentPage, totalPages, onPageChange: page => { clearSelection(); goToPage(page); }, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Another Hotel</ThemedTH><ThemedTH>Payment</ThemedTH><ThemedTH>Payment Mode</ThemedTH><ThemedTH>Cheque No</ThemedTH><ThemedTH>Payment Detail</ThemedTH><ThemedTH>Status</ThemedTH>{canManage && <ThemedTH>Action <input type="checkbox" aria-label="Select all visible payments" checked={allVisibleSelected} onChange={toggleVisible} /></ThemedTH>}</ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={canManage ? 9 : 8} message="No hotel payments found" /> : paginatedItems.map((payment, index) => (
            <ThemedTR key={payment.id} index={index}>
              <ThemedTD>{startIndex + index}</ThemedTD>
              <ThemedTD>{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</ThemedTD>
              <ThemedTD>{payment.hotel_name || "-"}</ThemedTD>
              <ThemedTD>Rs. {payment.amount?.toLocaleString("en-IN")}/-</ThemedTD>
              <ThemedTD>{paymentModeLabel(payment.payment_mode)}</ThemedTD>
              <ThemedTD>{payment.reference_number || "-"}</ThemedTD>
              <ThemedTD>{payment.notes || `Rs ${payment.amount?.toLocaleString("en-IN")} paid`}</ThemedTD>
              <ThemedTD>{payment.approval_status || "pending"}</ThemedTD>
              {canManage && <ThemedTD><button type="button" onClick={() => openEdit(payment)} style={{ color: "#0066cc", marginRight: 8 }}>Edit</button><input type="checkbox" aria-label={`Select payment from ${payment.hotel_name || "another hotel"} dated ${payment.payment_date || "unknown"}`} checked={selectedIds.has(payment.id)} onChange={() => togglePayment(payment.id)} /></ThemedTD>}
            </ThemedTR>
          ))}
        </tbody>
      </ThemedTable>
      {canManage && <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, padding: "8px 12px" }}>
        <span>{selectedPayments.length} selected</span>
        <button type="button" disabled={selectedPayments.length === 0} onClick={() => setDeleteOpen(true)} style={{ ...filterButtonStyle, color: "#b91c1c", opacity: selectedPayments.length ? 1 : 0.5 }}>Delete selected</button>
      </div>}
      <Dialog open={!!editingPayment} onOpenChange={open => { if (!open && !saving) setEditingPayment(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Another Hotel Payment</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} style={{ display: "grid", gap: 10, fontSize: 13 }}>
            <div>Hotel: {editingPayment?.hotel_name || "-"}</div>
            <label>Payment amount <input type="number" min="0.01" step="0.01" required value={editAmount} onChange={e => setEditAmount(e.target.value)} style={{ ...sty, width: "100%" }} /></label>
            <label>Date <input type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} style={{ ...sty, width: "100%" }} /></label>
            <label>Payment mode <select required value={editMode} onChange={e => setEditMode(e.target.value)} style={{ ...sty, width: "100%" }}>
              <option value="">--Select Mode--</option>
              {editMode && !["cash", "Cash in Bank", "upi", "net banking", "bank_transfer", "card", "credit card", "cheque"].includes(editMode) && <option value={editMode}>{paymentModeLabel(editMode)}</option>}
              <option value="cash">Cash in Hand</option><option value="Cash in Bank">Cash in Bank</option><option value="upi">UPI</option><option value="net banking">Net Banking</option><option value="bank_transfer">Bank Transfer</option><option value="card">Card</option><option value="credit card">Credit Card</option><option value="cheque">Cheque</option>
            </select></label>
            <label>Cheque / reference number <input value={editReference} onChange={e => setEditReference(e.target.value)} style={{ ...sty, width: "100%" }} /></label>
            <label>Payment detail <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} style={{ ...sty, width: "100%" }} /></label>
            {editingPayment?.approval_status?.toLowerCase() === "approved" && <p style={{ color: "#a16207" }}>Editing an approved payment returns it to pending approval.</p>}
            <button type="submit" disabled={saving} style={filterButtonStyle}>{saving ? "Saving..." : "Save changes"}</button>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete selected payments?</AlertDialogTitle><AlertDialogDescription>
            This will permanently delete {selectedPayments.length} Another Hotel payment{selectedPayments.length === 1 ? "" : "s"} totaling Rs. {selectedAmount.toLocaleString("en-IN")}/-.
            {selectedApprovedCount > 0 && ` ${selectedApprovedCount} of these are approved payments.`} Booking received and due amounts will be recalculated.
          </AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteSelected} disabled={deleting} className="bg-red-600 hover:bg-red-700">{deleting ? "Deleting..." : "Delete payments"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
