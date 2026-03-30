import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AccountChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const s: React.CSSProperties = { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 };
  const inputStyle: React.CSSProperties = { border: "1px solid #999", padding: "2px 4px", fontSize: 11, width: "100%", maxWidth: 250 };

  return (
    <div style={{ ...s, padding: 16 }}>
      <div style={{ background: "#b44a50", color: "#fff", padding: "6px 12px", fontWeight: "bold", fontSize: 12 }}>
        Change Password
      </div>
      <div style={{ border: "1px solid #ccc", padding: "16px", background: "#fff" }}>
        <form onSubmit={handleSubmit}>
          <table style={{ fontSize: 11 }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 8px" }}>New Password:</td>
                <td style={{ padding: "4px 8px" }}>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} required />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 8px" }}>Confirm Password:</td>
                <td style={{ padding: "4px 8px" }}>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} required />
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 8px" }}></td>
                <td style={{ padding: "4px 8px" }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ background: "#b44a50", color: "#fff", border: "none", padding: "4px 16px", fontSize: 11, cursor: "pointer" }}
                  >
                    {loading ? "Updating..." : "Change Password"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>
    </div>
  );
}
