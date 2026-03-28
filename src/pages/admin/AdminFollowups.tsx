import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function AdminFollowups() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => { if (!authLoading && canManage) fetchEnquiries(); }, [authLoading, canManage]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("enquiries").select(`*, guest:guests(first_name, last_name, phone, email), agent:agents(name, company_name), destination:cities(name)`).in("status", ["pending", "follow_up"]).order("created_at", { ascending: false });
      if (error) throw error;
      setEnquiries(data || []);
    } catch (error) { console.error("Error fetching enquiries:", error); }
    finally { setLoading(false); }
  };

  const filteredEnquiries = enquiries.filter((e) => {
    const s = search.toLowerCase();
    return e.enquiry_number?.toLowerCase().includes(s) || e.guest?.first_name?.toLowerCase().includes(s) ||
      e.guest?.last_name?.toLowerCase().includes(s) || e.agent?.name?.toLowerCase().includes(s);
  });

  const pagination = usePagination(filteredEnquiries);

  if (authLoading || loading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!canManage) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Access Denied</div>;

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <span>Search :</span>
      <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...filterInputStyle, minWidth: 250 }} placeholder="Search by enquiry #, guest, agent..." />
    </div>
  );

  return (
    <AdminPageShell title="View Followup" filterSection={filterSection} pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}>
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>S.No</ThemedTH><ThemedTH>Enquiry #</ThemedTH><ThemedTH>Guest</ThemedTH><ThemedTH>Agent</ThemedTH><ThemedTH>Destination</ThemedTH><ThemedTH>Check-in</ThemedTH><ThemedTH>Status</ThemedTH><ThemedTH>Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((enquiry, index) => (
            <ThemedTR key={enquiry.id} index={index}>
              <ThemedTD>{pagination.startIndex + index + 1}</ThemedTD>
              <ThemedTD>{enquiry.enquiry_number}</ThemedTD>
              <ThemedTD>{enquiry.guest ? `${enquiry.guest.first_name} ${enquiry.guest.last_name}` : "-"}</ThemedTD>
              <ThemedTD>{enquiry.agent?.name || "-"}</ThemedTD>
              <ThemedTD>{enquiry.destination?.name || "-"}</ThemedTD>
              <ThemedTD>{enquiry.check_in_date ? format(new Date(enquiry.check_in_date), "dd/MM/yyyy") : "-"}</ThemedTD>
              <ThemedTD>{enquiry.status === "follow_up" ? "Follow Up" : "Pending"}</ThemedTD>
              <ThemedTD>
                <ThemedActionLink onClick={() => navigate("/admin/enquiries")}>View</ThemedActionLink>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredEnquiries.length === 0 && <ThemedEmptyRow colSpan={8} message="No followups pending" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
