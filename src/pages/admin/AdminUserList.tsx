import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type AppRole = "admin" | "front_desk" | "housekeeping" | "manager" | "account";

interface UserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  plain_password: string | null;
  is_active: boolean;
  roles: AppRole[];
  email: string | null;
}

export default function AdminUserList() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserData[]>([]);
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

      const { data: rolesData } = await supabase
        .from("user_roles").select("user_id, role");

      // Try fetching emails via edge function
      let emailMap: Record<string, string> = {};
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await supabase.functions.invoke("create-user", {
            body: { action: "list-users" },
          });
          if (res.data?.users) {
            for (const u of res.data.users) {
              emailMap[u.id] = u.email || "";
            }
          }
        }
      } catch { /* ignore if edge function doesn't support list */ }

      const usersWithRoles: UserData[] = (profiles || []).map((p) => ({
        id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        username: p.username,
        phone: p.phone,
        plain_password: p.plain_password,
        is_active: p.is_active !== false,
        roles: (rolesData || []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
        email: emailMap[p.id] || null,
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
      next.has(id) ? next.delete(id) : next.add(id);
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
    <div className="p-4">
      {/* Header bar - matching reference */}
      <div className="flex items-center justify-between border border-gray-300 px-3 py-2 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">📋 Manage User</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 border-gray-400"
          onClick={() => navigate("/admin/user-management")}
        >
          Add User
        </Button>
      </div>

      {/* Table */}
      <div className="border border-t-0 border-gray-300 overflow-x-auto">
        <table className="w-full" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#D4A59A" }}>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold text-gray-800">Username</th>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold text-gray-800">Password</th>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold text-gray-800">Name</th>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold text-gray-800">Contact No.</th>
              <th className="border border-gray-400 px-3 py-2 text-left font-semibold text-gray-800">Email</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-semibold text-gray-800">Status</th>
              <th className="border border-gray-400 px-3 py-2 text-center font-semibold text-gray-800">Action</th>
              <th className="border border-gray-400 px-3 py-2 text-center w-8">
                <input
                  type="checkbox"
                  checked={selectedIds.size === pagination.paginatedItems.length && pagination.paginatedItems.length > 0}
                  onChange={toggleAll}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {pagination.paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              pagination.paginatedItems.map((user, index) => (
                <tr key={user.id} style={{ backgroundColor: index % 2 === 0 ? "#f6f6f6" : "#ffffff" }}>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600">{user.username || "-"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600">{user.plain_password || "-"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600">{[user.first_name, user.last_name].filter(Boolean).join(" ") || "-"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600">{user.phone || "-"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600">{user.email || ""}</td>
                  <td className="border border-gray-300 px-3 py-2 text-gray-600 text-center">{user.is_active ? "Activate" : "Deactivate"}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      className="text-xs hover:underline"
                      style={{ color: "rgb(193, 100, 110)", textDecoration: "none" }}
                      onClick={() => navigate("/admin/user-management")}
                    >
                      Edit
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom action buttons - right aligned like reference */}
      <div className="flex justify-end gap-1 mt-2">
        <Button variant="outline" size="sm" className="text-xs h-7 px-4 border-gray-400 rounded-sm" onClick={() => bulkUpdateStatus(true)}>Activate</Button>
        <Button variant="outline" size="sm" className="text-xs h-7 px-4 border-gray-400 rounded-sm" onClick={() => bulkUpdateStatus(false)}>Deactivate</Button>
        <Button variant="outline" size="sm" className="text-xs h-7 px-4 border-gray-400 rounded-sm" onClick={bulkDelete}>Delete</Button>
      </div>
    </div>
  );
}
