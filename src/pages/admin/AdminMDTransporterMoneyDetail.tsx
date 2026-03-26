import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const years = ["2024", "2025", "2026", "2027"];

export default function AdminMDTransporterMoneyDetail() {
  const [volvoBookings, setVolvoBookings] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const paymentDialog = usePaymentDialog(() => fetchVolvoBookings());
  const today = new Date();
  const [fromMonth, setFromMonth] = useState(months[today.getMonth()]);
  const [fromDay, setFromDay] = useState(String(today.getDate()).padStart(2, "0"));
  const [fromYear, setFromYear] = useState(String(today.getFullYear()));
  const [toMonth, setToMonth] = useState(months[today.getMonth()]);
  const [toDay, setToDay] = useState(String(today.getDate()).padStart(2, "0"));
  const [toYear, setToYear] = useState(String(today.getFullYear()));
  const [searchWithDate, setSearchWithDate] = useState(false);
  const [transporterId, setTransporterId] = useState("");
  const [userId, setUserId] = useState("");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<any>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);

  useEffect(() => { fetchVolvoBookings(); fetchTransporters(); fetchUsers(); }, []);
  const fetchTransporters = async () => { const { data } = await supabase.from("transporters").select("id, name").order("name"); setTransporters(data || []); };
  const fetchUsers = async () => { const { data } = await supabase.from("profiles").select("id, username, first_name, last_name").order("username"); setUsers(data || []); };
  const getUserName = (uid: string | null | undefined) => { if (!uid) return "Unknown User"; const user = users.find(u => u.id === uid); if (!user) return "Unknown User"; return user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || "Unknown User"; };

  const fetchVolvoBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("volvo_bookings" as any).select(`*, bookings(id, booking_number, customer_name, email, status, contact_no, booking_type, created_at, notes, agent_id, created_by, total_amount, paid_amount, due_amount), transporter:transporters(id, name)`).eq("route_type", "manali_delhi").order("journey_date", { ascending: false });
    if (error) toast.error("Failed to load volvo bookings"); else setVolvoBookings(data || []);
    setLoading(false);
  };

  const handleViewDetails = (booking: any) => { setSelectedBookingData(booking.bookings); setSelectedServiceData(booking); setShowDetailsDialog(true); };
  const getMonthIndex = (monthName: string) => months.indexOf(monthName) + 1;

  const filteredBookings = volvoBookings.filter(booking => {
    if (searchWithDate) { const d = new Date(booking.journey_date); const f = new Date(`${fromYear}-${String(getMonthIndex(fromMonth)).padStart(2,"0")}-${fromDay}`); const t = new Date(`${toYear}-${String(getMonthIndex(toMonth)).padStart(2,"0")}-${toDay}`); if (d < f || d > t) return false; }
    if (transporterId && booking.transporter_id !== transporterId) return false;
    if (userId && booking.bookings?.created_by !== userId) return false;
    return true;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings);

  const filterSection = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1"><span>From :</span>
          <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="border px-1 py-0.5 text-xs">{months.map(m => <option key={m}>{m}</option>)}</select>
          <select value={fromDay} onChange={(e) => setFromDay(e.target.value)} className="border px-1 py-0.5 text-xs">{days.map(d => <option key={d}>{d}</option>)}</select>
          <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className="border px-1 py-0.5 text-xs">{years.map(y => <option key={y}>{y}</option>)}</select>
        </div>
        <div className="flex items-center gap-1"><span>To :</span>
          <select value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="border px-1 py-0.5 text-xs">{months.map(m => <option key={m}>{m}</option>)}</select>
          <select value={toDay} onChange={(e) => setToDay(e.target.value)} className="border px-1 py-0.5 text-xs">{days.map(d => <option key={d}>{d}</option>)}</select>
          <select value={toYear} onChange={(e) => setToYear(e.target.value)} className="border px-1 py-0.5 text-xs">{years.map(y => <option key={y}>{y}</option>)}</select>
        </div>
        <div className="flex items-center gap-2"><span>Search with Date :</span>
          <label className="flex items-center gap-1"><input type="radio" checked={searchWithDate} onChange={() => setSearchWithDate(true)} /> YES</label>
          <label className="flex items-center gap-1"><input type="radio" checked={!searchWithDate} onChange={() => setSearchWithDate(false)} /> NO</label>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1"><span>Transporter :</span>
          <select value={transporterId} onChange={(e) => setTransporterId(e.target.value)} className="border px-1 py-0.5 text-xs min-w-[200px]"><option value="">--Select--</option>{transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </div>
        <div className="flex items-center gap-1"><span>User :</span>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} className="border px-1 py-0.5 text-xs"><option value="">--Select--</option>{users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}</select>
        </div>
        <button className="border px-3 py-0.5 text-xs bg-gray-100 hover:bg-gray-200">Search</button>
      </div>
    </div>
  );

  return (
    <>
      <AdminPageShell title="View M-D Transporter Money Detail" actions={[{ label: "View All Records", onClick: () => {} }]} filterSection={filterSection} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
        {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
          <ThemedTable>
            <ThemedTHead><ThemedTH>S.no</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Customer Name</ThemedTH><ThemedTH>Transporter</ThemedTH><ThemedTH>M-D Volvo Journey Date</ThemedTH><ThemedTH>Booking Price</ThemedTH><ThemedTH>User</ThemedTH><ThemedTH>Action</ThemedTH></ThemedTHead>
            <tbody>
              {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={8} message="No M-D volvo bookings found" /> : paginatedItems.map((booking, idx) => (
                <ThemedTR key={booking.id} index={idx}>
                  <ThemedTD>{startIndex + idx + 1}</ThemedTD>
                  <ThemedTD>{booking.bookings?.created_at ? format(new Date(booking.bookings.created_at), "dd/MM/yyyy") : "-"}</ThemedTD>
                  <ThemedTD>{booking.bookings?.customer_name || "-"}</ThemedTD>
                  <ThemedTD>{booking.transporter?.name || "-"}</ThemedTD>
                  <ThemedTD>{booking.journey_date ? format(new Date(booking.journey_date), "dd/MM/yyyy") : "-"}</ThemedTD>
                  <ThemedTD>M - D Booking Price : Rs {(booking.total_amount || 0).toLocaleString('en-IN')} /-</ThemedTD>
                  <ThemedTD>{getUserName(booking.bookings?.created_by)}</ThemedTD>
                  <ThemedTD>
                    <div className="flex flex-col gap-0.5 text-[#c00] text-[10px]">
                      <button className="hover:underline text-left" onClick={() => handleViewDetails(booking)}>View Booking</button>
                      <button className="hover:underline text-left" onClick={() => booking.bookings && paymentDialog.handleViewPayment(booking.bookings, { type: 'volvo_md', id: booking.id })}>View Payment</button>
                      <button className="hover:underline text-left" onClick={() => booking.bookings && paymentDialog.handleAddPayment(booking.bookings, { type: 'volvo_md', id: booking.id })}>Add Payment</button>
                      <button className="hover:underline text-left">View Refund Payment</button>
                    </div>
                  </ThemedTD>
                </ThemedTR>
              ))}
            </tbody>
          </ThemedTable>
        )}
      </AdminPageShell>
      <BookingDetailsDialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog} booking={selectedBookingData} serviceType="volvo_md" serviceData={selectedServiceData} />
      <PaymentDialogs showViewPaymentDialog={paymentDialog.showViewPaymentDialog} setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog} showPaymentDialog={paymentDialog.showPaymentDialog} setShowPaymentDialog={paymentDialog.setShowPaymentDialog} selectedBooking={paymentDialog.selectedBooking} bookingPayments={paymentDialog.bookingPayments} paymentAmount={paymentDialog.paymentAmount} setPaymentAmount={paymentDialog.setPaymentAmount} paymentMode={paymentDialog.paymentMode} setPaymentMode={paymentDialog.setPaymentMode} paymentReference={paymentDialog.paymentReference} setPaymentReference={paymentDialog.setPaymentReference} isSubmittingPayment={paymentDialog.isSubmittingPayment} onSubmitPayment={paymentDialog.submitPayment} />
    </>
  );
}
