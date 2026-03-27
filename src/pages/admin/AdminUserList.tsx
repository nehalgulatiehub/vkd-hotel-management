import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type AppRole = "admin" | "front_desk" | "housekeeping" | "manager" | "account";

interface UserWithRoles {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  plain_password: string | null;
  is_active: boolean;
  roles: AppRole[];
  email?: string | null;
}

export default function AdminUserList() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const canManage = isAdmin() || isAccount();

  const pagination = usePagination(users);

  useEffect(() => {
    if (!authLoading && canManage) fetchUsers();
  }, [authLoading, canManage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles").select("id, first_name, last_name, username, phone, plain_password, is_active");
      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;

      // Try to get emails from auth (may not be accessible)
      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        phone: profile.phone,
        plain_password: profile.plain_password,
        is_active: profile.is_active !== false,
        roles: (rolesData || []).filter((r) => r.user_id === profile.id).map((r) => r.role as AppRole),
      }));
      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pagination.paginatedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pagination.paginatedItems.map(u => u.id)));
    }
  };

  const bulkUpdateStatus = async (active: boolean) => {
    if (selectedIds.size === 0) { toast.error("Select users first"); return; }
    for (const id of selectedIds) {
      await supabase.from("profiles").update({ is_active: active }).eq("id", id);
    }
    toast.success(`Users ${active ? "activated" : "deactivated"}`);
    setSelectedIds(new Set());
    fetchUsers();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) { toast.error("Select users first"); return; }
    if (!confirm(`Delete ${selectedIds.size} user(s)?`)) return;
    for (const id of selectedIds) {
      await supabase.from("profiles").delete().eq("id", id);
    }
    toast.success("Users deleted");
    setSelectedIds(new Set());
    fetchUsers();
  };

  if (authLoading || loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!canManage) return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;

  return (
    <AdminPageShell
      title="Manage User"
      actions={[{ label: "Add User", onClick: () => navigate("/admin/user-management") }]}
      pagination={{
        currentPage: pagination.currentPage, totalPages: pagination.totalPages,
        onPageChange: pagination.goToPage, totalItems: pagination.totalItems,
        startIndex: pagination.startIndex, endIndex: pagination.endIndex,
      }}
    >
      <ThemedTable>
        <ThemedTHead>
          <ThemedTH>Username</ThemedTH>
          <ThemedTH>Password</ThemedTH>
          <ThemedTH>Name</ThemedTH>
          <ThemedTH>Contact No.</ThemedTH>
          <ThemedTH>Email</ThemedTH>
          <ThemedTH>Status</ThemedTH>
          <ThemedTH>Action</ThemedTH>
          <ThemedTH className="w-8 text-center">
            <input
              type="checkbox"
              checked={selectedIds.size === pagination.paginatedItems.length && pagination.paginatedItems.length > 0}
              onChange={toggleAll}
              className="cursor-pointer"
            />
          </ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((user, index) => (
            <ThemedTR key={user.id} index={index}>
              <ThemedTD>{user.username || "-"}</ThemedTD>
              <ThemedTD>{user.plain_password || "-"}</ThemedTD>
              <ThemedTD>{[user.first_name, user.last_name].filter(Boolean).join(" ") || "-"}</ThemedTD>
              <ThemedTD>{user.phone || "-"}</ThemedTD>
              <ThemedTD>{user.email || "-"}</ThemedTD>
              <ThemedTD>{user.is_active ? "Activate" : "Deactivate"}</ThemedTD>
              <ThemedTD>
                <button
                  className="text-[#8B1538] hover:underline text-xs font-medium"
                  onClick={() => navigate("/admin/user-management")}
                >
                  Edit
                </button>
              </ThemedTD>
              <ThemedTD className="text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.id)}
                  onChange={() => toggleSelect(user.id)}
                  className="cursor-pointer"
                />
              </ThemedTD>
            </ThemedTR>
          ))}
          {users.length === 0 && <ThemedEmptyRow colSpan={8} message="No users found" />}
        </tbody>
      </ThemedTable>

      {/* Bulk action buttons */}
      <div className="flex justify-end gap-2 p-2 border border-t-0 border-gray-300">
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => bulkUpdateStatus(true)}>Activate</Button>
        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => bulkUpdateStatus(false)}>Deactivate</Button>
        <Button variant="outline" size="sm" className="text-xs h-7 text-destructive" onClick={bulkDelete}>Delete</Button>
      </div>
    </AdminPageShell>
  );
}
