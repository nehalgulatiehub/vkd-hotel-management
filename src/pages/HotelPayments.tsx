import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";
import { PartsDatePicker } from "@/components/ui/PartsDatePicker";
import { SERVICE_PAYMENT_TYPES } from "@/utils/paymentCategories";
import { paymentModeLabel } from "@/utils/paymentMode";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function HotelPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [fromMonth, setFromMonth] = useState(months[new Date().getMonth()]);
  const [fromDay, setFromDay] = useState(new Date().getDate());
  const [fromYear, setFromYear] = useState(new Date().getFullYear());
  const [toMonth, setToMonth] = useState(months[new Date().getMonth()]);
  const [toDay, setToDay] = useState(new Date().getDate());
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [searchWithDate, setSearchWithDate] = useState(false);
  const [hotelFilter, setHotelFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");

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
      const hotelBookingsMap: Record<string, any> = {};
      if (bookingIds.length > 0) {
        const { data: hotelBookings } = await supabase
          .from("hotel_bookings")
          .select("booking_id, another_hotels:hotel_id(id, name)")
          .in("booking_id", bookingIds)
          .not("hotel_id", "is", null);
        (hotelBookings || []).forEach((hotelBooking: any) => {
          if (!hotelBookingsMap[hotelBooking.booking_id]) hotelBookingsMap[hotelBooking.booking_id] = hotelBooking;
        });
      }
      const paymentsWithDetails = (data || []).map((payment: any) => ({
        ...payment,
        hotel_name: payment.direct_hotel?.name || hotelBookingsMap[payment.booking_id]?.another_hotels?.name || null,
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
    const matchesPaymentMode = !paymentModeFilter || payment.payment_mode?.trim().toLowerCase() === paymentModeFilter;
    return matchesDate && matchesHotel && matchesPaymentMode;
  });

  const totalPayments = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments);
  const sty = filterSelectStyle;

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
        <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)} style={{ ...sty, minWidth: 200 }}>
          <option value="">--Select--</option>
          {hotels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
        </select>
        <span style={{ marginLeft: 16, ...legacyLabel }}>Payment Mode :</span>
        <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} style={sty}>
          <option value="">---Select Mode---</option>
          <option value="cash">Cash in Hand</option><option value="cash in bank">Cash in Bank</option><option value="net banking">Net Banking</option><option value="upi">UPI</option><option value="credit card">Credit Card</option><option value="cheque">Cheque</option>
        </select>
        <button onClick={fetchPayments} style={legacyButton}>Search</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: "bold" }}>Total: Rs. {totalPayments.toLocaleString("en-IN")}/-</span>
      </div>
    </div>
  );

  return (
    <AdminPageShell legacyHeader title="View Another Hotel Payment" filterSection={filterSection} actions={[{ label: "View All Records", onClick: () => { setHotelFilter(""); setPaymentModeFilter(""); setSearchWithDate(false); } }]} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Another Hotel</ThemedTH><ThemedTH>Payment</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Payment Mode</ThemedTH></ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={5} message="No hotel payments found" /> : paginatedItems.map((payment, index) => (
            <ThemedTR key={payment.id} index={index}>
              <ThemedTD>{startIndex + index}</ThemedTD>
              <ThemedTD>{payment.hotel_name || "-"}</ThemedTD>
              <ThemedTD>Rs. {payment.amount?.toLocaleString("en-IN")}/-</ThemedTD>
              <ThemedTD>{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</ThemedTD>
              <ThemedTD>
                <div><strong>Payment Mode :</strong> {paymentModeLabel(payment.payment_mode)}</div>
                <div><strong>Payment Detail :</strong> {payment.notes || `Rs ${payment.amount?.toLocaleString("en-IN")} paid`}</div>
              </ThemedTD>
            </ThemedTR>
          ))}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
