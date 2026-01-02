import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/TablePagination";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "react-router-dom";

export default function AdminAccounts() {
  const location = useLocation();
  const isAddMode = location.pathname.includes("/add");
  const { isAdmin, loading: authLoading, user } = useAuthContext();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(isAddMode);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    username: "",
  });

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchAccounts();
    }
  }, [authLoading]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // Get users with 'account' role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "account");

      if (roleError) throw roleError;

      const userIds = roleData?.map((r) => r.user_id) || [];

      if (userIds.length === 0) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      if (profileError) throw profileError;
      setAccounts(profiles || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For creating new account users, we need admin functions
      // This is a simplified version - in production you'd use an edge function
      toast.info("Creating new account users requires admin privileges. Please use the User Management page.");
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error creating account");
    }
  };

  const handleToggleActive = async (accountId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !currentStatus })
        .eq("id", accountId);

      if (error) throw error;
      toast.success(`Account ${!currentStatus ? "activated" : "deactivated"}`);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Error updating account");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone: "",
      username: "",
    });
    setIsDialogOpen(false);
  };

  const filteredAccounts = accounts.filter((account) => {
    const searchLower = search.toLowerCase();
    return (
      account.first_name?.toLowerCase().includes(searchLower) ||
      account.last_name?.toLowerCase().includes(searchLower) ||
      account.username?.toLowerCase().includes(searchLower) ||
      account.phone?.includes(search)
    );
  });

  const { paginatedItems, currentPage, totalPages, goToPage, totalItems, startIndex, endIndex } = usePagination(filteredAccounts);

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Account Manager" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        </main>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen">
        <AdminHeader title="Access Denied" />
        <main className="p-4">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Access denied. Admin only.</CardContent></Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Account Manager" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Account Users ({filteredAccounts.length})</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Account User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Username *</Label>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Password *</Label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: To create new account users, please use the User Management page with proper role assignment.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button type="submit">Add Account</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No account users found.</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          {account.first_name} {account.last_name}
                        </TableCell>
                        <TableCell>{account.username || "-"}</TableCell>
                        <TableCell>{account.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={account.is_active ? "default" : "secondary"}>
                            {account.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={account.is_active}
                            onCheckedChange={() => handleToggleActive(account.id, account.is_active)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
