"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function AuthPanel({
  onUser,
}: {
  onUser?: (user: User | null) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
      onUser?.(data.user ?? null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      onUser?.(u);
      setSent(false);
      setMsg(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [onUser]);

  async function signIn() {
    setMsg(null);
    setBusy(true);
    try {
      const e = email.trim();
      if (!e) {
        setMsg("Vul je email in.");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          // zorgt dat de link terug naar je app komt
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setMsg(err?.message ?? "Login error");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setMsg(null);
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      setMsg(err?.message ?? "Logout error");
    } finally {
      setBusy(false);
    }
  }

  // UI
  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>
          Ingelogd als <b>{user.email}</b>
        </div>
        <button
          onClick={signOut}
          disabled={busy}
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 900,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Logout
        </button>
        {msg && <div style={{ fontSize: 12, opacity: 0.8 }}>{msg}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 13, opacity: 0.9 }}>
        Log in om je <b>history</b> & <b>progress</b> te bewaren.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jij@student.be"
          disabled={busy}
          style={{
            flex: 1,
            minWidth: 220,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.18)",
            color: "white",
            outline: "none",
          }}
        />
        <button
          onClick={signIn}
          disabled={busy}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(99,102,241,0.55)",
            background: "rgba(99,102,241,0.25)",
            color: "white",
            fontWeight: 950,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "..." : "Magic link"}
        </button>
      </div>

      {sent && <div style={{ fontSize: 12, opacity: 0.85 }}>📩 Check je mail. Open de link om in te loggen.</div>}
      {msg && <div style={{ fontSize: 12, opacity: 0.85 }}>{msg}</div>}
    </div>
  );
}
