import { useState, useEffect } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";

export default function AdminEmail() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

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
      <div className="p-6 max-w-md mx-auto">
        <div className="bg-[#F5E6E0] p-6 rounded border border-gray-300">
          <h2 className="text-sm font-medium mb-4">Update Admin Email</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs">Current Email</Label>
              <Input type="email" value={user?.email || ""} disabled className="bg-white h-7 text-xs" />
            </div>
            <div>
              <Label className="text-xs">New Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-7 text-xs" />
            </div>
            <Button type="submit" className="w-full h-8 text-xs bg-[#1e6e99] hover:bg-[#165a80]" disabled={loading}>
              {loading ? "Updating..." : "Update Email"}
            </Button>
          </form>
        </div>
      </div>
    </AdminPageShell>
  );
}
