import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { DealStore } from "../storage/dealRepository";

export interface CloudConfig { url: string; key: string }

// Public Supabase keys come from public/config.js (window.SUPABASE_*). Dormant if absent.
export function getCloudConfig(): CloudConfig | null {
  const url = window.SUPABASE_URL, key = window.SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

// Lazy: the heavy @supabase/supabase-js bundle is only fetched when sync is configured.
export async function createSupabase(cfg: CloudConfig): Promise<SupabaseClient> {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(cfg.url, cfg.key);
}

export async function fetchUserData(client: SupabaseClient, userId: string): Promise<Partial<DealStore>> {
  const { data, error } = await client.from("user_data").select("data").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data && (data.data as Partial<DealStore>)) || { deals: [], activeId: null, deleted: {} };
}

export async function pushUserData(client: SupabaseClient, userId: string, store: DealStore): Promise<{ error: unknown }> {
  const { error } = await client.from("user_data")
    .upsert({ user_id: userId, data: store, updated_at: new Date().toISOString() });
  return { error };
}

export function signInWithGoogle(client: SupabaseClient): void {
  client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href.split("#")[0] } });
}

export function signOut(client: SupabaseClient): void { client.auth.signOut(); }

export type { SupabaseClient, User };
