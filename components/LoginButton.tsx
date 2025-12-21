"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function LoginButton() {
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? window.location.origin + "/study"
              : undefined,
        },
      });
      if (error) console.error(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={login} disabled={busy}>
      {busy ? "Loading..." : "Login"}
    </button>
  );
}
