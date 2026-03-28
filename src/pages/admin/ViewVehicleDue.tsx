import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle } from "@/components/admin/AdminPageShell";

interface TransporterDueSummary {
  transporter_id: string;
  transporter_name: string;
  due_amount: number;
}

export default function ViewVehicleDue() {
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [summaries, setSummaries] = useState<TransporterDueSummary[]>([]);
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
      const { data, error } = await supabase.from("vehicle_bookings").select("transporter_id, total_amount, paid_amount, due_amount, transporters(name)").not("transporter_id", "is", null);
      if (error) throw error;
      const grouped: Record<string, { name: string; due: number }> = {};
      (data || []).forEach((vb: any) => {
        const tId = vb.transporter_id;
        if (!tId) return;
        if (!grouped[tId]) grouped[tId] = { name: vb.transporters?.name || "Unknown", due: 0 };
        grouped[tId].due += (vb.due_amount || 0);
      });
      setSummaries(Object.entries(grouped).map(([id, info]) => ({ transporter_id: id, transporter_name: info.name, due_amount: info.due })).sort((a, b) => a.transporter_name.localeCompare(b.transporter_name)));
    } catch (error) { console.error("Error fetching vehicle due data:", error); }
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
      title="Due Amount Transporter"
      actions={[{ label: "View All Records", onClick: () => setSelectedTransporter("") }]}
      filterSection={filterSection}
      pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}
    >
      {loading ? <div style={{ textAlign: "center", padding: 32, color: "#999" }}>Loading...</div> : (
        <ThemedTable>
          <ThemedTHead>
            <ThemedTH>Transporter</ThemedTH>
            <ThemedTH>Due Amount</ThemedTH>
          </ThemedTHead>
          <tbody>
            {pagination.paginatedItems.length === 0 ? <ThemedEmptyRow colSpan={2} message="No records found" /> : pagination.paginatedItems.map((summary, index) => (
              <ThemedTR key={summary.transporter_id} index={index}>
                <ThemedTD>{summary.transporter_name}</ThemedTD>
                <ThemedTD>Rs {summary.due_amount.toLocaleString("en-IN")} /-</ThemedTD>
              </ThemedTR>
            ))}
          </tbody>
        </ThemedTable>
      )}
    </AdminPageShell>
  );
}
