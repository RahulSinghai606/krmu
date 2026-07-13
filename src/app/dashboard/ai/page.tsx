"use client";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { MicButton } from "@/components/ui/MicButton";

const ACTIONS = [
  { type: "fee_reminders", label: "Send fee reminders", desc: "SMS + WhatsApp to all students with dues", confirm: "Send payment reminders to every student with outstanding dues?" },
  { type: "attendance_notices", label: "Draft shortage notices", desc: "For students below 75% attendance", confirm: "Draft attendance-shortage notices for students below 75% and queue them to mentors?" },
  { type: "publish_pending_results", label: "Publish draft results", desc: "Make all draft exam results visible", confirm: "Publish all draft exam results to students? This makes them visible immediately." },
];

function renderMarkdown(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
}

const CAPABILITIES = [
  { icon: "▣", title: "Query any module", desc: "Ask about students, fees, attendance, exams in plain English", color: "#1565C0" },
  { icon: "✎", title: "Draft & compose", desc: "Generate notices, reminders, reports, NAAC submissions", color: "#0F9D58" },
  { icon: "◈", title: "Spot risks early", desc: "Surface at-risk students, fee defaulters, schedule clashes", color: "#C8102E" },
  { icon: "↗", title: "Take actions", desc: "Send broadcasts, issue certificates — always confirms first", color: "#F5A623" },
];

const PROMPTS_BY_ROLE: Record<string, string[]> = {
  student: [
    "How am I doing this semester?",
    "Which subject should I focus on most?",
    "What's my attendance status?",
    "Do I have any pending fees?",
    "Am I eligible to sit for exams?",
    "How can I improve my CGPA?",
  ],
  faculty: [
    "Which of my courses have marks pending?",
    "List my students below 75% attendance",
    "What classes do I have today?",
    "Summarize results for my courses",
  ],
  staff: [
    "Which students are below 75% attendance?",
    "Summarize fee collection vs target this month",
    "List at-risk students needing intervention",
    "What's the exam schedule status?",
    "Draft a fee reminder for defaulters",
    "Give me the NAAC criteria data summary",
  ],
};

export default function AIPage() {
  const { aiMessages, isAITyping, sendAIMessage, user } = useApp();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, isAITyping]);

  const isStaff = !!user && !["student", "faculty"].includes(user.role);
  const PROMPTS = PROMPTS_BY_ROLE[user?.role === "student" ? "student" : user?.role === "faculty" ? "faculty" : "staff"];

  const runAction = async (a: typeof ACTIONS[number]) => {
    const ok = await confirm({ title: a.label, message: a.confirm, confirmLabel: "Proceed" });
    if (!ok) return;
    try {
      const res = await fetch("/api/actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: a.type, _actor: user?.email, _role: user?.role }),
      });
      const data = await res.json();
      if (res.ok) toast.success("Action completed", data.message);
      else toast.error("Action failed", data.error);
    } catch { toast.error("Action failed", "Network error"); }
  };

  const send = () => { const m = input.trim(); if (!m) return; setInput(""); sendAIMessage(m); };
  const fresh = aiMessages.length <= 1;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden", background: "#FAFAF8" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "linear-gradient(135deg, #1565C0, #F5A623)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/><path d="M19 3L19.7 5.3L22 6L19.7 6.7L19 9L18.3 6.7L16 6L18.3 5.3Z"/></svg>
          </div>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title" style={{ fontSize: 30 }}>KRMU AI Assistant</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Azure GPT-5.4 · Grounded in live ERP data · Scoped to your role</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#F5A623", fontWeight: 700, padding: "5px 12px", background: "rgba(245,166,35,0.12)", borderRadius: 7, border: "1px solid rgba(245,166,35,0.25)" }}>● Connected</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px" }}>
          {fresh && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 26 }}>
                {CAPABILITIES.map(c => (
                  <div key={c.title} className="card" style={{ padding: "16px 18px", display: "flex", gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${c.color}15`, color: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{c.title}</div>
                      <div style={{ fontSize: 11.5, color: "#737373", marginTop: 3, lineHeight: 1.45 }}>{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {isStaff && <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Actions — confirmed before they run</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 22 }}>
                {ACTIONS.map(a => (
                  <button key={a.type} onClick={() => runAction(a)} className="cursor-hover"
                    style={{ textAlign: "left", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(245,166,35,0.3)", background: "rgba(245,166,35,0.06)", cursor: "pointer" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.01em" }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: "#737373", marginTop: 3, lineHeight: 1.4 }}>{a.desc}</div>
                  </button>
                ))}
              </div>
              </>}
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Try asking</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 8 }}>
                {PROMPTS.map(p => (
                  <button key={p} onClick={() => sendAIMessage(p)} className="cursor-hover"
                    style={{ textAlign: "left", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(10,22,40,0.08)", background: "white", fontSize: 12.5, color: "#0A1628", cursor: "none", transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)" }}>
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {(fresh ? [] : aiMessages).map(msg => (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 6 }}>
                {msg.role === "assistant" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/></svg>
                    </div>
                    <span style={{ fontSize: 11.5, color: "#A0AEC0", fontWeight: 700 }}>KRMU AI</span>
                  </div>
                )}
                <div className={msg.role === "user" ? "ai-bubble-user" : "ai-bubble-bot"} style={{ maxWidth: "78%", fontSize: 13.5, lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {msg.sources.map((s, i) => (
                      <span key={i} style={{ fontSize: 10.5, color: "#A0AEC0", background: "white", padding: "3px 9px", borderRadius: 5, border: "1px solid rgba(10,22,40,0.08)" }}>📎 {s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isAITyping && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/></svg>
                </div>
                <div className="ai-bubble-bot" style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 4 }}><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Composer */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(10,22,40,0.07)", background: "white", padding: "16px 24px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "white", borderRadius: 14, border: "1.5px solid rgba(10,22,40,0.12)", padding: "10px 10px 10px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask anything about KRMU data — students, fees, exams, attendance…" rows={1} className="cursor-hover"
              style={{ flex: 1, border: "none", outline: "none", resize: "none", fontSize: 14, color: "#0A1628", background: "transparent", lineHeight: 1.55, maxHeight: 140, letterSpacing: "-0.01em" }} />
            <MicButton size={38} onTranscript={setInput} onFinal={(t) => { if (t.trim()) { setInput(""); sendAIMessage(t.trim()); } }} />
            <button onClick={send} disabled={!input.trim() || isAITyping} className="cursor-hover"
              style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: input.trim() ? "#0A1628" : "#F1F3F6", color: input.trim() ? "white" : "#A0AEC0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "none", flexShrink: 0, transition: "all 0.2s" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <p style={{ fontSize: 10.5, color: "#C4C9D4", textAlign: "center", marginTop: 8 }}>
            Scoped to {user ? user.role.replace(/_/g, " ").toUpperCase() : "your role"} permissions · Confirms before any write action · Responses grounded in ERP data
          </p>
        </div>
      </div>
    </div>
  );
}
