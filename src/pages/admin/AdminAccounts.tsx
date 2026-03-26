import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AdminAccounts() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && isAdmin()) fetchAccounts();
  }, [authLoading]);

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

  if (authLoading || loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!isAdmin()) return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;

  return (
    <AdminPageShell
      title="Account Manager"
      filterSection={
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700 w-20 text-right">Search :</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 max-w-sm h-7 text-xs" placeholder="Search by name, username, phone..." />
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
          <ThemedTH>Name</ThemedTH>
          <ThemedTH>Username</ThemedTH>
          <ThemedTH>Phone</ThemedTH>
          <ThemedTH>Status</ThemedTH>
          <ThemedTH className="text-center">Active</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((account, index) => (
            <ThemedTR key={account.id} index={index}>
              <ThemedTD className="text-center">{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{account.first_name} {account.last_name}</ThemedTD>
              <ThemedTD>{account.username || "-"}</ThemedTD>
              <ThemedTD>{account.phone || "-"}</ThemedTD>
              <ThemedTD>
                <span className={`px-2 py-0.5 rounded text-xs ${account.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {account.is_active ? "Active" : "Inactive"}
                </span>
              </ThemedTD>
              <ThemedTD className="text-center">
                <Switch checked={account.is_active} onCheckedChange={() => handleToggleActive(account.id, account.is_active)} />
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredAccounts.length === 0 && <ThemedEmptyRow colSpan={6} message="No account users found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
