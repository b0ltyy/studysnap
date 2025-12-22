"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabaseClient";

export default function AuthPanel({
  onUser,
}: {
  onUser?: (user: User | null) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    (async () => {
      // 1) fetch current user
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error) {
        console.error("auth.getUser error:", error);
        setUser(null);
        onUser?.(null);
      } else {
        setUser(data.user ?? null);
        onUser?.(data.user ?? null);
      }
      setLoading(false);

      // 2) listen to auth changes
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        onUser?.(nextUser);
      });

      // cleanup: unsubscribe
      return () => {
        sub.subscription.unsubscribe();
      };
    })();

    return () => {
      mounted = false;
    };
  }, [onUser]);

  if (loading) {
    return <div style={{ fontSize: 13, opacity: 0.8 }}>Loading…</div>;
  }

  if (!user) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Not logged in.
        </div>

        {/* Simple login buttons (email+password is also possible, but this is MVP) */}
        <button
          onClick={async () => {
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
            if (error) console.error("signInWithOAuth error:", error);
          }}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.22)",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Log in with Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 13, opacity: 0.9 }}>
        Logged in as <b>{user.email ?? user.id}</b>
      </div>

      <button
        onClick={async () => {
          const supabase = getSupabase();
          const { error } = await supabase.auth.signOut();
          if (error) console.error("signOut error:", error);
        }}
        style={{
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,80,80,0.14)",
          color: "white",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Log out
      </button>
    </div>
  );
}
