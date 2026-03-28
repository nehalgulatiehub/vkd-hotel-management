import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";

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
    const { data, error } = await supabase.from("payments").select(`*, bookings(id, booking_number, customer_name, contact_no)`).eq("payment_type", "hotel").order("payment_date", { ascending: false });
    if (error) { toast.error("Failed to load hotel payments"); } else {
      const paymentsWithDetails = await Promise.all((data || []).map(async (payment) => {
        if (payment.bookings?.id) {
          const { data: hotelData } = await supabase.from("hotel_bookings").select("*, another_hotels:hotel_id(name)").eq("booking_id", payment.bookings.id).not("hotel_id", "is", null).maybeSingle();
          return { ...payment, hotel_booking: hotelData };
        }
        return payment;
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
    const matchesHotel = !hotelFilter || payment.hotel_booking?.another_hotels?.name?.toLowerCase().includes(hotelFilter.toLowerCase());
    const matchesPaymentMode = !paymentModeFilter || payment.payment_mode === paymentModeFilter;
    return matchesDate && matchesHotel && matchesPaymentMode;
  });

  const totalPayments = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredPayments);
  const sty = filterSelectStyle;

  const filterSection = (
    <div style={{ width: "100%", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #ccc" }}>
        <span>From :</span>
        <select value={fromMonth} onChange={e => setFromMonth(e.target.value)} style={sty}>{months.map(m => <option key={m}>{m}</option>)}</select>
        <select value={fromDay} onChange={e => setFromDay(Number(e.target.value))} style={sty}>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
        <select value={fromYear} onChange={e => setFromYear(Number(e.target.value))} style={sty}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
        <span style={{ marginLeft: 16 }}>To :</span>
        <select value={toMonth} onChange={e => setToMonth(e.target.value)} style={sty}>{months.map(m => <option key={m}>{m}</option>)}</select>
        <select value={toDay} onChange={e => setToDay(Number(e.target.value))} style={sty}>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
        <select value={toYear} onChange={e => setToYear(Number(e.target.value))} style={sty}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
        <span style={{ marginLeft: 16 }}>Search with Date :</span>
        <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" checked={searchWithDate} onChange={() => setSearchWithDate(true)} /> YES</label>
        <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" checked={!searchWithDate} onChange={() => setSearchWithDate(false)} /> NO</label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "4px 0" }}>
        <span>Another Hotel :</span>
        <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)} style={{ ...sty, minWidth: 200 }}>
          <option value="">--Select--</option>
          {hotels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
        </select>
        <span style={{ marginLeft: 16 }}>Payment Mode :</span>
        <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} style={sty}>
          <option value="">---Select Mode---</option>
          <option value="Cash">Cash in Hand</option><option value="Net Banking">Net Banking</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Cheque">Cheque</option>
        </select>
        <button onClick={fetchPayments} style={filterButtonStyle}>Search</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: "bold" }}>Total: Rs. {totalPayments.toLocaleString("en-IN")}/-</span>
      </div>
    </div>
  );

  return (
    <AdminPageShell title="Another Hotel Payment" filterSection={filterSection} actions={[{ label: "View All Records", onClick: () => {} }]} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Another Hotel</ThemedTH><ThemedTH>Payment</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Payment Mode</ThemedTH></ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={5} message="No hotel payments found" /> : paginatedItems.map((payment, index) => (
            <ThemedTR key={payment.id} index={index}>
              <ThemedTD>{startIndex + index + 1}</ThemedTD>
              <ThemedTD>{payment.hotel_booking?.another_hotels?.name || "-"}</ThemedTD>
              <ThemedTD>Rs. {payment.amount?.toLocaleString("en-IN")}/-</ThemedTD>
              <ThemedTD>{payment.payment_date ? format(new Date(payment.payment_date), "dd/MM/yyyy") : "-"}</ThemedTD>
              <ThemedTD>
                <div><strong>Payment Mode :</strong> {payment.payment_mode || "-"}</div>
                <div><strong>Payment Detail :</strong> {payment.notes || `Rs ${payment.amount?.toLocaleString("en-IN")} paid`}</div>
              </ThemedTD>
            </ThemedTR>
          ))}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
