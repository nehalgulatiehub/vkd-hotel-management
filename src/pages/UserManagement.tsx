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
import { UserPlus, Shield, Settings2, Pencil } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

type AppRole = "admin" | "front_desk" | "housekeeping" | "manager" | "account";
type AppModule = "bookings" | "payments" | "restaurant" | "hotels" | "transporters";

interface UserWithRoles {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  roles: AppRole[];
  modules: AppModule[];
}

const AVAILABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "account", label: "Account" },
  { value: "manager", label: "Manager" },
  { value: "front_desk", label: "Front Desk" },
  { value: "housekeeping", label: "Housekeeping" },
];

const AVAILABLE_MODULES: { value: AppModule; label: string }[] = [
  { value: "bookings", label: "Booking & Enquiry" },
  { value: "payments", label: "Payment & Financials" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotels", label: "Hotel Management" },
  { value: "transporters", label: "Transporter Management" },
];

export default function UserManagement() {
  const { isAdmin, isAccount } = useAuthContext();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [selectedModules, setSelectedModules] = useState<AppModule[]>([]);
  const [newUsername, setNewUsername] = useState("");

  const canManage = isAdmin() || isAccount();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, username");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: modulesData, error: modulesError } = await supabase
        .from("user_module_assignments")
        .select("user_id, module");

      if (modulesError) throw modulesError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: "",
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        roles: (rolesData || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as AppRole),
        modules: (modulesData || [])
          .filter((m) => m.user_id === profile.id)
          .map((m) => m.module as AppModule),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
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

  const handleSaveModules = async () => {
    if (!selectedUser) return;

    try {
      await supabase
        .from("user_module_assignments")
        .delete()
        .eq("user_id", selectedUser.id);

      if (selectedModules.length > 0) {
        const { error } = await supabase.from("user_module_assignments").insert(
          selectedModules.map((module) => ({
            user_id: selectedUser.id,
            module,
          }))
        );

        if (error) throw error;
      }

      toast.success("Modules updated successfully");
      setIsModuleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating modules:", error);
      toast.error("Failed to update modules");
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

  const openModuleDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setSelectedModules(user.modules);
    setIsModuleDialogOpen(true);
  };

  const openUsernameDialog = (user: UserWithRoles) => {
    setSelectedUser(user);
    setNewUsername(user.username || "");
    setIsUsernameDialogOpen(true);
  };

  const toggleModule = (module: AppModule) => {
    setSelectedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

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
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Users & Permissions
            </CardTitle>
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
                    <TableHead>Roles</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead className="w-[130px]">Actions</TableHead>
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
                        <div className="flex flex-wrap gap-1">
                          {user.roles.includes("admin") || user.roles.includes("account") ? (
                            <Badge variant="outline" className="text-xs">All Modules</Badge>
                          ) : user.modules.length === 0 ? (
                            <span className="text-muted-foreground text-sm">No modules</span>
                          ) : (
                            user.modules.map((module) => (
                              <Badge key={module} variant="outline" className="text-xs">
                                {module}
                              </Badge>
                            ))
                          )}
                        </div>
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
                              <Button variant="outline" size="icon" className="h-7 w-7">
                                <UserPlus className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Role</DialogTitle>
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
                            onClick={() => openModuleDialog(user)}
                            disabled={user.roles.includes("admin") || user.roles.includes("account")}
                            title={user.roles.includes("admin") || user.roles.includes("account") ? "Admin/Account have all modules" : "Manage modules"}
                          >
                            <Settings2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Module Assignment Dialog */}
        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Assign Modules to {selectedUser?.first_name || "User"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {AVAILABLE_MODULES.map((module) => (
                <div key={module.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={module.value}
                    checked={selectedModules.includes(module.value)}
                    onCheckedChange={() => toggleModule(module.value)}
                  />
                  <Label htmlFor={module.value}>{module.label}</Label>
                </div>
              ))}
              <Button onClick={handleSaveModules} className="w-full">
                Save Modules
              </Button>
            </div>
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
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