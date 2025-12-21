"use client";

import { useState } from "react";

type Q = {
  type: "short_answer" | "true_false" | "multiple_choice";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
  evidence: string;
};

export default function StudyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; questions: Q[] } | null>(null);

  async function fileToBase64NoPrefix(f: File): Promise<string> {
    const buf = await f.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function generate() {
    setError(null);
    setResult(null);

    if (!file) return setError("Kies een foto.");
    setBusy(true);

    try {
      const imageBase64 = await fileToBase64NoPrefix(file);
      const mimeType = file.type || "image/jpeg";

      const res = await fetch("/api/generate-from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      const raw = await res.text();
      const json = raw ? JSON.parse(raw) : null;

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || raw || `HTTP ${res.status}`);
      }

      setResult(json.data);
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>📸 Foto → Oefenvragen (Gemini)</h1>

      <div style={{ marginTop: 14, padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <div style={{ marginTop: 12 }}>
          <button
            onClick={generate}
            disabled={busy}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111",
              background: busy ? "#eee" : "#111",
              color: busy ? "#111" : "#fff",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? "Bezig..." : "Genereer 10 vragen"}
          </button>
        </div>

        {error && <p style={{ color: "crimson", marginTop: 10 }}>{error}</p>}
      </div>

      {result && (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{result.title}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
            {result.questions.map((q, i) => (
              <div key={i} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.8 }}>
                  #{i + 1} • {q.type} • {q.difficulty}
                </div>

                <p style={{ marginTop: 8 }}>
                  <b>Vraag:</b> {q.question}
                </p>

                {q.type === "multiple_choice" && q.choices?.length ? (
                  <ul>
                    {q.choices.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                ) : null}

                <p>
                  <b>Antwoord:</b> {q.answer}
                </p>
                <p>
                  <b>Uitleg:</b> {q.explanation}
                </p>
                <p style={{ fontStyle: "italic", opacity: 0.8 }}>
                  <b>Bewijs:</b> {q.evidence}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
