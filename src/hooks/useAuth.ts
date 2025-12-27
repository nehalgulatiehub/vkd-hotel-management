import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "front_desk" | "housekeeping" | "manager" | "account";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  menuPermissions: string[];
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    menuPermissions: [],
    loading: true,
  });

  const fetchUserPermissions = useCallback(async (userId: string) => {
    // Fetch roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roles = (rolesData?.map((r) => r.role as AppRole) || []);

    // Fetch menu permissions
    const { data: menuData } = await supabase
      .from("user_menu_permissions")
      .select("menu_key")
      .eq("user_id", userId);

    const menuPermissions = (menuData?.map((m) => m.menu_key) || []);

    return { roles, menuPermissions };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        if (session?.user) {
          setTimeout(async () => {
            const { roles, menuPermissions } = await fetchUserPermissions(session.user.id);
            setAuthState((prev) => ({
              ...prev,
              roles,
              menuPermissions,
              loading: false,
            }));
          }, 0);
        } else {
          setAuthState((prev) => ({
            ...prev,
            roles: [],
            menuPermissions: [],
            loading: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { roles, menuPermissions } = await fetchUserPermissions(session.user.id);
        setAuthState({
          session,
          user: session.user,
          roles,
          menuPermissions,
          loading: false,
        });
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserPermissions]);

  const hasRole = useCallback(
    (role: AppRole) => authState.roles.includes(role),
    [authState.roles]
  );

  const hasAnyRole = useCallback(
    (roles: AppRole[]) => roles.some((role) => authState.roles.includes(role)),
    [authState.roles]
  );

  const isAdmin = useCallback(
    () => authState.roles.includes("admin"),
    [authState.roles]
  );

  const isAccount = useCallback(
    () => authState.roles.includes("account"),
    [authState.roles]
  );

  const hasMenuAccess = useCallback(
    (menuKey: string) => {
      // Admin and Account have access to all menus
      if (authState.roles.includes("admin") || authState.roles.includes("account")) {
        return true;
      }
      return authState.menuPermissions.includes(menuKey);
    },
    [authState.roles, authState.menuPermissions]
  );

  const canApprovePayment = useCallback(
    (paymentMode: string) => {
      if (authState.roles.includes("admin")) return true;
      if (authState.roles.includes("account") && paymentMode.toLowerCase() !== "cash") return true;
      return false;
    },
    [authState.roles]
  );

  const refreshPermissions = useCallback(async () => {
    if (authState.user) {
      const { roles, menuPermissions } = await fetchUserPermissions(authState.user.id);
      setAuthState((prev) => ({ ...prev, roles, menuPermissions }));
    }
  }, [authState.user, fetchUserPermissions]);

  return {
    ...authState,
    hasRole,
    hasAnyRole,
    isAdmin,
    isAccount,
    hasMenuAccess,
    canApprovePayment,
    refreshPermissions,
  };
}