import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { AdminPageShell, ThemedTable, ThemedTHead, ThemedTH, ThemedTD, ThemedTR, ThemedEmptyRow } from "@/components/admin/AdminPageShell";
import { Input } from "@/components/ui/input";

type AppRole = "admin" | "front_desk" | "housekeeping" | "manager" | "account";

interface UserWithRoles {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  is_active: boolean;
  roles: AppRole[];
}

export default function AdminUserList() {
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const canManage = isAdmin() || isAccount();

  const filteredUsers = users.filter(user => {
    const s = search.toLowerCase();
    return user.first_name?.toLowerCase().includes(s) ||
      user.last_name?.toLowerCase().includes(s) ||
      user.username?.toLowerCase().includes(s);
  });

  const pagination = usePagination(filteredUsers);

  useEffect(() => {
    if (!authLoading && canManage) fetchUsers();
  }, [authLoading, canManage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles").select("id, first_name, last_name, username, is_active");
      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
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

  if (authLoading || loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!canManage) return <div className="p-6 text-center text-muted-foreground">Access Denied</div>;

  return (
    <AdminPageShell
      title="View User List"
      filterSection={
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-700 w-20 text-right">Search :</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 max-w-sm h-7 text-xs" placeholder="Search by name or username..." />
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
          <ThemedTH>Status</ThemedTH>
          <ThemedTH>Roles</ThemedTH>
        </ThemedTHead>
        <tbody>
          {pagination.paginatedItems.map((user, index) => (
            <ThemedTR key={user.id} index={index}>
              <ThemedTD className="text-center">{pagination.startIndex + index}</ThemedTD>
              <ThemedTD>{user.first_name} {user.last_name}</ThemedTD>
              <ThemedTD>{user.username || "-"}</ThemedTD>
              <ThemedTD>
                <span className={`px-2 py-0.5 rounded text-xs ${user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </ThemedTD>
              <ThemedTD>
                {user.roles.length > 0
                  ? user.roles.map(role => (
                      <span key={role} className="inline-block bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded mr-1">{role}</span>
                    ))
                  : <span className="text-gray-400">No roles</span>
                }
              </ThemedTD>
            </ThemedTR>
          ))}
          {filteredUsers.length === 0 && <ThemedEmptyRow colSpan={5} message="No users found" />}
        </tbody>
      </ThemedTable>
    </AdminPageShell>
  );
}
