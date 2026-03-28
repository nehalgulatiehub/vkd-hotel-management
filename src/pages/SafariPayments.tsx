import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterInputStyle, filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function SafariPayments() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [payments, setPayments] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [fromMonth, setFromMonth] = useState(months[new Date().getMonth()]);
  const [fromDay, setFromDay] = useState(new Date().getDate());
  const [fromYear, setFromYear] = useState(new Date().getFullYear());
  const [toMonth, setToMonth] = useState(months[new Date().getMonth()]);
  const [toDay, setToDay] = useState(new Date().getDate());
  const [toYear, setToYear] = useState(new Date().getFullYear());
  const [searchWithDate, setSearchWithDate] = useState(false);
  const [transporterFilter, setTransporterFilter] = useState("");
  const [paymentModeFilter, setPaymentModeFilter] = useState("");

  useEffect(() => { fetchPayments(); fetchTransporters(); }, []);

  const fetchTransporters = async () => {
    const { data } = await supabase.from("transporters").select("id, name").order("name");
    setTransporters(data || []);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase.from("payments").select(`*, bookings(id, booking_number, customer_name, contact_no), transporter:transporters(id, name)`).eq("payment_type", "safari").order("payment_date", { ascending: false });
    const { data: directPayments } = await supabase.from("payments").select(`*, transporter:transporters(id, name)`).eq("payment_type", "safari_direct").order("payment_date", { ascending: false });
    if (error) { toast.error("Failed to load safari payments"); } else {
      const paymentsWithDetails = await Promise.all((data || []).map(async (payment) => {
        if (payment.bookings?.id) {
          const { data: safariData } = await supabase.from("safari_bookings").select("*").eq("booking_id", payment.bookings.id).maybeSingle();
          return { ...payment, safari_booking: safariData };
        }
        return payment;
      }));
      setPayments([...paymentsWithDetails, ...(directPayments || [])]);
    }
  };

  const filteredPayments = payments.filter(payment => {
    let matchesDate = true;
    if (searchWithDate && payment.payment_date) {
      const paymentDate = new Date(payment.payment_date);
      const fromDate = new Date(fromYear, months.indexOf(fromMonth), fromDay);
      const toDate = new Date(toYear, months.indexOf(toMonth), toDay);
      matchesDate = paymentDate >= fromDate && paymentDate <= toDate;
    }
    const matchesTransporter = !transporterFilter || payment.safari_booking?.safari_name?.toLowerCase().includes(transporterFilter.toLowerCase());
    const matchesPaymentMode = !paymentModeFilter || payment.payment_mode === paymentModeFilter;
    return matchesDate && matchesTransporter && matchesPaymentMode;
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
        <span>Transporter :</span>
        <select value={transporterFilter} onChange={e => setTransporterFilter(e.target.value)} style={{ ...sty, minWidth: 200 }}>
          <option value="">-- Select Transporter --</option>
          {transporters.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <span style={{ marginLeft: 16 }}>Payment Mode :</span>
        <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} style={sty}>
          <option value="">---Select Mode---</option>
          <option value="Cash">Cash in Hand</option>
          <option value="Net Banking">Net Banking</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Cheque">Cheque</option>
        </select>
        <button onClick={fetchPayments} style={filterButtonStyle}>Search</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: "bold" }}>Total: Rs. {totalPayments.toLocaleString("en-IN")}/-</span>
      </div>
    </div>
  );

  return (
    <AdminPageShell title="Safari Payment" filterSection={filterSection} actions={[{ label: "View All Records", onClick: () => {} }]} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Transporter</ThemedTH><ThemedTH>Payment</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Payment Mode</ThemedTH></ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={5} message="No safari payments found" /> : paginatedItems.map((payment, index) => (
            <ThemedTR key={payment.id} index={index}>
              <ThemedTD>{startIndex + index + 1}</ThemedTD>
              <ThemedTD>{payment.transporter?.name || payment.safari_booking?.safari_name || "-"}</ThemedTD>
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
