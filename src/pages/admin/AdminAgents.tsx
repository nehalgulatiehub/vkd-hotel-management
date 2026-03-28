import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfilesMap } from "@/hooks/useProfilesMap";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, filterSelectStyle, filterInputStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";
import * as XLSX from "xlsx";

interface Agent {
  id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  commission_rate: number | null;
  city_id: string | null;
  notes: string | null;
  created_by: string | null;
  city?: { name: string } | null;
}

export default function AdminAgents() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const { profiles, getUserName } = useProfilesMap();

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) fetchAgents();
  }, [authLoading, canManage]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("agents").select("*, city:cities(name), created_by").order("name");
      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
      toast.success("Agent deleted successfully");
      fetchAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  const handleExport = () => {
    const exportData = agents.map(agent => ({
      Name: agent.name,
      Company: agent.company_name || "",
      Phone: agent.phone || "",
      Email: agent.email || "",
      Address: agent.address || "",
      "Commission Rate": agent.commission_rate || 0,
      City: agent.city?.name || "",
      User: agent.created_by ? getUserName(agent.created_by) : "",
      Notes: agent.notes || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents");
    XLSX.writeFile(wb, "agents_export.xlsx");
    toast.success("Agents exported successfully");
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(search.toLowerCase()) ||
      (agent.company_name && agent.company_name.toLowerCase().includes(search.toLowerCase())) ||
      (agent.phone && agent.phone.includes(search));
    const matchesUser = !userFilter || userFilter === "all" || agent.created_by === userFilter;
    return matchesSearch && matchesUser;
  });

  const pagination = usePagination(filteredAgents);

  if (authLoading || loading) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Loading...</div>;
  }

  if (!canManage) {
    return <div style={{ padding: 24, textAlign: "center", color: "#999", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>Access Denied</div>;
  }

  return (
    <AdminPageShell
      title="Manage Agents"
      actions={[
        { label: "Export", onClick: handleExport },
        { label: "Add Agent", onClick: () => navigate("/admin/agents/add") },
      ]}
      filterSection={
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <label style={{ fontSize: 11, minWidth: 50, textAlign: "right" }}>Search :</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, company, phone..."
            style={{ ...filterInputStyle, width: 200 }}
          />
          <label style={{ fontSize: 11, marginLeft: 16 }}>User :</label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={filterSelectStyle}
          >
            <option value="all">All Users</option>
            {profiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.username || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
      }
      pagination={{
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        onPageChange: pagination.goToPage,
        totalItems: pagination.totalItems,
        startIndex: pagination.startIndex,
        endIndex: pagination.endIndex,
      }}
    >
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>S.No</ThemedTH>
          <ThemedTH>Name</ThemedTH>
          <ThemedTH>Company</ThemedTH>
          <ThemedTH>Phone</ThemedTH>
          <ThemedTH>Email</ThemedTH>
          <ThemedTH>City</ThemedTH>
          <ThemedTH>User</ThemedTH>
          <ThemedTH>Commission %</ThemedTH>
          <ThemedTH>Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((agent, index) => (
            <ThemedTR key={agent.id} index={index}>
              <ThemedTD>{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{agent.name}</ThemedTD>
              <ThemedTD>{agent.company_name || "-"}</ThemedTD>
              <ThemedTD>{agent.phone || "-"}</ThemedTD>
              <ThemedTD>{agent.email || "-"}</ThemedTD>
              <ThemedTD>{agent.city?.name || "-"}</ThemedTD>
              <ThemedTD>{agent.created_by ? getUserName(agent.created_by) : "-"}</ThemedTD>
              <ThemedTD>{agent.commission_rate ?? "-"}</ThemedTD>
              <ThemedTD>
                <span onClick={() => navigate(`/admin/agents/add?edit=${agent.id}`)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Edit</span>
                {" / "}
                <span onClick={() => handleDelete(agent.id)} style={{ color: "#0066cc", cursor: "pointer", fontSize: 10 }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>Delete</span>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredAgents.length === 0 && <ThemedEmptyRow colSpan={9} message="No agents found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}