import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminUserActionDialogs } from "@/components/admin/AdminUserActionDialogs";
import { ADMIN_USER_MENU_ITEMS } from "@/components/admin/adminUserMenuItems";

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
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionUser, setActionUser] = useState<UserData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([]);
  const [loadingMenuAccess, setLoadingMenuAccess] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [newEmailValue, setNewEmailValue] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);


  const canManage = isAdmin() || isAccount();
  const allMenuKeys = ADMIN_USER_MENU_ITEMS.flatMap((group) => group.items.map((item) => item.key));

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
    if (action === "delete" && !confirm(`Delete ${selectedIds.size} user(s)? This cannot be undone.`)) return;
    try {
      for (const id of selectedIds) {
        if (action === "delete") {
          const { data, error } = await supabase.functions.invoke("create-user", {
            body: { action: "delete-user", userId: id },
          });
          if (error) throw new Error(error.message);
          if (data?.error) throw new Error(data.error);
        } else {
          const { error } = await supabase.from("profiles").update({ is_active: action === "activate" }).eq("id", id);
          if (error) throw error;
        }
      }
      toast.success(action === "delete" ? "Users deleted" : `Users ${action}d`);
      setSelectedIds(new Set());
      fetchUsers();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Action failed");
    }
  };


  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setNewUsername(user.username || "");
    setActionUser(null);
    setIsUsernameDialogOpen(true);
  };

  const handleUpdateUsername = async () => {
    if (!selectedUser) return;

    const sanitizedUsername = newUsername.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    if (!sanitizedUsername) {
      toast.error("Username is required");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: sanitizedUsername })
        .eq("id", selectedUser.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Username already taken");
          return;
        }

        throw error;
      }

      toast.success("Username updated successfully");
      setIsUsernameDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update username");
    }
  };

  const handleManageModuleAccess = async (user: UserData) => {
    setSelectedUser(user);
    setSelectedMenuKeys([]);
    setLoadingMenuAccess(true);
    setActionUser(null);

    try {
      const { data, error } = await supabase
        .from("user_menu_permissions")
        .select("menu_key")
        .eq("user_id", user.id);

      if (error) throw error;

      setSelectedMenuKeys((data || []).map((item) => item.menu_key));
      setIsMenuDialogOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load module access");
    } finally {
      setLoadingMenuAccess(false);
    }
  };

  const toggleMenuKey = (key: string) => {
    setSelectedMenuKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const handleSaveMenuPermissions = async () => {
    if (!selectedUser) return;

    try {
      const { error: deleteError } = await supabase
        .from("user_menu_permissions")
        .delete()
        .eq("user_id", selectedUser.id);

      if (deleteError) throw deleteError;

      if (selectedMenuKeys.length > 0) {
        const { error: insertError } = await supabase.from("user_menu_permissions").insert(
          selectedMenuKeys.map((menu_key) => ({
            user_id: selectedUser.id,
            menu_key,
          }))
        );

        if (insertError) throw insertError;
      }

      toast.success("Module access updated successfully");
      setIsMenuDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update module access");
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    try {
      const { error } = await supabase.from("profiles").update({ is_active: !user.is_active }).eq("id", user.id);
      if (error) throw error;

      toast.success(user.is_active ? "User deactivated" : "User activated");
      setActionUser(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user status");
    }
  };

  const handleOpenResetPassword = (user: UserData) => {
    setSelectedUser(user);
    setResetPasswordValue("");
    setShowResetPassword(false);
    setActionUser(null);
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !resetPasswordValue) return;
    if (resetPasswordValue.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResettingPassword(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("No active session. Please sign in again.");
      }

      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          action: "reset-password",
          userId: selectedUser.id,
          newPassword: resetPasswordValue,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        let errorMessage = error.message || "Failed to reset password";
        const errorContext = (error as Error & { context?: Response }).context;

        if (errorContext) {
          try {
            const errorData = await errorContext.json();
            errorMessage = errorData?.error || errorMessage;
          } catch {
            try {
              const errorText = await errorContext.text();
              errorMessage = errorText || errorMessage;
            } catch {}
          }
        }

        throw new Error(errorMessage);
      }

      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Failed to reset password");

      toast.success("Password updated successfully");
      setIsResetPasswordDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
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
              className="text-left text-xs px-3 py-2 hover:bg-gray-100"
              onClick={() => actionUser && handleEditUser(actionUser)}
            >
              Edit User
            </button>
            <button
              className="text-left text-xs px-3 py-2 hover:bg-gray-100"
              onClick={() => actionUser && handleManageModuleAccess(actionUser)}
            >
              Manage Module Access
            </button>
            <button
              className="text-left text-xs px-3 py-2 hover:bg-gray-100"
              onClick={() => actionUser && handleToggleStatus(actionUser)}
            >
              {actionUser?.is_active ? "Deactivate User" : "Activate User"}
            </button>
            <button
              className="text-left text-xs px-3 py-2 hover:bg-gray-100"
              onClick={() => actionUser && handleOpenResetPassword(actionUser)}
            >
              Change Password
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AdminUserActionDialogs
        usernameDialog={{
          open: isUsernameDialogOpen,
          onOpenChange: setIsUsernameDialogOpen,
          userLabel: selectedUser?.username || selectedUser?.first_name || "User",
          username: newUsername,
          onUsernameChange: (value) => setNewUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, "")),
          onSave: handleUpdateUsername,
        }}
        menuAccessDialog={{
          open: isMenuDialogOpen,
          onOpenChange: setIsMenuDialogOpen,
          userLabel: selectedUser?.username || selectedUser?.first_name || "User",
          selectedKeys: selectedMenuKeys,
          onToggleKey: toggleMenuKey,
          onSelectAll: () => setSelectedMenuKeys(allMenuKeys),
          onClearAll: () => setSelectedMenuKeys([]),
          onSave: handleSaveMenuPermissions,
          loading: loadingMenuAccess,
        }}
        passwordDialog={{
          open: isResetPasswordDialogOpen,
          onOpenChange: setIsResetPasswordDialogOpen,
          userLabel: selectedUser?.username || selectedUser?.first_name || "User",
          password: resetPasswordValue,
          showPassword: showResetPassword,
          onPasswordChange: setResetPasswordValue,
          onTogglePasswordVisibility: () => setShowResetPassword((prev) => !prev),
          onSave: handleResetPassword,
          saving: resettingPassword,
        }}
      />
    </div>
  );
}
