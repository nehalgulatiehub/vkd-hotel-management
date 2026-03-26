import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function AdminFollowups() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) fetchEnquiries();
  }, [authLoading, canManage]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("enquiries")
        .select(`*, guest:guests(first_name, last_name, phone, email), agent:agents(name, company_name), destination:cities(name)`)
        .in("status", ["pending", "follow_up"])
        .order("created_at", { ascending: false });
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

  if (authLoading || loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!canManage) return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;

  return (
    <AdminPageShell
      title="View Followup"
      filterSection={
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700 w-20 text-right">Search :</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 max-w-sm h-7 text-xs" placeholder="Search by enquiry #, guest, agent..." />
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
          <ThemedTH className="w-12 text-center">S.No</ThemedTH>
          <ThemedTH>Enquiry #</ThemedTH>
          <ThemedTH>Guest</ThemedTH>
          <ThemedTH>Agent</ThemedTH>
          <ThemedTH>Destination</ThemedTH>
          <ThemedTH>Check-in</ThemedTH>
          <ThemedTH>Status</ThemedTH>
          <ThemedTH className="text-center w-20">Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((enquiry, index) => (
            <ThemedTR key={enquiry.id} index={index}>
              <ThemedTD className="text-center">{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{enquiry.enquiry_number}</ThemedTD>
              <ThemedTD>{enquiry.guest ? `${enquiry.guest.first_name} ${enquiry.guest.last_name}` : "-"}</ThemedTD>
              <ThemedTD>{enquiry.agent?.name || "-"}</ThemedTD>
              <ThemedTD>{enquiry.destination?.name || "-"}</ThemedTD>
              <ThemedTD>{enquiry.check_in_date ? format(new Date(enquiry.check_in_date), "dd/MM/yyyy") : "-"}</ThemedTD>
              <ThemedTD>
                <span className={`px-2 py-0.5 rounded text-xs ${enquiry.status === "follow_up" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>
                  {enquiry.status === "follow_up" ? "Follow Up" : "Pending"}
                </span>
              </ThemedTD>
              <ThemedTD className="text-center">
                <button onClick={() => navigate("/admin/enquiries")} className="text-blue-600 hover:underline text-xs">View</button>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredEnquiries.length === 0 && <ThemedEmptyRow colSpan={8} message="No followups pending" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
