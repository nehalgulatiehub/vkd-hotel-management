import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { usePaymentDialog } from "@/hooks/usePaymentDialog";
import { PaymentDialogs } from "@/components/payment/PaymentDialogs";
import { BookingDetailsDialog } from "@/components/booking/BookingDetailsDialog";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const years = ["2024", "2025", "2026", "2027"];

export default function AdminDMTransporterMoneyDetail() {
  const [volvoBookings, setVolvoBookings] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const paymentDialog = usePaymentDialog(() => fetchVolvoBookings());

  // Filters
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

  // Dialog states
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedServiceData, setSelectedServiceData] = useState<any>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);

  useEffect(() => {
    fetchVolvoBookings();
    fetchTransporters();
    fetchUsers();
  }, []);

  const fetchTransporters = async () => {
    const { data } = await supabase.from("transporters").select("id, name").order("name");
    setTransporters(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, first_name, last_name").order("first_name");
    setUsers(data || []);
  };

  const fetchVolvoBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("volvo_bookings" as any)
      .select(`
        *,
        bookings(id, booking_number, customer_name, email, status, contact_no, booking_type, created_at, notes, agent_id, created_by, total_amount, paid_amount, due_amount),
        transporter:transporters(id, name)
      `)
      .eq("route_type", "delhi_manali")
      .order("journey_date", { ascending: false });
    if (error) {
      toast.error("Failed to load volvo bookings");
    } else {
      setVolvoBookings(data || []);
    }
    setLoading(false);
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBookingData(booking.bookings);
    setSelectedServiceData(booking);
    setShowDetailsDialog(true);
  };

  const getMonthIndex = (monthName: string) => months.indexOf(monthName) + 1;

  const filteredBookings = volvoBookings.filter(booking => {
    if (searchWithDate) {
      const journeyDate = new Date(booking.journey_date);
      const fromDate = new Date(`${fromYear}-${String(getMonthIndex(fromMonth)).padStart(2, "0")}-${fromDay}`);
      const toDate = new Date(`${toYear}-${String(getMonthIndex(toMonth)).padStart(2, "0")}-${toDay}`);
      if (journeyDate < fromDate || journeyDate > toDate) return false;
    }
    if (transporterId && booking.transporter_id !== transporterId) return false;
    if (userId && booking.bookings?.created_by !== userId) return false;
    return true;
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredBookings);

  return (
    <div className="min-h-screen bg-background">
      <main className="p-2">
        <div className="flex justify-between items-center mb-2 px-3 py-2" style={{ backgroundColor: "#1e6e99" }}>
          <h2 className="text-white font-semibold text-sm">View D-M Transporter Money Detail</h2>
          <button className="bg-[#1e6e99] text-white text-sm px-3 py-1 border border-white hover:bg-[#155a80]">View All Records</button>
        </div>

        {/* Search Section */}
        <div className="border border-[#c99] mb-2">
          <div className="bg-[#8B1538] text-white px-3 py-1 text-sm font-semibold">Search</div>
          <div className="p-2 bg-white space-y-2">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span>From :</span>
                <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="border px-1 py-0.5 text-xs">
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={fromDay} onChange={(e) => setFromDay(e.target.value)} className="border px-1 py-0.5 text-xs">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className="border px-1 py-0.5 text-xs">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span>To :</span>
                <select value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="border px-1 py-0.5 text-xs">
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={toDay} onChange={(e) => setToDay(e.target.value)} className="border px-1 py-0.5 text-xs">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={toYear} onChange={(e) => setToYear(e.target.value)} className="border px-1 py-0.5 text-xs">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span>Search with Date :</span>
                <label className="flex items-center gap-1"><input type="radio" checked={searchWithDate} onChange={() => setSearchWithDate(true)} /> YES</label>
                <label className="flex items-center gap-1"><input type="radio" checked={!searchWithDate} onChange={() => setSearchWithDate(false)} /> NO</label>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span>Transporter :</span>
                <select value={transporterId} onChange={(e) => setTransporterId(e.target.value)} className="border px-1 py-0.5 text-xs min-w-[200px]">
                  <option value="">--Select--</option>
                  {transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <span>User :</span>
                <select value={userId} onChange={(e) => setUserId(e.target.value)} className="border px-1 py-0.5 text-xs">
                  <option value="">--Select--</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                </select>
              </div>
              <button className="border px-3 py-0.5 text-xs bg-gray-100 hover:bg-gray-200">Search</button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#D4A59A" }}>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">S.no</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Date</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Customer Name</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Transporter</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">D- M Volvo Journey Date</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Booking Price</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">User</th>
                  <th className="border border-[#c99] px-2 py-1.5 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((booking, idx) => (
                  <tr key={booking.id} style={{ backgroundColor: "#F5E6E0" }}>
                    <td className="border border-[#c99] px-2 py-2">{startIndex + idx + 1}</td>
                    <td className="border border-[#c99] px-2 py-2">
                      {booking.bookings?.created_at ? format(new Date(booking.bookings.created_at), "yyyy-MM-dd") : "-"}
                    </td>
                    <td className="border border-[#c99] px-2 py-2">{booking.bookings?.customer_name || "-"}</td>
                    <td className="border border-[#c99] px-2 py-2">{booking.transporter?.name || "-"}</td>
                    <td className="border border-[#c99] px-2 py-2">
                      {booking.journey_date ? format(new Date(booking.journey_date), "dd/MM/yyyy") : "-"}
                    </td>
                    <td className="border border-[#c99] px-2 py-2">
                      D - M Booking Price : Rs {(booking.total_amount || 0).toLocaleString('en-IN')} /-
                    </td>
                    <td className="border border-[#c99] px-2 py-2">
                      {users.find(u => u.id === booking.bookings?.created_by)?.first_name || "Company"}
                    </td>
                    <td className="border border-[#c99] px-2 py-2">
                      <div className="flex flex-col gap-0.5 text-[#c00] text-[10px]">
                        <button className="hover:underline text-left" onClick={() => handleViewDetails(booking)}>View Booking</button>
                        <button className="hover:underline text-left" onClick={() => booking.bookings && paymentDialog.handleViewPayment(booking.bookings, { type: 'volvo_dm', id: booking.id })}>View Payment</button>
                        <button className="hover:underline text-left" onClick={() => booking.bookings && paymentDialog.handleAddPayment(booking.bookings, { type: 'volvo_dm', id: booking.id })}>Add Payment</button>
                        <button className="hover:underline text-left">View Refund Payment</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filteredBookings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No D-M volvo bookings found</div>
          )}
        </div>

        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} totalItems={totalItems} startIndex={startIndex} endIndex={endIndex} />
      </main>

      <BookingDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        booking={selectedBookingData}
        serviceType="volvo_dm"
        serviceData={selectedServiceData}
      />

      <PaymentDialogs
        showViewPaymentDialog={paymentDialog.showViewPaymentDialog}
        setShowViewPaymentDialog={paymentDialog.setShowViewPaymentDialog}
        showPaymentDialog={paymentDialog.showPaymentDialog}
        setShowPaymentDialog={paymentDialog.setShowPaymentDialog}
        selectedBooking={paymentDialog.selectedBooking}
        bookingPayments={paymentDialog.bookingPayments}
        paymentAmount={paymentDialog.paymentAmount}
        setPaymentAmount={paymentDialog.setPaymentAmount}
        paymentMode={paymentDialog.paymentMode}
        setPaymentMode={paymentDialog.setPaymentMode}
        paymentReference={paymentDialog.paymentReference}
        setPaymentReference={paymentDialog.setPaymentReference}
        isSubmittingPayment={paymentDialog.isSubmittingPayment}
        onSubmitPayment={paymentDialog.submitPayment}
      />
    </div>
  );
}
