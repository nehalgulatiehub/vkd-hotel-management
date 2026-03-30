import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow, ThemedActionLink, filterInputStyle } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminAccounts() {
  const { isAdmin, loading: authLoading } = useAuthContext();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // City restriction dialog
  const [showCityDialog, setShowCityDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [allCities, setAllCities] = useState<{ id: string; name: string }[]>([]);
  const [restrictedCityIds, setRestrictedCityIds] = useState<Set<string>>(new Set());
  const [savingCities, setSavingCities] = useState(false);

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

  const handleManageCities = async (account: any) => {
    setSelectedAccount(account);
    setShowCityDialog(true);
    // Fetch all cities and current restrictions
    const [citiesRes, restrictionsRes] = await Promise.all([
      supabase.from("cities").select("id, name").order("name"),
      supabase.from("account_city_restrictions").select("city_id").eq("user_id", account.id),
    ]);
    setAllCities(citiesRes.data || []);
    setRestrictedCityIds(new Set((restrictionsRes.data || []).map((r: any) => r.city_id)));
  };

  const handleToggleCity = (cityId: string, checked: boolean) => {
    setRestrictedCityIds(prev => {
      const newSet = new Set(prev);
      checked ? newSet.add(cityId) : newSet.delete(cityId);
      return newSet;
    });
  };

  const handleSaveCityRestrictions = async () => {
    if (!selectedAccount) return;
    setSavingCities(true);
    try {
      // Delete existing restrictions
      await supabase.from("account_city_restrictions").delete().eq("user_id", selectedAccount.id);
      // Insert new restrictions
      if (restrictedCityIds.size > 0) {
        const rows = Array.from(restrictedCityIds).map(cityId => ({
          user_id: selectedAccount.id,
          city_id: cityId,
        }));
        const { error } = await supabase.from("account_city_restrictions").insert(rows);
        if (error) throw error;
      }
      toast.success("City restrictions saved successfully");
      setShowCityDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save city restrictions");
    } finally {
      setSavingCities(false);
    }
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
    <>
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
                  <div style={{ display: "flex", gap: 8 }}>
                    <ThemedActionLink onClick={() => handleToggleActive(account.id, account.is_active)}>
                      {account.is_active ? "Deactivate" : "Activate"}
                    </ThemedActionLink>
                    <span style={{ color: "#999" }}>|</span>
                    <ThemedActionLink onClick={() => handleManageCities(account)}>
                      Manage Cities
                    </ThemedActionLink>
                  </div>
                </ThemedTD>
              </ThemedTR>
            ))}
            {filteredAccounts.length === 0 && <ThemedEmptyRow colSpan={6} message="No account users found" />}
          </tbody>
        </ThemedTable>
      </AdminPageShell>

      {/* Manage City Restrictions Dialog */}
      <Dialog open={showCityDialog} onOpenChange={setShowCityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: 14, fontFamily: "Arial, Helvetica, sans-serif" }}>
              Restrict Payment Approval by City
            </DialogTitle>
          </DialogHeader>
          <div style={{ fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", marginBottom: 8, color: "#666" }}>
            <strong>{selectedAccount?.first_name} {selectedAccount?.last_name}</strong> ({selectedAccount?.username})
            <br />
            <span style={{ color: "#b44a50" }}>Selected cities will be RESTRICTED — this user cannot approve payments for these cities.</span>
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #ddd", borderRadius: 4 }}>
            {allCities.map((city) => (
              <label
                key={city.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                  fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif",
                  borderBottom: "1px solid #f0f0f0", cursor: "pointer",
                  backgroundColor: restrictedCityIds.has(city.id) ? "#fef2f2" : "#fff",
                }}
              >
                <Checkbox
                  checked={restrictedCityIds.has(city.id)}
                  onCheckedChange={(checked) => handleToggleCity(city.id, !!checked)}
                />
                <span>{city.name}</span>
                {restrictedCityIds.has(city.id) && <span style={{ color: "#b44a50", marginLeft: "auto", fontSize: 10 }}>Restricted</span>}
              </label>
            ))}
            {allCities.length === 0 && <div style={{ padding: 12, textAlign: "center", color: "#999", fontSize: 11 }}>No cities found</div>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button
              onClick={() => setShowCityDialog(false)}
              style={{ padding: "4px 14px", fontSize: 11, border: "1px solid #ccc", borderRadius: 3, background: "#fff", cursor: "pointer" }}
            >Cancel</button>
            <button
              onClick={handleSaveCityRestrictions}
              disabled={savingCities}
              style={{ padding: "4px 14px", fontSize: 11, border: "none", borderRadius: 3, background: "#b44a50", color: "#fff", cursor: "pointer" }}
            >{savingCities ? "Saving..." : "Save Restrictions"}</button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
