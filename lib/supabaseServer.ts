import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";

export const supabaseServer = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase env vars missing");
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies,
  });
};
