import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  // Dit bestand kan tijdens build/SSR geladen worden.
  // Dus we maken de client pas aan in de browser.
  if (typeof window === "undefined") {
    // return een dummy (wordt niet gebruikt); voorkomt crash bij prerender
    // @ts-expect-error - we gebruiken dit nooit server-side
    return null;
  }

  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  client = createClient(url, key);
  return client;
}
