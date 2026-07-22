export type DataMode = "local" | "supabase";

export const dataMode: DataMode = import.meta.env.VITE_DATA_MODE === "supabase" ? "supabase" : "local";
export const isSupabaseMode = dataMode === "supabase";

export function requireSupabaseEnvironment() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) {
    throw new Error("Supabase mode requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
  if (publishableKey.startsWith("sb_secret_") || publishableKey.includes("service_role")) {
    throw new Error("A secret or service-role key must never be used in the browser.");
  }
  return { url, publishableKey };
}
