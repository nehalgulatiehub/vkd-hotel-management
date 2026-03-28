import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle } from "@/components/admin/AdminPageShell";

interface TransporterSummary {
  transporter_id: string;
  transporter_name: string;
  total_transport_amount: number;
  total_paid: number;
  outstanding: number;
}

export default function ViewManaliDelhiDue() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [summaries, setSummaries] = useState<TransporterSummary[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransporter, setSelectedTransporter] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) { fetchTransporters(); fetchData(); }
  }, [authLoading, canManage]);

  const fetchTransporters = async () => {
    const { data } = await supabase.from("transporters").select("id, name").order("name");
    setTransporters(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: volvoData } = await supabase.from("volvo_bookings").select("id, booking_id, total_amount, paid_amount, due_amount, notes").eq("route", "Manali-Delhi");
      const { data: payments } = await supabase.from("payments").select("transporter_id, amount, approval_status").eq("payment_type", "manali_delhi").not("transporter_id", "is", null);
      const totalVolvoAmount = (volvoData || []).reduce((sum, v) => sum + (v.total_amount || 0), 0);
      const transporterMap: Record<string, { paid: number }> = {};
      (payments || []).forEach(p => {
        if (!p.transporter_id) return;
        if (!transporterMap[p.transporter_id]) transporterMap[p.transporter_id] = { paid: 0 };
        if (p.approval_status === "approved" || p.approval_status === "Approved") transporterMap[p.transporter_id].paid += p.amount || 0;
      });
      const { data: transportersList } = await supabase.from("transporters").select("id, name");
      const tMap = new Map((transportersList || []).map(t => [t.id, t.name]));
      const results: TransporterSummary[] = [];
      for (const [tId, info] of Object.entries(transporterMap)) {
        results.push({ transporter_id: tId, transporter_name: tMap.get(tId) || "Unknown", total_transport_amount: totalVolvoAmount, total_paid: info.paid, outstanding: info.paid - totalVolvoAmount });
      }
      if (results.length === 0 && totalVolvoAmount > 0) {
        const totalPaid = (volvoData || []).reduce((sum, v) => sum + (v.paid_amount || 0), 0);
        results.push({ transporter_id: "aggregate", transporter_name: "All MD Transporters", total_transport_amount: totalVolvoAmount, total_paid: totalPaid, outstanding: totalPaid - totalVolvoAmount });
      }
      setSummaries(results);
    } catch (error) { console.error("Error fetching MD due data:", error); }
    finally { setLoading(false); }
  };

  const filteredSummaries = summaries.filter(s => !selectedTransporter || s.transporter_id === selectedTransporter);
  const pagination = usePagination(filteredSummaries);

  if (authLoading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label style={{ fontSize: 11, minWidth: 80, textAlign: "right" }}>Transporter :</label>
      <select value={selectedTransporter} onChange={(e) => setSelectedTransporter(e.target.value)} style={{ ...filterSelectStyle, minWidth: 200 }}>
        <option value="">--Select--</option>
        {transporters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </div>
  );

  return (
    <AdminPageShell
      title="Due MD Transporter Payment"
      actions={[{ label: "View All Records", onClick: () => setSelectedTransporter("") }]}
      filterSection={filterSection}
      pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}
    >
      {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
        <ThemedTable>
          <ThemedTHead>
            <ThemedTH>S.No.</ThemedTH>
            <ThemedTH>Transporter</ThemedTH>
            <ThemedTH>Total Paid</ThemedTH>
            <ThemedTH>Total Transport Amount</ThemedTH>
            <ThemedTH>Outstanding</ThemedTH>
            <ThemedTH>Action</ThemedTH>
          </ThemedTHead>
          <tbody>
            {pagination.paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={6} message="No records found" /> : pagination.paginatedItems.map((summary, index) => (
              <ThemedTR key={summary.transporter_id} index={index}>
                <ThemedTD>{pagination.startIndex + index + 1}</ThemedTD>
                <ThemedTD>{summary.transporter_name}</ThemedTD>
                <ThemedTD>Rs {summary.total_paid.toLocaleString("en-IN")}</ThemedTD>
                <ThemedTD>Rs {summary.total_transport_amount.toLocaleString("en-IN")}</ThemedTD>
                <ThemedTD>Rs {summary.outstanding.toLocaleString("en-IN")}</ThemedTD>
                <ThemedTD>
                  <span onClick={() => navigate(`/admin/md-transporter-money?transporter=${summary.transporter_id}`)} style={{ color: "#c00", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>View</span>
                </ThemedTD>
              </ThemedTR>
            ))}
          </tbody>
        </ThemedTable>
      )}
    </AdminPageShell>
  );
}
