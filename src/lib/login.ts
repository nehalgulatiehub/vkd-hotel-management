import { supabase } from "@/integrations/supabase/client";

const RETRY_DELAYS_MS = [0, 500, 1200];

const isConnectionError = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes("upstream connect error")
    || normalized.includes("connection failure")
    || normalized.includes("failed to fetch")
    || normalized.includes("networkerror")
    || normalized.includes("load failed")
    || normalized.includes("timeout");
};

export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmedIdentifier = identifier.trim();

  if (trimmedIdentifier.includes("@")) {
    return trimmedIdentifier;
  }

  let lastError = "";

  for (const delay of RETRY_DELAYS_MS) {
    if (delay > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }

    const { data, error } = await supabase.rpc("get_email_by_username", {
      _username: trimmedIdentifier,
    });

    if (!error) {
      if (!data) {
        throw new Error("Username not found. Please check the spelling or use your email.");
      }
      return data;
    }

    lastError = error.message;
    if (!isConnectionError(lastError)) {
      throw new Error(`Login failed: ${lastError}`);
    }
  }

  // Users created inside the app use this deterministic email address. This
  // keeps their login working even if the username lookup endpoint is briefly unavailable.
  if (/^[a-z0-9_]+$/i.test(trimmedIdentifier)) {
    return `${trimmedIdentifier.toLowerCase()}@hotel.local`;
  }

  throw new Error(`Login service is temporarily unavailable. Please try again. (${lastError})`);
}