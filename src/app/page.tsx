"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { KRMULogo } from "@/components/ui/KRMULogo";

const MODULES = [
  ["01", "Student Information", "Single record of truth — admissions to alumni"],
  ["02", "Identity & Access", "Role-based control across every module"],
  ["03", "Curriculum", "NEP 2020 · CBCS programme structures"],
  ["04", "Registration", "Self-service semester enrolment"],
  ["05", "Timetabling", "Clash-free, auto-generated schedules"],
  ["06", "Attendance", "Biometric + manual, real-time analytics"],
  ["07", "Examinations", "Marks, grades, transcripts, results"],
  ["08", "Fee Management", "Invoicing, collections, scholarships"],
  ["09", "HR & Faculty", "Records, leave, appraisal, payroll"],
  ["10", "Hostel", "Allocation and occupancy at a glance"],
  ["11", "Transport", "GPS-tracked routes and fleet"],
  ["12", "Grievance", "Ticketed, time-bound resolution"],
  ["13", "Certificates", "Digitally-signed, QR-verifiable"],
  ["14", "Accreditation", "NAAC · NIRF · AISHE · UGC ready"],
  ["15", "MIS Dashboards", "Institution-wide live analytics"],
  ["16", "Notifications", "Email · SMS · App · WhatsApp"],
  ["17", "Documents", "Version-controlled repository"],
  ["18", "Self-Service", "Portals for students & parents"],
  ["19", "AI Assistant", "Conversational, grounded in your data"],
];

const MARQUEE = ["3,842 STUDENTS", "186 FACULTY", "34 PROGRAMMES", "8 SCHOOLS", "NAAC GRADE A", "NIRF #142", "₹18.6 CR COLLECTED", "19 MODULES", "AI-NATIVE"];

function Logo({ light }: { light?: boolean }) {
  return <KRMULogo size={44} light={light} />;
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: "#FFFFFF", color: "#0A1628", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: scrolled ? "14px 40px" : "22px 40px",
        background: scrolled ? "rgba(255,255,255,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(10,22,40,0.08)" : "1px solid transparent",
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          {["Platform", "Modules", "AI-Native"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace("-", "")}`} className="cursor-hover"
              style={{ fontSize: 13, fontWeight: 500, color: "#525252", letterSpacing: "-0.01em", textDecoration: "none" }}>{l}</a>
          ))}
          <Link href="/login" className="btn btn-primary btn-sm cursor-hover" style={{ textDecoration: "none" }}>
            Access Portal
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "180px 40px 60px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="t-mono fade-up" style={{ color: "#737373", marginBottom: 28 }}>AI-NATIVE UNIVERSITY ERP · GURUGRAM</div>
        <h1 style={{ margin: 0 }}>
          {["Run the whole", "university from", "one platform."].map((line, i) => (
            <div key={i} className="reveal-wrap">
              <span className={`reveal-inner reveal-delay-${i}`} style={{
                display: "block", fontSize: "clamp(2.6rem, 8vw, 7rem)", fontWeight: 800,
                letterSpacing: "-0.055em", lineHeight: 0.9,
                color: i === 2 ? "#1565C0" : "#0A1628",
              }}>{line}</span>
            </div>
          ))}
        </h1>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 44, flexWrap: "wrap", gap: 28 }}>
          <p className="fade-up fade-up-4" style={{ maxWidth: 460, fontSize: 17, lineHeight: 1.55, color: "#525252", letterSpacing: "-0.01em" }}>
            Nineteen modules — academics, finance, HR, hostel, accreditation — unified into a single source of truth, with an AI assistant grounded in your live data.
          </p>
          <div className="fade-up fade-up-5" style={{ display: "flex", gap: 12 }}>
            <Link href="/login" className="btn btn-primary btn-lg cursor-hover" style={{ textDecoration: "none" }}>Sign in to ERP</Link>
            <a href="#modules" className="btn btn-ghost btn-lg cursor-hover" style={{ textDecoration: "none" }}>Explore modules</a>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-container" style={{ borderTop: "1px solid rgba(10,22,40,0.1)", borderBottom: "1px solid rgba(10,22,40,0.1)", overflow: "hidden", padding: "20px 0", background: "#0A1628" }}>
        <div className="marquee-track">
          <div className="marquee-track-inner">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 40, fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "white", paddingRight: 40 }}>
                {m}<span style={{ color: "#F5A623" }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PLATFORM */}
      <section id="platform" style={{ padding: "100px 40px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div className="t-mono" style={{ color: "#737373", marginBottom: 20 }}>THE PLATFORM</div>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.95, color: "#0A1628", margin: 0 }}>
              One record.<br/>Every department.<br/><span style={{ color: "#1565C0" }}>Zero silos.</span>
            </h2>
            <p style={{ marginTop: 24, fontSize: 16, lineHeight: 1.6, color: "#525252", maxWidth: 440 }}>
              From a student&apos;s first enquiry to their final transcript — admissions, registration, attendance, exams, fees, and certificates all flow through a single connected system. No re-entry, no reconciliation, no spreadsheets.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              ["3,842", "Students managed"],
              ["186", "Faculty & staff"],
              ["₹18.6 Cr", "Fees reconciled"],
              ["92.7%", "Avg pass rate"],
            ].map(([n, l]) => (
              <div key={l} className="card card-p cursor-hover">
                <div style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.05em", color: "#0A1628", lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: 13, color: "#737373", marginTop: 8 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="modules" style={{ padding: "60px 40px 100px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="t-mono" style={{ color: "#737373", marginBottom: 16 }}>19 MODULES · ONE LOGIN</div>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3.4rem)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.95, color: "#0A1628", margin: 0 }}>Everything the<br/>university runs on.</h2>
          </div>
          <Link href="/login" className="btn btn-primary cursor-hover" style={{ textDecoration: "none" }}>Open the platform →</Link>
        </div>
        <div style={{ borderTop: "1px solid rgba(10,22,40,0.12)" }}>
          {MODULES.map(([no, title, desc]) => (
            <div key={no} className="module-row cursor-hover" style={{
              display: "grid", gridTemplateColumns: "80px 1fr 1.4fr 40px", alignItems: "center", gap: 20,
              padding: "22px 12px", borderBottom: "1px solid rgba(10,22,40,0.1)",
              transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 14, color: "#A0AEC0", letterSpacing: "0.05em" }}>{no}</span>
              <span style={{ fontSize: "clamp(1.1rem, 2vw, 1.7rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0A1628" }}>{title}</span>
              <span style={{ fontSize: 14, color: "#737373", letterSpacing: "-0.01em" }}>{desc}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </div>
          ))}
        </div>
      </section>

      {/* AI NATIVE */}
      <section id="ainative" style={{ background: "#0A1628", color: "white", padding: "110px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
          <div className="t-mono" style={{ color: "#F5A623", marginBottom: 24 }}>AI-NATIVE · POWERED BY AZURE GPT-5.4</div>
          <h2 style={{ fontSize: "clamp(2.2rem, 5vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 0.92, margin: 0, maxWidth: 900 }}>
            Ask your university<br/>anything. <span style={{ color: "#F5A623" }}>Get answers<br/>grounded in real data.</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 60 }}>
            {[
              ["Query in plain English", "“Which students are below 75% attendance and have pending dues?” — answered instantly."],
              ["Scoped to your role", "Registrar, Dean, Faculty, Finance — each sees only what they're permitted to."],
              ["Acts, with consent", "Draft notices, send reminders, generate reports — always confirms before writing."],
            ].map(([t, d]) => (
              <div key={t} style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>{t}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 40px", maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(2.4rem, 6vw, 5.5rem)", fontWeight: 800, letterSpacing: "-0.055em", lineHeight: 0.9, color: "#0A1628", margin: 0 }}>
          Destination<br/><span style={{ color: "#F5A623" }}>Success.</span>
        </h2>
        <p style={{ fontSize: 17, color: "#525252", marginTop: 24, maxWidth: 480, marginLeft: "auto", marginRight: "auto", lineHeight: 1.55 }}>
          Sign in with your KRMU credentials to access the platform.
        </p>
        <Link href="/login" className="btn btn-primary btn-lg cursor-hover" style={{ textDecoration: "none", marginTop: 32, display: "inline-flex" }}>Access the ERP Portal →</Link>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#0A0A0A", color: "white", padding: "60px 40px 40px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}>
          <Logo light />
          <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
            <div>
              <div className="t-mono" style={{ color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>PLATFORM</div>
              {["Modules", "AI Assistant", "Access Portal"].map(l => (
                <Link key={l} href="/login" style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, textDecoration: "none" }} className="cursor-hover">{l}</Link>
              ))}
            </div>
            <div>
              <div className="t-mono" style={{ color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>CAMPUS</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>Sohna Road, Gurugram<br/>Haryana 122103<br/>+91-124-2867800</div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1280, margin: "40px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>© 2025 K.R. Mangalam University. All rights reserved.</span>
          <span className="t-mono" style={{ color: "rgba(255,255,255,0.3)" }}>BUILT FOR EDUCATION</span>
        </div>
      </footer>
    </div>
  );
}
