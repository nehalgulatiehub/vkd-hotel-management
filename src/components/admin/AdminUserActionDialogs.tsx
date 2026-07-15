import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ADMIN_USER_MENU_ITEMS, AdminUserMenuGroup } from "@/components/admin/adminUserMenuItems";

interface UsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLabel: string;
  username: string;
  onUsernameChange: (value: string) => void;
  onSave: () => void;
}

interface MenuAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLabel: string;
  selectedKeys: string[];
  onToggleKey: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onSave: () => void;
  loading: boolean;
  menuGroups?: AdminUserMenuGroup[];
}

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLabel: string;
  password: string;
  showPassword: boolean;
  onPasswordChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onSave: () => void;
  saving: boolean;
}

interface AdminUserActionDialogsProps {
  usernameDialog: UsernameDialogProps;
  menuAccessDialog: MenuAccessDialogProps;
  passwordDialog: PasswordDialogProps;
}

export function AdminUserActionDialogs({
  usernameDialog,
  menuAccessDialog,
  passwordDialog,
}: AdminUserActionDialogsProps) {
  return (
    <>
      <Dialog open={usernameDialog.open} onOpenChange={usernameDialog.onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User — {usernameDialog.userLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-admin-username">Username</Label>
              <Input
                id="edit-admin-username"
                value={usernameDialog.username}
                onChange={(e) => usernameDialog.onUsernameChange(e.target.value)}
                placeholder="Enter username"
                className="mt-1"
              />
            </div>
            <Button onClick={usernameDialog.onSave} className="w-full" disabled={!usernameDialog.username.trim()}>
              Save Username
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={menuAccessDialog.open} onOpenChange={menuAccessDialog.onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Module Access — {menuAccessDialog.userLabel}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 pb-2">
            <Button type="button" variant="outline" size="sm" onClick={menuAccessDialog.onSelectAll}>
              Select All
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={menuAccessDialog.onClearAll}>
              Clear All
            </Button>
          </div>
          <ScrollArea className="h-[60vh] border rounded-md p-4">
            {menuAccessDialog.loading ? (
              <div className="text-sm text-muted-foreground">Loading module access...</div>
            ) : (
              <div className="space-y-5">
                {(menuAccessDialog.menuGroups || ADMIN_USER_MENU_ITEMS).map((group) => (
                  <div key={group.category} className="space-y-2">
                    <h3 className="text-sm font-semibold">{group.category}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.items.map((item) => (
                        <label key={item.key} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={menuAccessDialog.selectedKeys.includes(item.key)}
                            onChange={() => menuAccessDialog.onToggleKey(item.key)}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Button onClick={menuAccessDialog.onSave} className="w-full" disabled={menuAccessDialog.loading}>
            Save Module Access
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialog.open} onOpenChange={passwordDialog.onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password — {passwordDialog.userLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reset-admin-password">New Password</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="reset-admin-password"
                  type={passwordDialog.showPassword ? "text" : "password"}
                  value={passwordDialog.password}
                  onChange={(e) => passwordDialog.onPasswordChange(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
                <Button type="button" variant="outline" onClick={passwordDialog.onTogglePasswordVisibility}>
                  {passwordDialog.showPassword ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
            <Button
              onClick={passwordDialog.onSave}
              className="w-full"
              disabled={passwordDialog.saving || passwordDialog.password.length < 6}
            >
              {passwordDialog.saving ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}