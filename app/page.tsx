"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { Space_Grotesk } from "next/font/google";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Home() {
  const pageBg =
    "radial-gradient(1200px 700px at 12% -10%, rgba(14,165,233,0.18), transparent 55%), radial-gradient(900px 600px at 88% 8%, rgba(16,185,129,0.16), transparent 55%), radial-gradient(1000px 700px at 60% 120%, rgba(244,114,182,0.10), transparent 55%), linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(8,11,18,0.98) 70%), #0b0d12";

  return (
    <div className={`page ${space.className}`} style={{ background: pageBg }}>
      <ScrollProgressBar />

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="container">
        <Reveal>
          <header className="nav">
            <div className="brand">
              <img
                src="/logo.png"
                alt="StudySnap"
                width={38}
                height={38}
                className="brand-logo"
              />
              <div>
                <div className="brand-title">StudySnap</div>
                <div className="brand-sub">Photo-to-Quiz Study</div>
              </div>
            </div>

            <div className="nav-actions">
              <Link className="cta nav-cta" href="/study">
                Start studying
              </Link>
            </div>
          </header>
        </Reveal>

        <section className="hero">
          <Reveal delay={0.05}>
            <div className="hero-copy">
              <div className="pill-row">
                <span className="pill">Snap a page</span>
                <span className="pill">One question at a time</span>
                <span className="pill">Smart scoring</span>
              </div>

              <h1 className="hero-title">
                Turn any textbook page
                <br />
                into a quiz in <span>seconds</span>.
              </h1>

              <p className="hero-sub">
                Upload a photo of your notes or textbook. StudySnap generates
                questions and checks your answers with partial credit.
              </p>

              <div className="cta-row">
                <Link className="cta" href="/study">
                  Start studying
                </Link>
              </div>

              <div className="stats">
                <div className="stat">
                  <div className="stat-value">30s</div>
                  <div className="stat-label">From photo to quiz</div>
                </div>
                <div className="stat">
                  <div className="stat-value">4 steps</div>
                  <div className="stat-label">Simple study flow</div>
                </div>
                <div className="stat">
                  <div className="stat-value">Any subject</div>
                  <div className="stat-label">Notes or textbooks</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="how-card">
              <div className="card-head">
                <div>
                  <div className="card-title">How it works</div>
                  <div className="card-sub">Live preview</div>
                </div>
                <div className="badge">AI ready</div>
              </div>

              <div className="image-card">
                <img src="/flow.png" alt="StudySnap flow" />
                <div className="image-overlay">Photo to quiz in seconds</div>
              </div>

              <div className="steps">
                <div className="step">
                  <span className="step-index">1</span>
                  <span>Upload a photo</span>
                </div>
                <div className="step">
                  <span className="step-index">2</span>
                  <span>Generate questions</span>
                </div>
                <div className="step">
                  <span className="step-index">3</span>
                  <span>Answer one by one</span>
                </div>
                <div className="step">
                  <span className="step-index">4</span>
                  <span>Score and feedback</span>
                </div>
              </div>

            </div>
          </Reveal>
        </section>

        <section className="features">
          <Reveal delay={0.05}>
            <h2 className="section-title">Features built for focus</h2>
          </Reveal>

          <div className="feature-grid">
            <Reveal delay={0.08}>
              <div className="feature-card">
                <div className="feature-title">Instant quizzes</div>
                <div className="feature-text">
                  Turn any page into clean, structured questions right away.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="feature-card">
                <div className="feature-title">Zero overload</div>
                <div className="feature-text">
                  One question at a time keeps your brain in flow.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="feature-card">
                <div className="feature-title">Smart feedback</div>
                <div className="feature-text">
                  Partial credit and tips help you learn faster.
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <style jsx>{`
          :global(:root) {
            --surface: rgba(255, 255, 255, 0.06);
            --border: rgba(255, 255, 255, 0.12);
            --muted: rgba(248, 250, 252, 0.7);
            --accent: #7dd3fc;
            --accent-2: #34d399;
          }
          :global(*) {
            box-sizing: border-box;
          }
          .page {
            min-height: 100vh;
            color: #f8fafc;
            position: relative;
            overflow: hidden;
          }
          .container {
            max-width: 1120px;
            margin: 0 auto;
            padding: 24px 16px 96px;
            position: relative;
            z-index: 2;
          }
          .orb {
            position: absolute;
            width: 420px;
            height: 420px;
            border-radius: 999px;
            filter: blur(0px);
            opacity: 0.5;
            pointer-events: none;
            animation: drift 18s ease-in-out infinite;
          }
          .orb-1 {
            top: -140px;
            left: -120px;
            background: radial-gradient(
              circle at 30% 30%,
              rgba(14, 165, 233, 0.4),
              transparent 65%
            );
          }
          .orb-2 {
            top: 120px;
            right: -160px;
            background: radial-gradient(
              circle at 70% 30%,
              rgba(16, 185, 129, 0.35),
              transparent 65%
            );
            animation-delay: -6s;
          }
          .orb-3 {
            bottom: -200px;
            left: 20%;
            background: radial-gradient(
              circle at 50% 60%,
              rgba(244, 114, 182, 0.35),
              transparent 65%
            );
            animation-delay: -12s;
          }
          .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand-logo {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            object-fit: cover;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
          }
          .brand-title {
            font-weight: 700;
            letter-spacing: 0.4px;
          }
          .brand-sub {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
          }
          .nav-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          /* IMPORTANT:
             Link renders an <a> that won't get the styled-jsx scope attribute.
             So we style these as GLOBAL classes. */
          :global(.ghost) {
            text-decoration: none;
            color: #f8fafc;
            font-weight: 600;
            padding: 10px 14px;
            border-radius: 12px;
            border: 1px solid var(--border);
            background: rgba(255, 255, 255, 0.04);
            transition: transform 0.2s ease, border 0.2s ease,
              box-shadow 0.2s ease;
          }

          :global(.cta) {
            text-decoration: none;
            color: white;
            font-weight: 900;
            letter-spacing: 0.2px;

            padding: 12px 18px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.16);

            background: radial-gradient(
                120% 140% at 20% 20%,
                rgba(255, 255, 255, 0.22),
                transparent 45%
              ),
              linear-gradient(
                135deg,
                rgba(125, 211, 252, 0.95),
                rgba(99, 102, 241, 0.92),
                rgba(52, 211, 153, 0.85)
              );

            box-shadow: 0 18px 55px rgba(0, 0, 0, 0.55),
              0 0 0 2px rgba(125, 211, 252, 0.18),
              0 0 40px rgba(125, 211, 252, 0.35),
              0 0 55px rgba(99, 102, 241, 0.22);

            position: relative;
            overflow: hidden;
            transform: translateZ(0);
            transition: transform 0.2s ease, box-shadow 0.2s ease,
              filter 0.2s ease;
            animation: pulse 3.2s ease-in-out infinite;
          }

          :global(.cta)::before {
            content: "";
            position: absolute;
            inset: 1px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            pointer-events: none;
          }

          :global(.cta)::after {
            content: "";
            position: absolute;
            inset: -40% auto auto -35%;
            width: 70%;
            height: 220%;
            background: linear-gradient(
              120deg,
              transparent,
              rgba(255, 255, 255, 0.85),
              transparent
            );
            opacity: 0.65;
            transform: translateX(-60%) rotate(10deg);
            animation: shine 2.6s ease-in-out infinite;
            pointer-events: none;
          }

          :global(.nav-cta) {
            padding: 10px 14px;
            border-radius: 14px;
          }

          .hero {
            margin-top: 32px;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 24px;
            align-items: start;
          }
          .hero-copy {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .pill-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .pill {
            padding: 6px 12px;
            border-radius: 999px;
            border: 1px solid var(--border);
            background: rgba(255, 255, 255, 0.05);
            font-size: 12px;
            color: var(--muted);
          }
          .hero-title {
            font-size: clamp(40px, 5vw, 60px);
            line-height: 1.05;
            margin: 0;
            font-weight: 700;
            letter-spacing: -0.6px;
          }
          .hero-title span {
            color: var(--accent);
          }
          .hero-sub {
            margin: 0;
            max-width: 620px;
            color: var(--muted);
            line-height: 1.6;
          }
          .cta-row {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            align-items: center;
          }
          .stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin-top: 4px;
          }
          .stat {
            padding: 12px 14px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.04);
          }
          .stat-value {
            font-weight: 700;
            font-size: 16px;
          }
          .stat-label {
            margin-top: 4px;
            font-size: 12px;
            color: var(--muted);
          }
          .how-card {
            border-radius: 20px;
            border: 1px solid var(--border);
            background: rgba(15, 23, 42, 0.6);
            padding: 18px;
            box-shadow: 0 35px 100px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation: float 8s ease-in-out infinite;
          }
          .card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .card-title {
            font-weight: 700;
          }
          .card-sub {
            color: var(--muted);
            font-size: 12px;
          }
          .badge {
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(125, 211, 252, 0.18);
            border: 1px solid rgba(125, 211, 252, 0.35);
            font-size: 12px;
          }
          .image-card {
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(2, 6, 23, 0.6);
            padding: 12px;
            position: relative;
            overflow: hidden;
          }
          .image-card img {
            width: 100%;
            display: block;
            border-radius: 12px;
            opacity: 0.96;
          }
          .image-overlay {
            position: absolute;
            bottom: 12px;
            left: 12px;
            right: 12px;
            padding: 8px 12px;
            border-radius: 12px;
            background: rgba(2, 6, 23, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.08);
            font-size: 12px;
          }
          .steps {
            display: grid;
            gap: 10px;
          }
          .step {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: var(--muted);
          }
          .step-index {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(125, 211, 252, 0.16);
            color: #e2e8f0;
            font-weight: 600;
            font-size: 12px;
          }
          .card-cta {
            align-self: flex-start;
          }
          .features {
            margin-top: 48px;
            padding: 64px 0 80px;
          }
          .section-title {
            font-size: 28px;
            margin: 0 0 18px;
            font-weight: 700;
          }
          .feature-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .feature-card {
            border-radius: 18px;
            border: 1px solid var(--border);
            background: rgba(255, 255, 255, 0.05);
            padding: 18px;
            min-height: 140px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .feature-title {
            font-weight: 700;
          }
          .feature-text {
            color: var(--muted);
            line-height: 1.55;
          }

          @keyframes drift {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(20px);
            }
          }
          @keyframes float {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-12px);
            }
          }
          @keyframes pulse {
            0%,
            100% {
              box-shadow: 0 18px 55px rgba(0, 0, 0, 0.55),
                0 0 0 2px rgba(125, 211, 252, 0.18),
                0 0 40px rgba(125, 211, 252, 0.35),
                0 0 55px rgba(99, 102, 241, 0.22);
            }
            50% {
              box-shadow: 0 22px 65px rgba(0, 0, 0, 0.6),
                0 0 0 2px rgba(52, 211, 153, 0.22),
                0 0 46px rgba(52, 211, 153, 0.34),
                0 0 64px rgba(99, 102, 241, 0.28);
            }
          }
          @keyframes shine {
            0% {
              transform: translateX(-70%) rotate(10deg);
              opacity: 0;
            }
            35% {
              opacity: 0.7;
            }
            70% {
              transform: translateX(140%) rotate(10deg);
              opacity: 0;
            }
            100% {
              transform: translateX(140%) rotate(10deg);
              opacity: 0;
            }
          }

          @media (hover: hover) {
            :global(.ghost):hover {
              transform: translateY(-2px);
              border-color: rgba(255, 255, 255, 0.28);
              box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
            }
            :global(.cta):hover {
              transform: translateY(-2px) scale(1.02);
              filter: brightness(1.05);
              box-shadow: 0 24px 75px rgba(0, 0, 0, 0.55),
                0 0 0 2px rgba(52, 211, 153, 0.22),
                0 0 46px rgba(52, 211, 153, 0.34),
                0 0 64px rgba(99, 102, 241, 0.28);
            }
            .feature-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
            }
          }

          @media (max-width: 980px) {
            .hero {
              grid-template-columns: 1fr;
            }
            .stats {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 900px) {
            .feature-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 640px) {
            .container {
              padding-top: 20px;
            }
            .nav {
              flex-direction: column;
              align-items: flex-start;
            }
            .hero-title {
              font-size: 38px;
            }
            .nav-actions {
              width: 100%;
              flex-wrap: wrap;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .orb,
            .how-card,
            :global(.cta),
            .feature-card,
            :global(.cta)::after {
              animation: none;
              transition: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
