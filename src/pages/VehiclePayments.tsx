import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";
import { PartsDatePicker } from "@/components/ui/PartsDatePicker";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function VehiclePayments() {
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

  const fetchTransporters = async () => { const { data } = await supabase.from("transporters").select("id, name").order("name"); setTransporters(data || []); };

  const fetchPayments = async () => {
    const { data, error } = await supabase.from("payments").select(`*, bookings(id, booking_number, customer_name, contact_no)`).in("payment_type", ["vehicle", "another_vehicle"]).order("payment_date", { ascending: false });
    if (error) { toast.error("Failed to load vehicle payments"); } else {
      const paymentsWithDetails = await Promise.all((data || []).map(async (payment) => {
        if (payment.bookings?.id) {
          const { data: vehicleData } = await supabase.from("vehicle_bookings").select("*, transporters(name)").eq("booking_id", payment.bookings.id).limit(1);
          return { ...payment, vehicle_booking: vehicleData?.[0] || null };
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
    const matchesTransporter = !transporterFilter || payment.vehicle_booking?.transporters?.name?.toLowerCase().includes(transporterFilter.toLowerCase());
    const matchesPaymentMode = !paymentModeFilter || payment.payment_mode === paymentModeFilter;
    return matchesDate && matchesTransporter && matchesPaymentMode;
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
        <span style={legacyLabel}>Transporter :</span>
        <select value={transporterFilter} onChange={e => setTransporterFilter(e.target.value)} style={{ ...sty, minWidth: 200 }}>
          <option value="">-- Select Transporter --</option>
          {transporters.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <span style={{ marginLeft: 16, ...legacyLabel }}>Payment Mode :</span>
        <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} style={sty}>
          <option value="">---Select Mode---</option>
          <option value="Cash">Cash in Hand</option><option value="Net Banking">Net Banking</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Cheque">Cheque</option>
        </select>
        <button onClick={fetchPayments} style={legacyButton}>Search</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: "bold" }}>Total: Rs. {totalPayments.toLocaleString("en-IN")}/-</span>
      </div>
    </div>
  );

  return (
    <AdminPageShell legacyHeader title="View Vehicle Payment" filterSection={filterSection} actions={[{ label: "View All Records", onClick: () => { setTransporterFilter(""); setPaymentModeFilter(""); setSearchWithDate(false); } }]} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Transporter</ThemedTH><ThemedTH>Payment</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Payment Mode</ThemedTH></ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={5} message="No vehicle payments found" /> : paginatedItems.map((payment, index) => (
            <ThemedTR key={payment.id} index={index}>
              <ThemedTD>{startIndex + index}</ThemedTD>
              <ThemedTD>{payment.vehicle_booking?.transporters?.name || "-"}</ThemedTD>
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
