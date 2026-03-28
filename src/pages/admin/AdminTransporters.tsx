import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterInputStyle } from "@/components/admin/AdminPageShell";
import * as XLSX from "xlsx";

interface Transporter {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city_id: string | null;
  vehicle_types: string[] | null;
  notes: string | null;
  city?: { name: string } | null;
}

export default function AdminTransporters() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) fetchTransporters();
  }, [authLoading, canManage]);

  const fetchTransporters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("transporters").select("*, city:cities(name)").order("name");
      if (error) throw error;
      setTransporters(data || []);
    } catch (error) {
      console.error("Error fetching transporters:", error);
      toast.error("Failed to fetch transporters");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transporter?")) return;
    try {
      const { error } = await supabase.from("transporters").delete().eq("id", id);
      if (error) throw error;
      toast.success("Transporter deleted successfully");
      fetchTransporters();
    } catch (error) {
      console.error("Error deleting transporter:", error);
      toast.error("Failed to delete transporter");
    }
  };

  const handleExport = () => {
    const exportData = transporters.map(t => ({
      Name: t.name, Company: t.company_name || "", Phone: t.phone || "",
      Email: t.email || "", Address: t.address || "", City: t.city?.name || "",
      "Vehicle Types": t.vehicle_types?.join(", ") || "", Notes: t.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transporters");
    XLSX.writeFile(wb, "transporters_export.xlsx");
    toast.success("Transporters exported successfully");
  };

  const filteredTransporters = transporters.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.company_name && t.company_name.toLowerCase().includes(search.toLowerCase())) ||
    (t.phone && t.phone.includes(search))
  );

  const pagination = usePagination(filteredTransporters);

  if (authLoading || loading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;

  return (
    <AdminPageShell
      title="Manage Transporters"
      actions={[
        { label: "Export", onClick: handleExport },
        { label: "Add Transporter", onClick: () => navigate("/admin/transporters/add") },
      ]}
      filterSection={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, minWidth: 50, textAlign: "right" }}>Search :</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, company, phone..." style={{ ...filterInputStyle, width: 250 }} />
        </div>
      }
      pagination={{
        currentPage: pagination.currentPage, totalPages: pagination.totalPages,
        onPageChange: pagination.goToPage, totalItems: pagination.totalItems,
        startIndex: pagination.startIndex, endIndex: pagination.endIndex,
      }}
    >
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>S.No</ThemedTH>
          <ThemedTH>Name</ThemedTH>
          <ThemedTH>Company</ThemedTH>
          <ThemedTH>Phone</ThemedTH>
          <ThemedTH>City</ThemedTH>
          <ThemedTH>Vehicle Types</ThemedTH>
          <ThemedTH>Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((t, index) => (
            <ThemedTR key={t.id} index={index}>
              <ThemedTD>{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{t.name}</ThemedTD>
              <ThemedTD>{t.company_name || "-"}</ThemedTD>
              <ThemedTD>{t.phone || "-"}</ThemedTD>
              <ThemedTD>{t.city?.name || "-"}</ThemedTD>
              <ThemedTD>{t.vehicle_types?.join(", ") || "-"}</ThemedTD>
              <ThemedTD>
                <span onClick={() => navigate(`/admin/transporters/add?edit=${t.id}`)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Edit</span>
                {" / "}
                <span onClick={() => handleDelete(t.id)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Delete</span>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredTransporters.length === 0 && <ThemedEmptyRow colSpan={7} message="No transporters found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}