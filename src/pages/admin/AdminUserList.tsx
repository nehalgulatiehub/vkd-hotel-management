import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  plain_password: string | null;
  is_active: boolean;
  email: string | null;
}

export default function AdminUserList() {
  const navigate = useNavigate();
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionUser, setActionUser] = useState<UserData | null>(null);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) fetchUsers();
  }, [authLoading, canManage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, username, phone, plain_password, is_active");
      if (error) throw error;

      let emailMap: Record<string, string> = {};
      try {
        const res = await supabase.functions.invoke("create-user", {
          body: { action: "list-users" },
        });
        if (res.data?.users) {
          for (const u of res.data.users) emailMap[u.id] = u.email || "";
        }
      } catch {}

      setUsers(
        (profiles || []).map((p) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          username: p.username,
          phone: p.phone,
          plain_password: p.plain_password,
          is_active: p.is_active !== false,
          email: emailMap[p.id] || null,
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === users.length ? new Set() : new Set(users.map((u) => u.id))
    );
  };

  const bulkAction = async (action: "activate" | "deactivate" | "delete") => {
    if (selectedIds.size === 0) { toast.error("Select users first"); return; }
    if (action === "delete" && !confirm(`Delete ${selectedIds.size} user(s)?`)) return;
    for (const id of selectedIds) {
      if (action === "delete") await supabase.from("profiles").delete().eq("id", id);
      else await supabase.from("profiles").update({ is_active: action === "activate" }).eq("id", id);
    }
    toast.success(action === "delete" ? "Users deleted" : `Users ${action}d`);
    setSelectedIds(new Set());
    fetchUsers();
  };

  const handleEditUser = (user: UserData) => {
    setActionUser(null);
    navigate("/admin/user-management");
  };

  const handleToggleStatus = async (user: UserData) => {
    await supabase.from("profiles").update({ is_active: !user.is_active }).eq("id", user.id);
    toast.success(user.is_active ? "User deactivated" : "User activated");
    setActionUser(null);
    fetchUsers();
  };

  const handleResetPassword = (user: UserData) => {
    setActionUser(null);
    navigate("/admin/change-password");
  };

  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Delete user "${user.username}"?`)) return;
    await supabase.from("profiles").delete().eq("id", user.id);
    toast.success("User deleted");
    setActionUser(null);
    fetchUsers();
  };

  if (authLoading || loading)
    return <div style={{ padding: 24, textAlign: "center", color: "#888", fontFamily: "Arial" }}>Loading...</div>;
  if (!canManage)
    return <div style={{ padding: 24, textAlign: "center", color: "#888", fontFamily: "Arial" }}>Access Denied</div>;

  const S: Record<string, React.CSSProperties> = {
    wrap: { padding: "10px 16px", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 },
    table: { width: "100%", borderCollapse: "collapse" as const, border: "1px solid #ccc" },
    th: {
      backgroundColor: "#b44a50",
      color: "#fff",
      fontWeight: 700,
      fontSize: 11,
      padding: "6px 10px",
      borderRight: "1px solid #a33",
      borderBottom: "1px solid #a33",
      textAlign: "left" as const,
      whiteSpace: "nowrap" as const,
    },
    thCenter: { textAlign: "center" as const },
    td: {
      fontSize: 11,
      color: "#606060",
      padding: "5px 10px",
      borderRight: "1px solid #ddd",
      borderBottom: "1px solid #ddd",
      textAlign: "left" as const,
      verticalAlign: "middle" as const,
    },
    tdCenter: { textAlign: "center" as const },
    editLink: { color: "rgb(193,100,110)", textDecoration: "none", cursor: "pointer", fontSize: 11 },
    btnRow: { display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 6 },
    btn: {
      fontSize: 11,
      padding: "3px 12px",
      border: "1px solid #888",
      background: "#f5f5f5",
      cursor: "pointer",
      borderRadius: 0,
      color: "#333",
    },
  };

  return (
    <div style={S.wrap}>
      <table style={S.table} cellPadding={0} cellSpacing={0}>
        <thead>
          <tr>
            <th style={S.th}>Username</th>
            <th style={S.th}>Password</th>
            <th style={S.th}>Name</th>
            <th style={S.th}>Contact No.</th>
            <th style={S.th}>Email</th>
            <th style={{ ...S.th, ...S.thCenter }}>Status</th>
            <th style={{ ...S.th, ...S.thCenter }}>Action</th>
            <th style={{ ...S.th, ...S.thCenter, width: 30 }}>
              <input type="checkbox" checked={selectedIds.size === users.length && users.length > 0} onChange={toggleAll} />
            </th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ ...S.td, textAlign: "center", padding: "20px 10px" }}>
                No users found
              </td>
            </tr>
          ) : (
            users.map((u, i) => (
              <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f6f6f6" }}>
                <td style={S.td}>{u.username || ""}</td>
                <td style={S.td}>{u.plain_password || ""}</td>
                <td style={S.td}>{[u.first_name, u.last_name].filter(Boolean).join(" ")}</td>
                <td style={S.td}>{u.phone || ""}</td>
                <td style={S.td}>{u.email || ""}</td>
                <td style={{ ...S.td, ...S.tdCenter }}>{u.is_active ? "Activate" : "Deactivate"}</td>
                <td style={{ ...S.td, ...S.tdCenter }}>
                  <span style={S.editLink} onClick={() => setActionUser(u)}>Edit</span>
                </td>
                <td style={{ ...S.td, ...S.tdCenter }}>
                  <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelect(u.id)} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={S.btnRow}>
        <button style={S.btn} onClick={() => bulkAction("activate")}>Activate</button>
        <button style={S.btn} onClick={() => bulkAction("deactivate")}>Deactivate</button>
        <button style={S.btn} onClick={() => bulkAction("delete")}>Delete</button>
      </div>

      {/* Action popup dialog */}
      <Dialog open={!!actionUser} onOpenChange={(open) => !open && setActionUser(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Actions — {actionUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <button
              className="text-left text-xs px-3 py-2 hover:bg-gray-100 rounded"
              onClick={() => actionUser && handleEditUser(actionUser)}
            >
              ✏️ Edit User
            </button>
            <button
              className="text-left text-xs px-3 py-2 hover:bg-gray-100 rounded"
              onClick={() => actionUser && handleToggleStatus(actionUser)}
            >
              {actionUser?.is_active ? "🚫 Deactivate" : "✅ Activate"}
            </button>
            <button
              className="text-left text-xs px-3 py-2 hover:bg-gray-100 rounded"
              onClick={() => actionUser && handleResetPassword(actionUser)}
            >
              🔑 Reset Password
            </button>
            <button
              className="text-left text-xs px-3 py-2 hover:bg-gray-100 rounded text-red-600"
              onClick={() => actionUser && handleDeleteUser(actionUser)}
            >
              🗑️ Delete User
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
