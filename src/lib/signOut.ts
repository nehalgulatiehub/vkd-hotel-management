import { supabase } from "@/integrations/supabase/client";

/**
 * Signs the user out reliably.
 * A missing/expired session or a network hiccup makes Supabase return an error
 * even though the local session is gone, which used to surface as
 * "Error signing out". We always clear local state and never fail.
 */
export async function safeSignOut() {
  try {
    // 'local' only clears this browser's session and does not require a valid
    // server-side session, so it cannot fail with 403 / session_not_found.
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // ignore - fall through to manual cleanup
  }

  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-") && key.includes("auth-token")) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore storage access issues
  }
}
