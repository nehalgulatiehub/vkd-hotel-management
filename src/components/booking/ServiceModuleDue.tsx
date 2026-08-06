import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterInputStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";

export interface ServiceDueConfig {
  table: string;
  nameField: string;
  dateField: string;
  title: string;
  label: string;
}

export function ServiceModuleDue({ config }: { config: ServiceDueConfig }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  useEffect(() => { fetchRows(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [config.table]);

  const fetchRows = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from(config.table)
      .select(`*, bookings(booking_number, customer_name, contact_no)`)
      .gt("due_amount", 0)
      .order(config.dateField, { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  const filtered = rows.filter(r => {
    if (nameFilter && !String(r[config.nameField] || "").toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (customerFilter && !String(r.bookings?.customer_name || "").toLowerCase().includes(customerFilter.toLowerCase())) return false;
    return true;
  });

  const pagination = usePagination(filtered);
  const totalDue = filtered.reduce((s, r) => s + (r.due_amount || 0), 0);

  const filterSection = (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 11 }}>
      <span>{config.label} Name :</span>
      <input value={nameFilter} onChange={e => setNameFilter(e.target.value)} style={filterInputStyle} />
      <span style={{ marginLeft: 12 }}>Customer :</span>
      <input value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} style={filterInputStyle} />
      <button onClick={fetchRows} style={filterButtonStyle}>Search</button>
      <span style={{ flex: 1 }} />
      <span style={{ fontWeight: "bold" }}>Total Due: Rs. {totalDue.toLocaleString("en-IN")}/-</span>
    </div>
  );

  return (
    <AdminPageShell
      title={config.title}
      filterSection={filterSection}
      actions={[{ label: "View All Records", onClick: () => { setNameFilter(""); setCustomerFilter(""); } }]}
      pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}
    >
      {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
        <ThemedTable>
          <ThemedTHead>
            <ThemedTH>S.No</ThemedTH>
            <ThemedTH>Booking</ThemedTH>
            <ThemedTH>Customer</ThemedTH>
            <ThemedTH>{config.label} Name</ThemedTH>
            <ThemedTH>Total Amount</ThemedTH>
            <ThemedTH>Received</ThemedTH>
            <ThemedTH>Due Amount</ThemedTH>
          </ThemedTHead>
          <tbody>
            {pagination.paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={7} message="No records found" /> : pagination.paginatedItems.map((r, index) => (
              <ThemedTR key={r.id} index={index}>
                <ThemedTD>{pagination.startIndex + index}</ThemedTD>
                <ThemedTD>{r.bookings?.booking_number || "-"}</ThemedTD>
                <ThemedTD>{r.bookings?.customer_name || "-"}</ThemedTD>
                <ThemedTD>{r[config.nameField] || "-"}</ThemedTD>
                <ThemedTD>Rs {(r.total_amount || 0).toLocaleString("en-IN")} /-</ThemedTD>
                <ThemedTD>Rs {(r.paid_amount || 0).toLocaleString("en-IN")} /-</ThemedTD>
                <ThemedTD>Rs {(r.due_amount || 0).toLocaleString("en-IN")} /-</ThemedTD>
              </ThemedTR>
            ))}
          </tbody>
        </ThemedTable>
      )}
    </AdminPageShell>
  );
}
