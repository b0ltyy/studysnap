"use client";

import { useMemo, useState } from "react";

type Q = {
  type: "short_answer" | "true_false" | "multiple_choice";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  choices?: string[];
  answer: string;
  explanation: string;
  evidence: string;
};

type Result = {
  title: string;
  questions: Q[];
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        fontSize: 12,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        padding: "3px 8px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "rgba(0,0,0,0.03)",
      }}
    >
      {text}
    </span>
  );
}

async function fileToBase64NoPrefix(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ---------- SMART SCORING ----------

function normalize(s: string) {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?()[\]{}"'`]/g, "");
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string) {
  const A = normalize(a);
  const B = normalize(b);
  if (!A && !B) return 1;
  if (!A || !B) return 0;
  const dist = levenshtein(A, B);
  const maxLen = Math.max(A.length, B.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

function tokenize(s: string) {
  const norm = normalize(s);
  if (!norm) return [];
  return norm
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter(
      (t) =>
        ![
          "de",
          "het",
          "een",
          "en",
          "of",
          "to",
          "the",
          "a",
          "an",
          "is",
          "zijn",
          "wordt",
          "van",
          "in",
          "op",
          "voor",
        ].includes(t)
    );
}

function jaccard(aTokens: string[], bTokens: string[]) {
  const A = new Set(aTokens);
  const B = new Set(bTokens);
  if (A.size === 0 && B.size === 0) return 1;
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union === 0 ? 0 : inter / union;
}

function parseTrueFalse(s: string): boolean | null {
  const x = normalize(s);
  const trueVals = ["true", "t", "waar", "juist", "yes", "y", "1", "w"];
  const falseVals = ["false", "f", "onwaar", "fout", "no", "n", "0", "o"];
  if (trueVals.includes(x)) return true;
  if (falseVals.includes(x)) return false;
  if (x.startsWith("waar")) return true;
  if (x.startsWith("juist")) return true;
  if (x.startsWith("onwaar")) return false;
  if (x.startsWith("fout")) return false;
  return null;
}

function splitPossibleAnswers(answer: string): string[] {
  const raw = (answer ?? "").trim();
  if (!raw) return [];
  const parts = raw
    .split(/,|\/|;|\bor\b|\bof\b|\ben\b/gi)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) return [raw];
  return Array.from(new Set([raw, ...parts]));
}

type ScoreResult = {
  points: 0 | 0.5 | 1;
  label: "correct" | "partial" | "wrong";
  reason: string;
};

function scoreAnswer(q: Q, userAnswer: string): ScoreResult {
  const uaRaw = (userAnswer ?? "").trim();
  if (!uaRaw) return { points: 0, label: "wrong", reason: "Geen antwoord." };

  if (q.type === "multiple_choice") {
    const ok = normalize(uaRaw) === normalize(q.answer);
    return ok
      ? { points: 1, label: "correct", reason: "Exact match (multiple choice)." }
      : { points: 0, label: "wrong", reason: "Fout gekozen." };
  }

  if (q.type === "true_false") {
    const userTF = parseTrueFalse(uaRaw);
    const ansTF = parseTrueFalse(q.answer);
    if (userTF === null) return { points: 0, label: "wrong", reason: "Gebruik waar/onwaar of juist/fout." };

    if (ansTF === null) {
      const ok = normalize(uaRaw) === normalize(q.answer);
      return ok ? { points: 1, label: "correct", reason: "Match." } : { points: 0, label: "wrong", reason: "Fout." };
    }

    return userTF === ansTF
      ? { points: 1, label: "correct", reason: "Correct waar/onwaar." }
      : { points: 0, label: "wrong", reason: "Fout waar/onwaar." };
  }

  const candidates = splitPossibleAnswers(q.answer);
  const ua = uaRaw;

  let bestSim = 0;
  let bestJ = 0;
  let bestCandidate = candidates[0] ?? q.answer;

  const uaTokens = tokenize(ua);

  for (const cand of candidates) {
    const sim = similarity(ua, cand);
    const j = jaccard(uaTokens, tokenize(cand));
    if (sim > bestSim || (sim === bestSim && j > bestJ)) {
      bestSim = sim;
      bestJ = j;
      bestCandidate = cand;
    }
  }

  const A = normalize(ua);
  const B = normalize(bestCandidate);
  const containsBoost = A.includes(B) || B.includes(A) ? 0.08 : 0;

  const combined = Math.max(bestSim, bestSim * 0.65 + bestJ * 0.35) + containsBoost;

  if (combined >= 0.88) {
    return { points: 1, label: "correct", reason: `Sterke match (sim ${bestSim.toFixed(2)}, kw ${bestJ.toFixed(2)}).` };
  }
  if (combined >= 0.68) {
    return { points: 0.5, label: "partial", reason: `Bijna goed (sim ${bestSim.toFixed(2)}, kw ${bestJ.toFixed(2)}).` };
  }
  return { points: 0, label: "wrong", reason: `Te ver af (sim ${bestSim.toFixed(2)}, kw ${bestJ.toFixed(2)}).` };
}

// ---------- UI ----------

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // typbaar aantal vragen (string, zodat backspace/empty werkt)
  const [questionCountInput, setQuestionCountInput] = useState<string>("10");

  const [result, setResult] = useState<Result | null>(null);

  const questionCount = useMemo(() => {
    const n = parseInt(questionCountInput, 10);
    if (!Number.isFinite(n)) return 10;
    return Math.max(1, Math.min(50, n));
  }, [questionCountInput]);

  const visibleQuestions = useMemo(() => {
    if (!result) return [];
    const n = Math.max(1, Math.min(questionCount, result.questions.length));
    return result.questions.slice(0, n);
  }, [result, questionCount]);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [checked, setChecked] = useState(false);

  // per vraag
  const [pointsByIndex, setPointsByIndex] = useState<Record<number, 0 | 0.5 | 1>>({});
  const [labelByIndex, setLabelByIndex] = useState<Record<number, "correct" | "partial" | "wrong">>({});
  const [reasonByIndex, setReasonByIndex] = useState<Record<number, string>>({});
  const [answersByIndex, setAnswersByIndex] = useState<Record<number, string>>({});
  const [checkedByIndex, setCheckedByIndex] = useState<Record<number, boolean>>({});

  const fileInfo = useMemo(() => {
    if (!file) return null;
    const mb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
    return { name: file.name, mb, type: file.type || "image/*" };
  }, [file]);

  const pageBg =
    "radial-gradient(1200px 700px at 20% 0%, rgba(99,102,241,0.18), transparent 55%), radial-gradient(900px 600px at 90% 10%, rgba(34,197,94,0.14), transparent 55%), #0b0c10";

  const totalPoints = useMemo(() => {
    // tel alleen de zichtbare set
    if (!quizStarted) return 0;
    return visibleQuestions.reduce((sum, _q, i) => sum + (pointsByIndex[i] ?? 0), 0);
  }, [visibleQuestions, pointsByIndex, quizStarted]);

  const checkedCount = useMemo(() => Object.keys(checkedByIndex).length, [checkedByIndex]);

  function resetAll() {
    setError(null);
    setResult(null);
    setQuizStarted(false);
    setIndex(0);
    setCurrentAnswer("");
    setChecked(false);
    setPointsByIndex({});
    setLabelByIndex({});
    setReasonByIndex({});
    setAnswersByIndex({});
    setCheckedByIndex({});
  }

  async function generate() {
    setError(null);
    setResult(null);
    setQuizStarted(false);
    setIndex(0);
    setCurrentAnswer("");
    setChecked(false);
    setPointsByIndex({});
    setLabelByIndex({});
    setReasonByIndex({});
    setAnswersByIndex({});
    setCheckedByIndex({});

    if (!file) {
      setError("Kies een foto (liefst recht en scherp).");
      return;
    }

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
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || raw || `HTTP ${res.status}`);
      }

      const data = json.data as Result;
      if (!data?.questions?.length) throw new Error("AI gaf geen vragen terug. Probeer een scherpere foto.");

      setResult(data);
      // clamp input als user meer vraagt dan beschikbaar
      const available = data.questions.length;
      const desired = parseInt(questionCountInput, 10);
      if (Number.isFinite(desired) && desired > available) setQuestionCountInput(String(available));
    } catch (e: any) {
      setError(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  function startQuiz() {
    if (!result) return;
    setQuizStarted(true);
    setIndex(0);
    setCurrentAnswer(answersByIndex[0] ?? "");
    setChecked(checkedByIndex[0] ?? false);
  }

  function jumpTo(i: number) {
    if (!result) return;
    setIndex(i);
    setCurrentAnswer(answersByIndex[i] ?? "");
    setChecked(checkedByIndex[i] ?? false);
  }

  function checkAnswer() {
    if (!result) return;
    const q = visibleQuestions[index];
    if (!q) return;

    const user = currentAnswer ?? "";
    const alreadyChecked = checkedByIndex[index] ?? false;
    if (alreadyChecked) {
      setChecked(true);
      return;
    }

    const scored = scoreAnswer(q, user);

    setChecked(true);
    setAnswersByIndex((prev) => ({ ...prev, [index]: user }));
    setCheckedByIndex((prev) => ({ ...prev, [index]: true }));
    setPointsByIndex((prev) => ({ ...prev, [index]: scored.points }));
    setLabelByIndex((prev) => ({ ...prev, [index]: scored.label }));
    setReasonByIndex((prev) => ({ ...prev, [index]: scored.reason }));
  }

  function next() {
    if (!result) return;
    if (index >= visibleQuestions.length - 1) return;
    const newIndex = index + 1;
    setIndex(newIndex);
    setCurrentAnswer(answersByIndex[newIndex] ?? "");
    setChecked(checkedByIndex[newIndex] ?? false);
  }

  function prev() {
    if (!result) return;
    if (index <= 0) return;
    const newIndex = index - 1;
    setIndex(newIndex);
    setCurrentAnswer(answersByIndex[newIndex] ?? "");
    setChecked(checkedByIndex[newIndex] ?? false);
  }

  const finished = quizStarted && visibleQuestions.length > 0 ? checkedCount >= visibleQuestions.length : false;

  return (
    <div style={{ minHeight: "100vh", background: pageBg, color: "white" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "22px 16px 0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(99,102,241,1), rgba(34,197,94,0.85))",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>StudySnap</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>smart scoring</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Pill>✅ partial credit</Pill>
          <Pill>🧠 fuzzy match</Pill>
          <Pill>🇳🇱 waar/onwaar ok</Pill>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 40px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 18, alignItems: "start" }}>
          <div>
            <h1 style={{ fontSize: 44, lineHeight: 1.05, margin: "14px 0 10px 0", fontWeight: 900 }}>
              1 vraag per keer.
              <br />
              <span style={{ color: "rgba(99,102,241,1)" }}>Slimme</span> scoring.
            </h1>
            <p style={{ opacity: 0.82, fontSize: 16, maxWidth: 640 }}>
              Spelfoutje? Synoniem? Bijna goed? Je krijgt nu punten i.p.v. “alles of niks”.
            </p>

            {/* Upload card */}
            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                <label
                  style={{
                    display: "inline-flex",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: "rgba(0,0,0,0.25)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>📷 Kies foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    style={{ display: "none" }}
                  />
                </label>

                <button
                  onClick={generate}
                  disabled={busy}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(99,102,241,0.55)",
                    background: busy
                      ? "rgba(255,255,255,0.12)"
                      : "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(34,197,94,0.80))",
                    color: busy ? "rgba(255,255,255,0.7)" : "white",
                    cursor: busy ? "not-allowed" : "pointer",
                    fontWeight: 800,
                  }}
                >
                  {busy ? "Bezig..." : "Genereer vragen"}
                </button>

                <button
                  onClick={resetAll}
                  disabled={busy}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.85)",
                    cursor: busy ? "not-allowed" : "pointer",
                  }}
                >
                  Reset
                </button>
              </div>

              {/* ✅ aantal vragen input - in de upload card */}
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: 12, opacity: 0.85 }}>Aantal vragen:</div>

                <input
                  type="text"
                  inputMode="numeric"
                  value={questionCountInput}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setQuestionCountInput(cleaned);
                  }}
                  onBlur={() => {
                    if (!questionCountInput) {
                      setQuestionCountInput("10");
                      return;
                    }
                    const n = Math.max(1, Math.min(50, parseInt(questionCountInput, 10)));
                    setQuestionCountInput(String(n));
                  }}
                  disabled={busy}
                  style={{
                    width: 110,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.18)",
                    color: "white",
                    outline: "none",
                    cursor: busy ? "not-allowed" : "text",
                    fontWeight: 900,
                  }}
                  placeholder="10"
                />

                <Pill>Min 1 • Max 50</Pill>

                {result && (
                  <>
                    <Pill>
                      Beschikbaar: <b style={{ marginLeft: 6 }}>{result.questions.length}</b>
                    </Pill>
                    <Pill>
                      Gebruikt: <b style={{ marginLeft: 6 }}>{visibleQuestions.length}</b>
                    </Pill>
                  </>
                )}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {fileInfo ? (
                  <>
                    <Pill>✅ {fileInfo.name}</Pill>
                    <Pill>{fileInfo.mb} MB</Pill>
                  </>
                ) : (
                  <Pill>Tip: recht + helder + geen schaduw</Pill>
                )}
              </div>

              {error && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,80,80,0.35)",
                    background: "rgba(255,80,80,0.10)",
                    color: "rgba(255,230,230,0.95)",
                  }}
                >
                  <b>Fout:</b> {error}
                </div>
              )}

              {result && !quizStarted && (
                <div style={{ marginTop: 14 }}>
                  <button
                    onClick={startQuiz}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.22)",
                      color: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Start ({visibleQuestions.length} vragen) →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Score systeem</div>
            <div style={{ fontSize: 13, opacity: 0.8, display: "grid", gap: 8 }}>
              <div>✅ 1.0 = correct</div>
              <div>🟨 0.5 = bijna goed</div>
              <div>❌ 0.0 = fout</div>
              <div style={{ opacity: 0.7 }}>Short answer: fuzzy + keywords</div>
              <div style={{ opacity: 0.7 }}>True/False: waar/onwaar, juist/fout, true/false</div>
            </div>

            {quizStarted && result && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.10)" }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Progress</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill>
                    Vraag <b style={{ marginLeft: 6 }}>{index + 1}/{visibleQuestions.length}</b>
                  </Pill>
                  <Pill>
                    Gecheckt <b style={{ marginLeft: 6 }}>{checkedCount}/{visibleQuestions.length}</b>
                  </Pill>
                  <Pill>
                    Punten <b style={{ marginLeft: 6 }}>{totalPoints.toFixed(1)}/{visibleQuestions.length}</b>
                  </Pill>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
                  {visibleQuestions.map((_, i) => {
                    const wasChecked = checkedByIndex[i] ?? false;
                    const p = pointsByIndex[i] ?? 0;
                    const active = i === index;

                    let bg = "rgba(0,0,0,0.20)";
                    if (wasChecked) {
                      bg =
                        p >= 1
                          ? "rgba(34,197,94,0.25)"
                          : p >= 0.5
                          ? "rgba(255,193,7,0.18)"
                          : "rgba(255,80,80,0.18)";
                    }
                    if (active) bg = "rgba(99,102,241,0.35)";

                    return (
                      <button
                        key={i}
                        onClick={() => jumpTo(i)}
                        style={{
                          height: 26,
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: bg,
                          color: "white",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                        title={`Vraag ${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {finished && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(34,197,94,0.25)",
                      background: "rgba(34,197,94,0.10)",
                    }}
                  >
                    ✅ Klaar. Totaal: <b>{totalPoints.toFixed(1)}/{visibleQuestions.length}</b>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quiz player */}
        {quizStarted && result && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Vraag</div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{result.title || "Oefenvragen"}</div>

            <div
              style={{
                marginTop: 12,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                padding: 16,
              }}
            >
              {(() => {
                const q = visibleQuestions[index];
                if (!q) return null;

                const isMC = q.type === "multiple_choice";
                const canGoPrev = index > 0;
                const canGoNext = index < visibleQuestions.length - 1;

                const label = labelByIndex[index];
                const pts = pointsByIndex[index] ?? 0;

                return (
                  <>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <Pill>
                        {index + 1}/{visibleQuestions.length}
                      </Pill>
                      <Pill>{q.type}</Pill>
                      <Pill>{q.difficulty}</Pill>
                      {checked && (
                        <Pill>
                          {pts >= 1 ? "✅ 1.0" : pts >= 0.5 ? "🟨 0.5" : "❌ 0.0"} {label ? `(${label})` : ""}
                        </Pill>
                      )}
                    </div>

                    <div style={{ marginTop: 12, fontSize: 18 }}>
                      <b>{q.question}</b>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      {isMC && q.choices?.length ? (
                        <div style={{ display: "grid", gap: 8 }}>
                          {q.choices.map((choice, idx) => {
                            const selected = currentAnswer === choice;
                            return (
                              <button
                                key={idx}
                                onClick={() => setCurrentAnswer(choice)}
                                disabled={busy || checked}
                                style={{
                                  textAlign: "left",
                                  padding: "10px 12px",
                                  borderRadius: 14,
                                  border: "1px solid rgba(255,255,255,0.14)",
                                  background: selected ? "rgba(99,102,241,0.25)" : "rgba(0,0,0,0.18)",
                                  color: "white",
                                  cursor: busy || checked ? "not-allowed" : "pointer",
                                  fontWeight: 700,
                                }}
                              >
                                {choice}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          disabled={busy || checked}
                          placeholder="Typ je antwoord…"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(0,0,0,0.18)",
                            color: "white",
                            outline: "none",
                            fontSize: 15,
                          }}
                        />
                      )}
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={checkAnswer}
                        disabled={busy || checked || !currentAnswer.trim()}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: checked ? "rgba(255,255,255,0.10)" : "rgba(34,197,94,0.22)",
                          color: "white",
                          cursor: busy || checked ? "not-allowed" : "pointer",
                          fontWeight: 900,
                        }}
                      >
                        {checked ? "Gecheckt" : "Check"}
                      </button>

                      <button
                        onClick={prev}
                        disabled={!canGoPrev || busy}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          color: "white",
                          cursor: !canGoPrev || busy ? "not-allowed" : "pointer",
                          fontWeight: 800,
                        }}
                      >
                        ← Vorige
                      </button>

                      <button
                        onClick={next}
                        disabled={!canGoNext || busy || !checked}
                        title={!checked ? "Eerst checken" : ""}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: !checked ? "rgba(255,255,255,0.08)" : "rgba(99,102,241,0.25)",
                          color: "white",
                          cursor: !canGoNext || busy || !checked ? "not-allowed" : "pointer",
                          fontWeight: 900,
                        }}
                      >
                        Volgende →
                      </button>
                    </div>

                    {checked && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 12,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(0,0,0,0.20)",
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <Badge text="Correct antwoord" />
                          <div style={{ fontWeight: 900 }}>{q.answer}</div>
                        </div>

                        <div style={{ marginTop: 8, opacity: 0.9 }}>
                          <Badge text="Uitleg" /> <span style={{ opacity: 0.92 }}>{q.explanation}</span>
                        </div>

                        <div style={{ marginTop: 8, opacity: 0.85, fontStyle: "italic" }}>
                          <Badge text="Bewijs" /> <span style={{ opacity: 0.90 }}>{q.evidence}</span>
                        </div>

                        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                          Scoring: {reasonByIndex[index] ?? ""}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        <style jsx>{`
          @media (max-width: 960px) {
            div[style*="grid-template-columns: 1.1fr 0.9fr"] {
              grid-template-columns: 1fr !important;
            }
            h1 {
              font-size: 36px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
