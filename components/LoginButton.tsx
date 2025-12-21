"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

export default function LoginButton() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function login() {
    await supabase.auth.signInWithOtp({ email });
    setSent(true);
  }

  if (sent) {
    return <p>📩 Check je mail voor de login link</p>;
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@student.be"
        style={{ padding: 8 }}
      />
      <button onClick={login}>Login</button>
    </div>
  );
}
