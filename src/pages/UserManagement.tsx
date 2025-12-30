import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Shield, Settings2, Pencil, Plus, Ban, CheckCircle } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

type AppRole = "admin" | "front_desk" | "housekeeping" | "manager" | "account";

interface UserWithRoles {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  is_active: boolean;
  roles: AppRole[];
  menuPermissions: string[];
}

const AVAILABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "account", label: "Account" },
  { value: "manager", label: "Manager" },
  { value: "front_desk", label: "Front Desk" },
  { value: "housekeeping", label: "Housekeeping" },
];

// All menu items with their keys for permission assignment
const MENU_ITEMS = [
  { category: "Dashboard", items: [{ key: "dashboard", label: "Dashboard" }] },
  {
    category: "City Management",
    items: [
      { key: "cities_add", label: "Add City" },
      { key: "cities_view", label: "View City" },
      { key: "cities_export", label: "Export City" },
    ],
  },
  {
    category: "Agent Management",
    items: [
      { key: "agents_add", label: "Add Agent" },
      { key: "agents_view", label: "View Agent" },
      { key: "agents_export", label: "Export Agent" },
    ],
  },
  {
    category: "Transporter Management",
    items: [
      { key: "transporters_add", label: "Add Transporter" },
      { key: "transporters_view", label: "View Transporter" },
      { key: "transporters_export", label: "Export Transporter" },
    ],
  },
  {
    category: "Hotel Management",
    items: [
      { key: "own_hotels", label: "Own Hotels" },
      { key: "another_hotels_add", label: "Add Another Hotel" },
      { key: "another_hotels_view", label: "View Another Hotel" },
      { key: "another_hotels_export", label: "Export Another Hotel" },
    ],
  },
  {
    category: "Booking & Enquiry",
    items: [
      { key: "enquiries_add", label: "Generate Enquiry" },
      { key: "enquiries_view", label: "View Enquiry" },
      { key: "enquiries_export", label: "Export Enquiry" },
      { key: "bookings_availability", label: "Booking Availability" },
      { key: "bookings_hold_create", label: "Create Hold Booking" },
      { key: "bookings_hold_view", label: "View Hold Booking" },
      { key: "bookings_add", label: "Create Booking" },
      { key: "bookings_view", label: "View Booking" },
    ],
  },
  {
    category: "Payment & Financials",
    items: [
      { key: "payments_view", label: "View Payment" },
      { key: "payments_booking_due", label: "Booking Due Amount" },
      { key: "payments_booking_view", label: "View Booking Payment" },
      { key: "payments_booking_export", label: "Export Booking" },
      { key: "payments_room_booking", label: "View Room Booking" },
      { key: "payments_safari", label: "View Safari Detail" },
      { key: "payments_safari_due", label: "Safari Due Amount" },
      { key: "payments_safari_payment", label: "View Safari Payment" },
      { key: "payments_volvo_dm", label: "Volvo Delhi - Manali Detail" },
      { key: "payments_dm_due", label: "Delhi - Manali Due Amount" },
      { key: "payments_volvo_md", label: "Volvo Manali - Delhi Detail" },
      { key: "payments_md_due", label: "Manali - Delhi Due Amount" },
      { key: "payments_volvo", label: "View Volvo Payment" },
      { key: "payments_hotel", label: "View Another Hotel Detail" },
      { key: "payments_hotel_due", label: "Another Hotel Due Amount" },
      { key: "payments_hotel_payment", label: "Another Hotel Payment" },
      { key: "payments_vehicle", label: "View Vehicle Detail" },
      { key: "payments_vehicle_due", label: "Vehicle Due Amount" },
      { key: "payments_vehicle_payment", label: "Another Vehicle Payment" },
    ],
  },
  {
    category: "Other Functions",
    items: [
      { key: "expenses", label: "View Group Expense" },
      { key: "bookings_cancelled", label: "View Cancel Booking" },
      { key: "refunds", label: "View Refund Payment" },
      { key: "refunds_cancelling", label: "View Cancelling Payment" },
      { key: "data_import", label: "Import Legacy Data" },
    ],
  },
  {
    category: "Restaurant",
    items: [
      { key: "restaurant_tables", label: "Tables" },
      { key: "restaurant_menu", label: "Food Menu" },
      { key: "restaurant_pos", label: "New Order (POS)" },
      { key: "restaurant_orders", label: "View Orders" },
      { key: "restaurant_reports", label: "Reports" },
    ],
  },
  {
    category: "Billing",
    items: [
      { key: "billing_create", label: "Create Invoice" },
      { key: "billing_invoices", label: "Saved Invoices" },
      { key: "billing_templates", label: "Invoice Templates" },
    ],
  },
];

export default function UserManagement() {
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState("");
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    if (!authLoading && canManage) {
      fetchUsers();
    }
  }, [authLoading, canManage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, username, is_active");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: menuData, error: menuError } = await supabase
        .from("user_menu_permissions")
        .select("user_id, menu_key");

      if (menuError) throw menuError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        is_active: profile.is_active !== false, // Default to true if null
        roles: (rolesData || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as AppRole),
        menuPermissions: (menuData || [])
          .filter((m) => m.user_id === profile.id)
          .map((m) => m.menu_key),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName) {
      toast.error("Please fill all required fields");
      return;
    }

    setCreatingUser(true);
    try {
      // Create user using Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            first_name: newUserFirstName,
            last_name: newUserLastName,
            username: newUserUsername || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("User created successfully! They will need to verify their email.");
        setIsCreateUserDialogOpen(false);
        resetCreateUserForm();
        
        // Wait a moment for the profile to be created by trigger
        setTimeout(() => {
          fetchUsers();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const resetCreateUserForm = () => {
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserUsername("");
  };

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUser.id,
        role: selectedRole,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("User already has this role");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Role added successfully");
      setIsRoleDialogOpen(false);
      setSelectedRole("");
      fetchUsers();
    } catch (error) {
      console.error("Error adding role:", error);
      toast.error("Failed to add role");
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;

      toast.success("Role removed successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    }
  };

  const handleSaveMenuPermissions = async () => {
    if (!selectedUser) return;

    try {
      // Delete existing menu permissions
      await supabase
        .from("user_menu_permissions")
        .delete()
        .eq("user_id", selectedUser.id);

      // Insert new permissions
      if (selectedMenuKeys.length > 0) {
        const { error } = await supabase.from("user_menu_permissions").insert(
          selectedMenuKeys.map((menu_key) => ({
            user_id: selectedUser.id,
            menu_key,
          }))
        );

        if (error) throw error;
      }

      toast.success("Menu permissions updated successfully");
      setIsMenuDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating menu permissions:", error);
      toast.error("Failed to update menu permissions");
    }
  };

  const handleUpdateUsername = async () => {
    if (!selectedUser || !newUsername.trim()) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: newUsername.toLowerCase().replace(/[^a-z0-9_]/g, '') })
        .eq("id", selectedUser.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Username already taken");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Username updated successfully");
      setIsUsernameDialogOpen(false);
      setNewUsername("");
      fetchUsers();
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
    }
  };

  const handleToggleUserStatus = async (user: UserWithRoles) => {
    const newStatus = !user.is_active;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const openMenuDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setSelectedMenuKeys(user.menuPermissions);
    setIsMenuDialogOpen(true);
  };

  const openUsernameDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setNewUsername(user.username || "");
    setIsUsernameDialogOpen(true);
  };

  const toggleMenuKey = (key: string) => {
    setSelectedMenuKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleCategoryMenus = (category: string, items: { key: string }[]) => {
    const categoryKeys = items.map((i) => i.key);
    const allSelected = categoryKeys.every((k) => selectedMenuKeys.includes(k));
    
    if (allSelected) {
      setSelectedMenuKeys((prev) => prev.filter((k) => !categoryKeys.includes(k)));
    } else {
      setSelectedMenuKeys((prev) => [...new Set([...prev, ...categoryKeys])]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Header title="User Management" />
        <main className="p-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading...
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen">
        <Header title="Access Denied" />
        <main className="p-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              You don't have permission to access this page.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="User Management" />
      <main className="p-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Users & Permissions
            </CardTitle>
            <Button size="sm" onClick={() => setIsCreateUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create User
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Menu Access</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.first_name || user.last_name
                          ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                          : "Unknown User"}
                      </TableCell>
                      <TableCell>
                        {user.username ? (
                          <Badge variant="outline" className="text-xs font-mono">
                            {user.username}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.is_active ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {user.is_active ? "Active" : "Blocked"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-muted-foreground text-sm">No roles</span>
                          ) : (
                            user.roles.map((role) => (
                              <Badge
                                key={role}
                                variant={role === "admin" ? "default" : role === "account" ? "secondary" : "outline"}
                                className="text-xs cursor-pointer"
                                onClick={() => handleRemoveRole(user.id, role)}
                                title="Click to remove"
                              >
                                {role}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.roles.includes("admin") || user.roles.includes("account") ? (
                          <Badge variant="outline" className="text-xs">Full Access</Badge>
                        ) : user.menuPermissions.length === 0 ? (
                          <span className="text-muted-foreground text-sm">No access</span>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {user.menuPermissions.length} menu(s)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openUsernameDialog(user)}
                            title="Edit username"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>

                          <Dialog open={isRoleDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                            setIsRoleDialogOpen(open);
                            if (open) setSelectedUser(user);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-7 w-7" title="Add role">
                                <UserPlus className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Role to {user.first_name || "User"}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Select Role</Label>
                                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {AVAILABLE_ROLES.filter(
                                        (r) => !user.roles.includes(r.value)
                                      ).map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                          {role.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={handleAddRole} disabled={!selectedRole}>
                                  Add Role
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openMenuDialog(user)}
                            disabled={user.roles.includes("admin") || user.roles.includes("account")}
                            title={user.roles.includes("admin") || user.roles.includes("account") ? "Admin/Account have full access" : "Manage menu access"}
                          >
                            <Settings2 className="h-3 w-3" />
                          </Button>

                          {isAdmin() && (
                            <Button
                              variant={user.is_active ? "destructive" : "default"}
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleToggleUserStatus(user)}
                              title={user.is_active ? "Block user" : "Activate user"}
                            >
                              {user.is_active ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username (optional)"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <Button onClick={handleCreateUser} disabled={creatingUser} className="w-full">
                {creatingUser ? "Creating..." : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Menu Permissions Dialog */}
        <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Menu Access for {selectedUser?.first_name || "User"}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {MENU_ITEMS.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category.category}`}
                        checked={category.items.every((i) => selectedMenuKeys.includes(i.key))}
                        onCheckedChange={() => toggleCategoryMenus(category.category, category.items)}
                      />
                      <Label htmlFor={`cat-${category.category}`} className="font-semibold text-sm">
                        {category.category}
                      </Label>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-2">
                      {category.items.map((item) => (
                        <div key={item.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={item.key}
                            checked={selectedMenuKeys.includes(item.key)}
                            onCheckedChange={() => toggleMenuKey(item.key)}
                          />
                          <Label htmlFor={item.key} className="text-sm font-normal">
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleSaveMenuPermissions} className="w-full">
              Save Menu Permissions
            </Button>
          </DialogContent>
        </Dialog>

        {/* Username Dialog */}
        <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Edit Username for {selectedUser?.first_name || "User"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editUsername">Username</Label>
                <Input
                  id="editUsername"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Enter username"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only lowercase letters, numbers, and underscores allowed
                </p>
              </div>
              <Button onClick={handleUpdateUsername} disabled={!newUsername.trim()} className="w-full">
                Save Username
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}