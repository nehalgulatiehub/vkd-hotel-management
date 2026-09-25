import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";
import { PartsDatePicker } from "@/components/ui/PartsDatePicker";
import { TablePagination } from "@/components/ui/TablePagination";
import { SERVICE_PAYMENT_TYPES } from "@/utils/paymentCategories";
import { matchesPaymentMode, paymentModeLabel } from "@/utils/paymentMode";
import { useAuthContext } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";
import "./HotelPayments.css";

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

  return (
    <div className="hotel-payments-page">
      <h1 className="sr-only">View Another Hotel Payment</h1>
      <section className="hotel-payments-search" aria-label="Search another hotel payments">
        <div className="hotel-payments-search-header">
          <strong>Search</strong>
          <button type="button" onClick={() => { setHotelFilter(""); setPaymentModeFilter(""); setChequeFilter(""); setSearchWithDate(false); clearSelection(); }}>View All Records</button>
        </div>
        <div className="hotel-payments-search-body">
          <div className="hotel-payments-date-row">
            <div className="hotel-payments-field"><span>From :</span><PartsDatePicker month={String(months.indexOf(fromMonth) + 1)} day={String(fromDay)} year={String(fromYear)} onChange={p => { setFromMonth(months[Number(p.month) - 1] || fromMonth); setFromDay(Number(p.day)); setFromYear(Number(p.year)); }} /></div>
            <div className="hotel-payments-field"><span>To :</span><PartsDatePicker month={String(months.indexOf(toMonth) + 1)} day={String(toDay)} year={String(toYear)} onChange={p => { setToMonth(months[Number(p.month) - 1] || toMonth); setToDay(Number(p.day)); setToYear(Number(p.year)); }} /></div>
            <div className="hotel-payments-field hotel-payments-date-choice"><span>Search with Date :</span><label><input type="radio" name="hotel-payment-search-date" checked={searchWithDate} onChange={() => setSearchWithDate(true)} /> YES</label><label><input type="radio" name="hotel-payment-search-date" checked={!searchWithDate} onChange={() => setSearchWithDate(false)} /> NO</label></div>
          </div>
          <div className="hotel-payments-filter-row">
            <label className="hotel-payments-field">Another Hotel : <select value={hotelFilter} onChange={e => { setHotelFilter(e.target.value); clearSelection(); }}><option value="">--Select--</option>{hotels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}</select></label>
            <label className="hotel-payments-field">Cheque No <input value={chequeFilter} onChange={e => { setChequeFilter(e.target.value); clearSelection(); }} /></label>
            <label className="hotel-payments-field">Payment Mode : <select value={paymentModeFilter} onChange={e => { setPaymentModeFilter(e.target.value); clearSelection(); }}><option value="">---Select Mode---</option><option value="cash">Cash in Hand</option><option value="cash in bank">Cash in Bank</option><option value="net banking">Net Banking</option><option value="bank_transfer">Bank Transfer</option><option value="upi">UPI</option><option value="card">Card</option><option value="credit card">Credit Card</option><option value="cheque">Cheque</option></select></label>
            <button type="button" className="hotel-payments-search-button" onClick={fetchPayments}>Search</button>
          </div>
        </div>
      </section>
      <div className="hotel-payments-table-wrap">
        <table className="hotel-payments-table">
          <colgroup><col className="hotel-payments-col-number" /><col className="hotel-payments-col-date" /><col className="hotel-payments-col-hotel" /><col className="hotel-payments-col-payment" /><col className="hotel-payments-col-mode" /><col className="hotel-payments-col-cheque" /><col className="hotel-payments-col-detail" />{canManage && <><col className="hotel-payments-col-action" /><col className="hotel-payments-col-select" /></>}</colgroup>
          <thead><tr><th>S.No.</th><th>Date</th><th>Hotel</th><th>Payment</th><th>Payment Mode</th><th>Cheque No</th><th>Payment detail</th>{canManage && <><th>Action</th><th><input type="checkbox" aria-label="Select all visible payments" checked={allVisibleSelected} onChange={toggleVisible} /></th></>}</tr></thead>
          <tbody>
            {paginatedItems.length === 0 ? <tr><td colSpan={canManage ? 9 : 7} className="hotel-payments-empty">No hotel payments found</td></tr> : paginatedItems.map((payment, index) => (
              <tr key={payment.id}>
                <td>{startIndex + index}</td>
                <td>{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</td>
                <td>{payment.hotel_name || "-"}</td>
                <td>Rs {payment.amount?.toLocaleString("en-IN")} /-</td>
                <td>{paymentModeLabel(payment.payment_mode)}</td>
                <td>{payment.reference_number || ""}</td>
                <td>{payment.notes || `Rs ${payment.amount?.toLocaleString("en-IN")} paid`}</td>
                {canManage && <><td><button type="button" className="hotel-payments-edit" onClick={() => openEdit(payment)}>Edit</button></td><td><input type="checkbox" aria-label={`Select payment from ${payment.hotel_name || "another hotel"} dated ${payment.payment_date || "unknown"}`} checked={selectedIds.has(payment.id)} onChange={() => togglePayment(payment.id)} /></td></>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hotel-payments-footer"><span>Total: Rs. {totalPayments.toLocaleString("en-IN")}/-</span>{canManage && <><span>{selectedPayments.length} selected</span><button type="button" disabled={selectedPayments.length === 0} onClick={() => setDeleteOpen(true)}>Delete selected</button></>}</div>
      {totalPages > 1 && <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={page => { clearSelection(); goToPage(page); }} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />}
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
    </div>
  );
}
