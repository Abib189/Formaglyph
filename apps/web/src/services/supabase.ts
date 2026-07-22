import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { isSupabaseMode, requireSupabaseEnvironment } from "./dataMode";

export const supabase = isSupabaseMode
  ? (() => {
      const { url, publishableKey } = requireSupabaseEnvironment();
      return createClient<Database>(url, publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    })()
  : null;

export function requireSupabaseClient() {
  if (!supabase) throw new Error("The Supabase client is unavailable in local data mode.");
  return supabase;
}
