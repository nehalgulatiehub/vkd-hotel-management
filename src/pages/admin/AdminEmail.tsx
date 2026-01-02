import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
      });

      if (error) throw error;

      toast.success("Email update request sent. Please check your new email for confirmation.");
    } catch (error: any) {
      toast.error(error.message || "Error updating email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="Admin Email" />
      <main className="p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-base">Update Admin Email</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currentEmail">Current Email</Label>
                <Input
                  id="currentEmail"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="email">New Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Email"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
