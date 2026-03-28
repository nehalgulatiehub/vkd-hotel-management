import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";

export default function AdminAccounts() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { if (!authLoading && isAdmin()) fetchAccounts(); }, [authLoading]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data: roleData, error: roleError } = await supabase.from("user_roles").select("user_id").eq("role", "account");
      if (roleError) throw roleError;
      const userIds = roleData?.map((r) => r.user_id) || [];
      if (userIds.length === 0) { setAccounts([]); setLoading(false); return; }
      const { data: profiles, error: profileError } = await supabase.from("profiles").select("*").in("id", userIds);
      if (profileError) throw profileError;
      setAccounts(profiles || []);
    } catch (error) { console.error("Error fetching accounts:", error); }
    finally { setLoading(false); }
  };

  const handleToggleActive = async (accountId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("profiles").update({ is_active: !currentStatus }).eq("id", accountId);
      if (error) throw error;
      toast.success(`Account ${!currentStatus ? "activated" : "deactivated"}`);
      fetchAccounts();
    } catch (error: any) { toast.error(error.message || "Error updating account"); }
  };

  const filteredAccounts = accounts.filter((a) => {
    const s = search.toLowerCase();
    return a.first_name?.toLowerCase().includes(s) || a.last_name?.toLowerCase().includes(s) ||
      a.username?.toLowerCase().includes(s) || a.phone?.includes(search);
  });

  const pagination = usePagination(filteredAccounts);

  if (authLoading || loading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!isAdmin()) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Access Denied</div>;

  const filterSection = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif" }}>
      <span>Search :</span>
      <input value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...filterInputStyle, minWidth: 250 }} placeholder="Search by name, username, phone..." />
    </div>
  );

  return (
    <AdminPageShell title="Account Manager" filterSection={filterSection} pagination={{ currentPage: pagination.currentPage, totalPages: pagination.totalPages, onPageChange: pagination.goToPage, totalItems: pagination.totalItems, startIndex: pagination.startIndex, endIndex: pagination.endIndex }}>
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>S.No</ThemedTH><ThemedTH>Name</ThemedTH><ThemedTH>Username</ThemedTH><ThemedTH>Phone</ThemedTH><ThemedTH>Status</ThemedTH><ThemedTH>Action</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((account, index) => (
            <ThemedTR key={account.id} index={index}>
              <ThemedTD>{pagination.startIndex + index + 1}</ThemedTD>
              <ThemedTD>{account.first_name} {account.last_name}</ThemedTD>
              <ThemedTD>{account.username || "-"}</ThemedTD>
              <ThemedTD>{account.phone || "-"}</ThemedTD>
              <ThemedTD>{account.is_active ? "Active" : "Inactive"}</ThemedTD>
              <ThemedTD>
                <ThemedActionLink onClick={() => handleToggleActive(account.id, account.is_active)}>
                  {account.is_active ? "Deactivate" : "Activate"}
                </ThemedActionLink>
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredAccounts.length === 0 && <ThemedEmptyRow colSpan={6} message="No account users found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
