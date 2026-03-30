import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export default function AdminAddAccount() {
  const { isAdmin, loading: authLoading, session } = useAuthContext();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) return <div style={{ padding: 24, textAlign: "center", color: "#999", fontSize: 11 }}>Loading...</div>;
  if (!isAdmin()) return <div style={{ padding: 24, textAlign: "center", fontSize: 11 }}>Access Denied</div>;

  const labelStyle: React.CSSProperties = { fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", fontWeight: "bold", display: "block", marginBottom: 4 };
  const inputStyle: React.CSSProperties = { fontSize: 11, fontFamily: "Arial, Helvetica, sans-serif", border: "1px solid #bbb", padding: "4px 8px", width: "100%" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = username.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    if (!sanitized || !password) { toast.error("Username and password are required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("create-user", {
        body: { username: sanitized, password, firstName: firstName || sanitized, lastName: lastName || "" },
      });

      if (res.error) throw new Error(res.error.message || "Failed to create user");
      if (res.data?.error) throw new Error(res.data.error);

      const userId = res.data?.user?.id;
      if (!userId) throw new Error("User created but no ID returned");

      // Update phone if provided
      if (phone) {
        await supabase.from("profiles").update({ phone }).eq("id", userId);
      }

      // Assign account role
      const { error: roleError } = await supabase.from("user_roles").insert({ user_id: userId, role: "account" });
      if (roleError) {
        console.error("Role assignment error:", roleError);
        toast.error("User created but failed to assign account role. Please assign manually.");
      }

      toast.success("Account user created successfully");
      navigate("/admin/accounts");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPageShell title="Add Account User" filterSection={null}>
      <div style={{ padding: "12px 16px", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
        <form onSubmit={handleSubmit} style={{ maxWidth: 500 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} style={inputStyle} placeholder="First Name" />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} style={inputStyle} placeholder="Last Name" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Username *</label>
            <input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} placeholder="Username (letters, numbers, underscore)" required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Min 6 characters" required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="Contact number" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={submitting} style={{ background: "#4CAF50", color: "#fff", border: "1px solid #388E3C", padding: "4px 16px", fontSize: 11, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Creating..." : "Create Account User"}
            </button>
            <button type="button" onClick={() => navigate("/admin/accounts")} style={{ background: "#eee", border: "1px solid #bbb", padding: "4px 16px", fontSize: 11, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminPageShell>
  );
}
