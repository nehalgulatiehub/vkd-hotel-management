import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";
import { PartsDatePicker } from "@/components/ui/PartsDatePicker";

export interface ServicePaymentsConfig {
  paymentType: string;
  title: string;
}

export function ServiceModulePayments({ config }: { config: ServicePaymentsConfig }) {
  const [payments, setPayments] = useState<any[]>([]);
  const now = new Date();
  const [from, setFrom] = useState({ month: String(now.getMonth() + 1), day: String(now.getDate()), year: String(now.getFullYear()) });
  const [to, setTo] = useState({ month: String(now.getMonth() + 1), day: String(now.getDate()), year: String(now.getFullYear()) });
  const [searchWithDate, setSearchWithDate] = useState(false);
  const [paymentModeFilter, setPaymentModeFilter] = useState("");

  useEffect(() => { fetchPayments(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [config.paymentType]);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select(`*, bookings(id, booking_number, customer_name, contact_no)`)
      .eq("payment_type", config.paymentType)
      .order("payment_date", { ascending: false });
    setPayments(data || []);
  };

  const filtered = payments.filter(p => {
    if (searchWithDate && p.payment_date) {
      const d = new Date(p.payment_date);
      const f = new Date(Number(from.year), Number(from.month) - 1, Number(from.day));
      const t = new Date(Number(to.year), Number(to.month) - 1, Number(to.day));
      if (d < f || d > t) return false;
    }
    if (paymentModeFilter && p.payment_mode !== paymentModeFilter) return false;
    return true;
  });

  const total = filtered.reduce((s, p) => s + (p.amount || 0), 0);
  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filtered);

  const filterSection = (
    <div style={{ width: "100%", fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #ccc" }}>
        <span>From :</span>
        <PartsDatePicker month={from.month} day={from.day} year={from.year} onChange={(p) => setFrom({ month: p.month, day: p.day, year: p.year })} />
        <span style={{ marginLeft: 16 }}>To :</span>
        <PartsDatePicker month={to.month} day={to.day} year={to.year} onChange={(p) => setTo({ month: p.month, day: p.day, year: p.year })} />
        <span style={{ marginLeft: 16 }}>Search with Date :</span>
        <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" checked={searchWithDate} onChange={() => setSearchWithDate(true)} /> YES</label>
        <label style={{ display: "flex", alignItems: "center", gap: 2 }}><input type="radio" checked={!searchWithDate} onChange={() => setSearchWithDate(false)} /> NO</label>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "4px 0" }}>
        <span>Payment Mode :</span>
        <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} style={filterSelectStyle}>
          <option value="">---Select Mode---</option>
          <option value="Cash">Cash in Hand</option>
          <option value="Net Banking">Net Banking</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Cheque">Cheque</option>
        </select>
        <button onClick={fetchPayments} style={filterButtonStyle}>Search</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontWeight: "bold" }}>Total: Rs. {total.toLocaleString("en-IN")}/-</span>
      </div>
    </div>
  );

  return (
    <AdminPageShell title={config.title} filterSection={filterSection} actions={[{ label: "View All Records", onClick: () => { setPaymentModeFilter(""); setSearchWithDate(false); } }]} pagination={{ currentPage, totalPages, onPageChange: goToPage, totalItems, startIndex, endIndex }}>
      <ThemedTable>
        <ThemedTHead><ThemedTH>S.No</ThemedTH><ThemedTH>Booking</ThemedTH><ThemedTH>Customer</ThemedTH><ThemedTH>Payment</ThemedTH><ThemedTH>Date</ThemedTH><ThemedTH>Payment Mode</ThemedTH></ThemedTHead>
        <tbody>
          {paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={6} message="No payments found" /> : paginatedItems.map((p, index) => (
            <ThemedTR key={p.id} index={index}>
              <ThemedTD>{startIndex + index + 1}</ThemedTD>
              <ThemedTD>{p.bookings?.booking_number || "-"}</ThemedTD>
              <ThemedTD>{p.bookings?.customer_name || "-"}</ThemedTD>
              <ThemedTD>Rs. {p.amount?.toLocaleString("en-IN")}/-</ThemedTD>
              <ThemedTD>{p.payment_date ? format(new Date(p.payment_date), "dd/MM/yyyy") : "-"}</ThemedTD>
              <ThemedTD>
                <div><strong>Payment Mode :</strong> {p.payment_mode || "-"}</div>
                <div><strong>Status :</strong> {p.approval_status || "pending"}</div>
              </ThemedTD>
            </ThemedTR>
          ))}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
