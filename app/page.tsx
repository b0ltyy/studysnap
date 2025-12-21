"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";

export default function Home() {
  const pageBg =
    "radial-gradient(1200px 700px at 15% 0%, rgba(99,102,241,0.22), transparent 55%), radial-gradient(900px 600px at 92% 10%, rgba(34,197,94,0.16), transparent 55%), radial-gradient(900px 600px at 55% 120%, rgba(236,72,153,0.10), transparent 55%), #07080c";

  return (
    <div style={{ minHeight: "100vh", background: pageBg, color: "white" }}>
      <ScrollProgressBar />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 16px" }}>
        {/* Nav */}
        <Reveal>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
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
                <div style={{ fontWeight: 950, letterSpacing: 0.2 }}>
                  StudySnap
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Photo → Quiz</div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/study"
                style={{
                  textDecoration: "none",
                  color: "white",
                  fontWeight: 900,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                Try it
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Hero */}
        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <Reveal delay={0.05}>
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    fontSize: 12,
                  }}
                >
                  📸 snap a page
                </span>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    fontSize: 12,
                  }}
                >
                  🎯 1 question at a time
                </span>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    fontSize: 12,
                  }}
                >
                  🧠 smart scoring
                </span>
              </div>

              <h1
                style={{
                  fontSize: 56,
                  lineHeight: 1.02,
                  margin: "14px 0 10px 0",
                  fontWeight: 950,
                  letterSpacing: -0.8,
                }}
              >
                Turn any textbook page
                <br />
                into a quiz in{" "}
                <span style={{ color: "rgba(99,102,241,1)" }}>seconds</span>.
              </h1>

              <p
                style={{
                  opacity: 0.82,
                  fontSize: 16,
                  maxWidth: 650,
                  lineHeight: 1.55,
                }}
              >
                Upload a photo of your notes or textbook. StudySnap generates
                questions and checks your answers with partial credit.
              </p>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Link
                  href="/study"
                  style={{
                    textDecoration: "none",
                    color: "white",
                    fontWeight: 950,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(34,197,94,0.82))",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                  }}
                >
                  Start studying →
                </Link>

                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  No login for MVP.
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                padding: 16,
                boxShadow: "0 35px 100px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ fontWeight: 950 }}>How it works</div>
              <div
                style={{
                  marginTop: 10,
                  opacity: 0.86,
                  lineHeight: 1.65,
                  fontSize: 14,
                }}
              >
                <div>
                  <b>1)</b> Upload photo
                </div>
                <div>
                  <b>2)</b> Generate questions
                </div>
                <div>
                  <b>3)</b> Answer one by one
                </div>
                <div>
                  <b>4)</b> Get score + feedback
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <Link
                  href="/study"
                  style={{
                    display: "inline-block",
                    textDecoration: "none",
                    color: "white",
                    fontWeight: 900,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.22)",
                  }}
                >
                  Try it now →
                </Link>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Features */}
        <section style={{ marginTop: 28, padding: "56px 0 80px 0" }}>
          <Reveal delay={0.05}>
            <h2 style={{ fontSize: 28, fontWeight: 950, margin: 0 }}>
              Features
            </h2>
          </Reveal>

          <div
            style={{
              marginTop: 14,
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            }}
          >
            <Reveal delay={0.08}>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 950 }}>Photo → Questions</div>
                <div style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.55 }}>
                  Upload a page and get quiz questions instantly.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 950 }}>1 question at a time</div>
                <div style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.55 }}>
                  Focus mode: no overload, just flow.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 950 }}>Smart scoring</div>
                <div style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.55 }}>
                  Partial credit + feedback so you learn faster.
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <style jsx>{`
          @media (max-width: 980px) {
            div[style*="grid-template-columns: 1.2fr 0.8fr"] {
              grid-template-columns: 1fr !important;
            }
            h1 {
              font-size: 40px !important;
            }
          }
          @media (max-width: 900px) {
            section div[style*="grid-template-columns: repeat(3"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
