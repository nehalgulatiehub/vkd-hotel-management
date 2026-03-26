import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Settings2, Pencil, Plus, Ban, CheckCircle, Eye, EyeOff, Search, KeyRound } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserWithPermissions {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  is_active: boolean;
  menuPermissions: string[];
  isAdmin: boolean;
  plain_password: string | null;
}

// All menu items grouped by category for permission assignment
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
    category: "Booking Sections (Form Toggles)",
    items: [
      { key: "booking_section_booking", label: "Booking (Own Hotel)" },
      { key: "booking_section_delhi_manali", label: "Delhi - Manali" },
      { key: "booking_section_manali_delhi", label: "Manali - Delhi" },
      { key: "booking_section_safari", label: "Safari" },
      { key: "booking_section_another_hotel", label: "Another Hotel" },
      { key: "booking_section_vehicle", label: "Additional Vehicle" },
      { key: "booking_section_group_expenses", label: "Group Expenses" },
    ],
  },
  {
    category: "Room Manager",
    items: [
      { key: "room_manager_rooms", label: "Manage Rooms" },
      { key: "room_manager_room_bookings", label: "View Room Bookings" },
    ],
  },
  {
    category: "Booking Manager",
    items: [
      { key: "booking_manager_reference", label: "View Reference List" },
      { key: "booking_manager_view", label: "View Booking" },
      { key: "booking_manager_pending_payment", label: "View Pending Payment" },
      { key: "booking_manager_approved_payment", label: "View Approved Payment" },
      { key: "booking_manager_due_amount", label: "Due Amount" },
      { key: "booking_manager_total_pax", label: "Total Pax" },
    ],
  },
  {
    category: "Cancel Booking Manager",
    items: [
      { key: "cancel_booking_view", label: "View Cancel Booking" },
      { key: "cancel_booking_return_payment", label: "View Book Return Payment" },
      { key: "cancel_booking_charges", label: "View Cancellation Charge" },
    ],
  },
  {
    category: "Payment Manager",
    items: [
      { key: "payment_manager_refund", label: "View Refund Payment" },
      { key: "payment_manager_paid", label: "View Paid Payment" },
      { key: "payment_manager_receive", label: "View Receive Payment" },
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
  {
    category: "Purchase Management",
    items: [
      { key: "purchase_vendors", label: "Vendors" },
      { key: "purchase_items", label: "Item Master" },
      { key: "purchase_requests", label: "Purchase Requests" },
      { key: "purchase_orders", label: "Purchase Orders" },
      { key: "purchase_grn", label: "Goods Receipt" },
      { key: "purchase_invoices", label: "Purchase Invoices" },
      { key: "purchase_inventory", label: "Inventory" },
      { key: "purchase_reports", label: "Reports" },
    ],
  },
];

export default function UserManagement() {
  const { isAdmin, isAccount, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [selectedMenuKeys, setSelectedMenuKeys] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // New user form state
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

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
        .select("id, first_name, last_name, username, is_active, plain_password");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: menuData, error: menuError } = await supabase
        .from("user_menu_permissions")
        .select("user_id, menu_key");

      if (menuError) throw menuError;

      const usersWithPermissions: UserWithPermissions[] = (profiles || []).map((profile) => {
        const userRoles = (rolesData || []).filter((r) => r.user_id === profile.id).map((r) => r.role);
        return {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          username: profile.username,
          is_active: profile.is_active !== false,
          menuPermissions: (menuData || [])
            .filter((m) => m.user_id === profile.id)
            .map((m) => m.menu_key),
          isAdmin: userRoles.includes('admin') || userRoles.includes('account'),
          plain_password: (profile as any).plain_password || null,
        };
      });

      setUsers(usersWithPermissions);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserUsername || !newUserPassword) {
      toast.error("Username and password are required");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreatingUser(true);
    try {
      // Use supabase.functions.invoke to call edge function without affecting admin session
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          username: newUserUsername,
          password: newUserPassword,
          firstName: newUserFirstName || newUserUsername,
          lastName: newUserLastName || "",
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to create user");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("User created successfully!");
      setIsCreateUserDialogOpen(false);
      resetCreateUserForm();
      
      // Wait a moment for the profile to be created by trigger
      setTimeout(() => {
        fetchUsers();
      }, 1000);
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    } finally {
      setCreatingUser(false);
    }
  };

  const resetCreateUserForm = () => {
    setNewUserPassword("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserUsername("");
    setShowPassword(false);
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

      toast.success("Permissions updated successfully");
      setIsMenuDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating menu permissions:", error);
      toast.error("Failed to update permissions");
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

  const handleToggleUserStatus = async (user: UserWithPermissions) => {
    const newStatus = !user.is_active;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: newStatus })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(`User ${newStatus ? 'activated' : 'blocked'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const openMenuDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setSelectedMenuKeys(user.menuPermissions);
    setIsMenuDialogOpen(true);
  };

  const openUsernameDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setNewUsername(user.username || "");
    setIsUsernameDialogOpen(true);
  };

  const openResetPasswordDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setResetPasswordValue("");
    setShowResetPassword(false);
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
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          action: 'reset-password',
          userId: selectedUser.id,
          newPassword: resetPasswordValue,
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
            } catch {
              // Ignore parsing errors and keep the original message
            }
          }
        }

        throw new Error(errorMessage);
      }

      if (data?.error) throw new Error(data.error);
      if (!data?.success) throw new Error("Failed to reset password");
      toast.success("Password reset successfully");
      setIsResetPasswordDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
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

  const selectAllMenus = () => {
    const allKeys = MENU_ITEMS.flatMap(cat => cat.items.map(i => i.key));
    setSelectedMenuKeys(allKeys);
  };

  const clearAllMenus = () => {
    setSelectedMenuKeys([]);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower)
    );
  });

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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Users & Module Access
            </CardTitle>
            <Button size="sm" onClick={() => setIsCreateUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create User
            </Button>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Username (Login)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Module Access</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.first_name || user.last_name
                              ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {user.username ? (
                              <Badge variant="outline" className="font-mono">
                                {user.username}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.is_active ? "default" : "destructive"}
                            >
                              {user.is_active ? "Active" : "Blocked"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge className="bg-blue-600">Full Access (Admin)</Badge>
                            ) : user.menuPermissions.length === 0 ? (
                              <span className="text-muted-foreground text-sm">No access</span>
                            ) : (
                              <Badge variant="secondary">
                                {user.menuPermissions.length} modules
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openUsernameDialog(user)}
                                title="Edit username"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openMenuDialog(user)}
                                disabled={user.isAdmin}
                                title={user.isAdmin ? "Admins have full access" : "Manage module access"}
                              >
                                <Settings2 className="h-3.5 w-3.5" />
                              </Button>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openResetPasswordDialog(user)}
                                title="Reset password"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </Button>

                              {isAdmin() && (
                                <Button
                                  variant={user.is_active ? "destructive" : "default"}
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleToggleUserStatus(user)}
                                  title={user.is_active ? "Block user" : "Activate user"}
                                >
                                  {user.is_active ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.plain_password ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">
                                  {visiblePasswords[user.id] ? user.plain_password : "••••••"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => togglePasswordVisibility(user.id)}
                                >
                                  {visiblePasswords[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not set</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
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
              <div>
                <Label htmlFor="username" className="text-sm font-medium">
                  Username (Login ID) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Enter username"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only lowercase letters, numbers, and underscores
                </p>
              </div>
              
              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleCreateUser} 
                  disabled={creatingUser || !newUserUsername || !newUserPassword} 
                  className="w-full"
                >
                  {creatingUser ? "Creating..." : "Create User"}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                After creating, click the settings icon to assign module access
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Module Access Dialog */}
        <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Module Access for {selectedUser?.username || selectedUser?.first_name || "User"}</span>
              </DialogTitle>
            </DialogHeader>
            
            {/* Quick actions */}
            <div className="flex gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={selectAllMenus}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllMenus}>
                Clear All
              </Button>
              <span className="ml-auto text-sm text-muted-foreground">
                {selectedMenuKeys.length} selected
              </span>
            </div>

            <ScrollArea className="h-[55vh] pr-4 border rounded-md p-3">
              <div className="space-y-4">
                {MENU_ITEMS.map((category) => (
                  <div key={category.category} className="border-b pb-3 last:border-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={`cat-${category.category}`}
                        checked={category.items.every((i) => selectedMenuKeys.includes(i.key))}
                        onCheckedChange={() => toggleCategoryMenus(category.category, category.items)}
                      />
                      <Label htmlFor={`cat-${category.category}`} className="font-semibold cursor-pointer">
                        {category.category}
                      </Label>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-x-4 gap-y-1">
                      {category.items.map((item) => (
                        <div key={item.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={item.key}
                            checked={selectedMenuKeys.includes(item.key)}
                            onCheckedChange={() => toggleMenuKey(item.key)}
                          />
                          <Label htmlFor={item.key} className="text-sm font-normal cursor-pointer">
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
              Save Permissions
            </Button>
          </DialogContent>
        </Dialog>

        {/* Username Dialog */}
        <Dialog open={isUsernameDialogOpen} onOpenChange={setIsUsernameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Username</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editUsername">Username (Login ID)</Label>
                <Input
                  id="editUsername"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Enter username"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Only lowercase letters, numbers, and underscores
                </p>
              </div>
              <Button onClick={handleUpdateUsername} disabled={!newUsername.trim()} className="w-full">
                Save Username
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password for {selectedUser?.username || selectedUser?.first_name || "User"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resetPassword">New Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="resetPassword"
                    type={showResetPassword ? "text" : "password"}
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={resettingPassword || !resetPasswordValue || resetPasswordValue.length < 6}
                className="w-full"
              >
                {resettingPassword ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
