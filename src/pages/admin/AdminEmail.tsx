import { useState, useEffect } from "react";
import { AdminPageShell, filterInputStyle, filterButtonStyle } from "@/components/admin/AdminPageShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

export default function AdminEmail() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => { if (user?.email) setEmail(user.email); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { toast.error("Please enter a valid email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast.success("Email update request sent. Please check your new email for confirmation.");
    } catch (error: any) { toast.error(error.message || "Error updating email"); }
    finally { setLoading(false); }
  };

  return (
    <AdminPageShell title="Admin Email">
      <div style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
        <div style={{ backgroundColor: "#f6f0f0", padding: 24, border: "1px solid #ccc", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 }}>
          <div style={{ fontWeight: "bold", marginBottom: 12, fontSize: 12 }}>Update Admin Email</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ marginBottom: 2 }}>Current Email</div>
              <input type="email" value={user?.email || ""} disabled style={{ ...filterInputStyle, width: "100%", backgroundColor: "#eee" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 2 }}>New Email</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ ...filterInputStyle, width: "100%" }} />
            </div>
            <button type="submit" disabled={loading} style={{ ...filterButtonStyle, width: "100%", backgroundColor: "#b44a50", color: "#fff", border: "none", padding: "4px 12px" }}>
              {loading ? "Updating..." : "Update Email"}
            </button>
          </form>
        </div>
      </div>
    </AdminPageShell>
  );
}
