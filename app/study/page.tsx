"use client";

import { useEffect, useMemo, useState } from "react";
import AuthPanel from "@/components/AuthPanel";
import { getSupabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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

  if (combined >= 0.88) return { points: 1, label: "correct", reason: `Sterke match (sim ${bestSim.toFixed(2)}, kw ${bestJ.toFixed(2)}).` };
  if (combined >= 0.68) return { points: 0.5, label: "partial", reason: `Bijna goed (sim ${bestSim.toFixed(2)}, kw ${bestJ.toFixed(2)}).` };
  return { points: 0, label: "wrong", reason: `Te ver af (sim ${bestSim.toFixed(2)}, kw ${bestJ.toFixed(2)}).` };
}

export default function StudyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [savedRunKey, setSavedRunKey] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questionCountInput, setQuestionCountInput] = useState<string>("10");
  const [result, setResult] = useState<Result | null>(null);

  const [retryMode, setRetryMode] = useState(false);

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

  const [quizStarted, setQuizStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [checked, setChecked] = useState(false);

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
    "radial-gradient(1200px 700px at 15% 0%, rgba(99,102,241,0.22), transparent 55%), radial-gradient(900px 600px at 92% 10%, rgba(34,197,94,0.16), transparent 55%), radial-gradient(900px 600px at 55% 120%, rgba(236,72,153,0.10), transparent 55%), #07080c";

  const totalPoints = useMemo(() => {
    if (!quizStarted) return 0;
    return visibleQuestions.reduce((sum, _q, i) => sum + (pointsByIndex[i] ?? 0), 0);
  }, [visibleQuestions, pointsByIndex, quizStarted]);

  const checkedCount = useMemo(() => Object.keys(checkedByIndex).length, [checkedByIndex]);

  const finished = quizStarted && visibleQuestions.length > 0 ? checkedCount >= visibleQuestions.length : false;

  function resetAll() {
    setError(null);
    setResult(null);
    setQuizStarted(false);
    setRetryMode(false);
    setIndex(0);
    setCurrentAnswer("");
    setChecked(false);
    setPointsByIndex({});
    setLabelByIndex({});
    setReasonByIndex({});
    setAnswersByIndex({});
    setCheckedByIndex({});
    setSavedRunKey(null);
  }

  function retryWrongQuestions() {
    if (!result) return;

    const wrongIndexes = Object.entries(pointsByIndex)
      .filter(([_, p]) => p < 1)
      .map(([i]) => Number(i));

    if (wrongIndexes.length === 0) return;

    const wrongQuestions = wrongIndexes.map((i) => result.questions[i]);

    setResult({
      ...result,
      questions: shuffle(wrongQuestions),
    });

    setRetryMode(true);
    setQuizStarted(true);
    setIndex(0);
    setCurrentAnswer("");
    setChecked(false);
    setPointsByIndex({});
    setLabelByIndex({});
    setReasonByIndex({});
    setAnswersByIndex({});
    setCheckedByIndex({});
  }

  // ✅ LOAD history (geen insert!)
  async function loadSessions(u: User) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      // stil failen, niet je hele app slopen
      console.error("Load sessions error:", error);
      return;
    }

    setSessions(data ?? []);
  }

  async function saveSessionOnce(params: {
    mode: "normal" | "retry";
    score: number;
    maxScore: number;
    total: number;
    topic?: string | null;
  }) {
    if (!user) return;
    const supabase = getSupabase();

    // unieke key per run (zodat finish-effect niet dubbel opslaat)
    const key = `${params.mode}:${params.score}:${params.maxScore}:${params.total}:${result?.title ?? ""}:${checkedCount}`;
    if (savedRunKey === key) return;

    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id,
      mode: params.mode,
      score: params.score,
      max_score: params.maxScore,
      total_questions: params.total,
      topic: params.topic ?? result?.title ?? null,
    });

    if (!error) {
      setSavedRunKey(key);
      await loadSessions(user);
    } else {
      console.error("Save session error:", error);
    }
  }

  // auto-load sessions when user logs in
  useEffect(() => {
    if (user) loadSessions(user);
    else setSessions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function generate() {
    setError(null);
    setResult(null);
    setQuizStarted(false);
    setRetryMode(false);
    setIndex(0);
    setCurrentAnswer("");
    setChecked(false);
    setPointsByIndex({});
    setLabelByIndex({});
    setReasonByIndex({});
    setAnswersByIndex({});
    setCheckedByIndex({});
    setSavedRunKey(null);

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

      if (!res.ok || !json?.ok) throw new Error(json?.error || raw || `HTTP ${res.status}`);

      const data = json.data as Result;
      if (!data?.questions?.length) {
        throw new Error("AI gaf geen vragen terug. Probeer een scherpere foto.");
      }

      // 🔀 RANDOMIZE QUESTIONS
      const shuffled = shuffle(data.questions);

      setResult({
        ...data,
        questions: shuffled,
      });

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
    setIndex(i);
    setCurrentAnswer(answersByIndex[i] ?? "");
    setChecked(checkedByIndex[i] ?? false);
  }

  function checkAnswer() {
    const q = visibleQuestions[index];
    if (!q) return;

    const ua = currentAnswer ?? "";
    const alreadyChecked = checkedByIndex[index] ?? false;
    if (alreadyChecked) {
      setChecked(true);
      return;
    }

    const scored = scoreAnswer(q, ua);

    setChecked(true);
    setAnswersByIndex((prev) => ({ ...prev, [index]: ua }));
    setCheckedByIndex((prev) => ({ ...prev, [index]: true }));
    setPointsByIndex((prev) => ({ ...prev, [index]: scored.points }));
    setLabelByIndex((prev) => ({ ...prev, [index]: scored.label }));
    setReasonByIndex((prev) => ({ ...prev, [index]: scored.reason }));
  }

  function next() {
    if (index >= visibleQuestions.length - 1) return;
    const newIndex = index + 1;
    setIndex(newIndex);
    setCurrentAnswer(answersByIndex[newIndex] ?? "");
    setChecked(checkedByIndex[newIndex] ?? false);
  }

  function prev() {
    if (index <= 0) return;
    const newIndex = index - 1;
    setIndex(newIndex);
    setCurrentAnswer(answersByIndex[newIndex] ?? "");
    setChecked(checkedByIndex[newIndex] ?? false);
  }

  // save session once when finished
  useEffect(() => {
    if (!finished) return;
    if (!user) return;

    const maxScore = visibleQuestions.length; // 1 punt per vraag
    const score = totalPoints;

    saveSessionOnce({
      mode: retryMode ? "retry" : "normal",
      score,
      maxScore,
      total: visibleQuestions.length,
      topic: result?.title ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, user]);

  return (
    <div style={{ minHeight: "100vh", background: pageBg, color: "white" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "18px 16px" }}>
        {/* Simple header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/logo.png"
              alt="StudySnap"
              width={34}
              height={34}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 14px 40px rgba(0,0,0,0.35)",
              }}
            />

            <div style={{ lineHeight: 1.05 }}>
              <div style={{ fontWeight: 950, letterSpacing: 0.2 }}>StudySnap</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Study mode</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill>🧠 smart scoring</Pill>
            <Pill>🎯 1 at a time</Pill>
          </div>
        </div>

        {/* App */}
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, alignItems: "start" }}>
          {/* Left */}
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              padding: 16,
              boxShadow: "0 35px 100px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ fontWeight: 950, marginBottom: 8 }}>Upload & generate</div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <label
                style={{
                  display: "inline-flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.20)",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                📷 Upload photo
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
              </label>

              <button
                onClick={generate}
                disabled={busy}
                style={{
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(99,102,241,0.55)",
                  background: busy ? "rgba(255,255,255,0.12)" : "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(34,197,94,0.80))",
                  color: busy ? "rgba(255,255,255,0.7)" : "white",
                  cursor: busy ? "not-allowed" : "pointer",
                  fontWeight: 950,
                }}
              >
                {busy ? "Generating..." : "Generate quiz"}
              </button>

              <button
                onClick={resetAll}
                disabled={busy}
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.90)",
                  cursor: busy ? "not-allowed" : "pointer",
                  fontWeight: 800,
                }}
              >
                Reset
              </button>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Questions:</div>
              <input
                type="text"
                inputMode="numeric"
                value={questionCountInput}
                onChange={(e) => setQuestionCountInput(e.target.value.replace(/\D/g, ""))}
                onBlur={() => {
                  if (!questionCountInput) return setQuestionCountInput("10");
                  const n = Math.max(1, Math.min(50, parseInt(questionCountInput, 10)));
                  setQuestionCountInput(String(n));
                }}
                disabled={busy}
                style={{
                  width: 110,
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.18)",
                  color: "white",
                  outline: "none",
                  cursor: busy ? "not-allowed" : "text",
                  fontWeight: 950,
                }}
                placeholder="10"
              />
              <Pill>Min 1 • Max 50</Pill>

              {result && (
                <>
                  <Pill>
                    Available: <b style={{ marginLeft: 6 }}>{result.questions.length}</b>
                  </Pill>
                  <Pill>
                    Using: <b style={{ marginLeft: 6 }}>{visibleQuestions.length}</b>
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
                <Pill>Tip: straight + sharp photo</Pill>
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
                <b>Error:</b> {error}
              </div>
            )}

            {result && !quizStarted && (
              <div style={{ marginTop: 14 }}>
                <button
                  onClick={startQuiz}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.20)",
                    color: "white",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  Start ({visibleQuestions.length} questions) →
                </button>
              </div>
            )}
          </div>

          {/* Right */}
          <div>
            <div
              style={{
                marginTop: 0,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 8 }}>Account</div>
              <AuthPanel onUser={setUser} />
            </div>

            <div
              style={{
                marginTop: 12,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 8 }}>History</div>

              {!user ? (
                <div style={{ fontSize: 13, opacity: 0.8 }}>Log in om je sessies te bewaren.</div>
              ) : sessions.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.8 }}>Nog geen sessies. Maak je eerste quiz af.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {sessions.map((s) => {
                    const pct = s.max_score ? Math.round((Number(s.score) / Number(s.max_score)) * 100) : 0;
                    const date = new Date(s.created_at).toLocaleString();
                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: 10,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(0,0,0,0.18)",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          <div style={{ fontWeight: 900, opacity: 0.95 }}>
                            {s.mode === "retry" ? "🔁 Retry" : "✅ Normal"} • {pct}%
                          </div>
                          <div>{date}</div>
                        </div>
                        <div style={{ fontWeight: 950 }}>
                          {Number(s.score).toFixed(1)}/{Number(s.max_score).toFixed(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 12,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                padding: 16,
              }}
            >
              <div style={{ fontWeight: 950, marginBottom: 8 }}>Progress</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Pill>
                  Checked <b style={{ marginLeft: 6 }}>{checkedCount}/{visibleQuestions.length}</b>
                </Pill>
                <Pill>
                  Score <b style={{ marginLeft: 6 }}>{totalPoints.toFixed(1)}/{visibleQuestions.length}</b>
                </Pill>
                {finished && (
                  <>
                    <Pill>🎉 klaar</Pill>
                    <button
                      onClick={retryWrongQuestions}
                      style={{
                        marginLeft: 8,
                        padding: "6px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,193,7,0.20)",
                        color: "white",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      🔁 Herhaal foutjes
                    </button>
                  </>
                )}
              </div>

              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>
                ✅ 1.0 correct • 🟨 0.5 almost • ❌ 0.0 wrong
              </div>
            </div>
          </div>
        </div>

        {/* Quiz player */}
        {quizStarted && result && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Quiz</div>
            <div style={{ fontSize: 22, fontWeight: 950 }}>{result.title || "Oefenvragen"}</div>

            <div
              style={{
                marginTop: 12,
                borderRadius: 18,
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
                                  fontWeight: 800,
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
                            fontWeight: 650,
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
                          fontWeight: 950,
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
                          fontWeight: 850,
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
                          fontWeight: 950,
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
                          <div style={{ fontWeight: 950 }}>{q.answer}</div>
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
          @media (max-width: 980px) {
            div[style*="grid-template-columns: 1.1fr 0.9fr"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
