"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { CalendarDays, IndianRupee, CheckCircle2, AlertTriangle, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";

const ICON: Record<string, React.ReactNode> = {
  calendar: <CalendarDays size={15} />, rupee: <IndianRupee size={15} />, check: <CheckCircle2 size={15} />,
  alert: <AlertTriangle size={15} />, spark: <Sparkles size={15} />, chart: <TrendingUp size={15} />, shield: <ShieldCheck size={15} />,
};
const TONE: Record<string, string> = { warn: "#C8102E", ok: "#0F9D58" };

// Proactive AI briefing — surfaces what matters for the signed-in person before they ask.
export function BriefingCard() {
  const { aiPanelOpen, toggleAIPanel, sendAIMessage } = useApp();
  const [data, setData] = useState<{ greeting: string; lines: { icon: string; text: string; tone?: string }[] } | null>(null);

  useEffect(() => { fetch("/api/briefing").then(r => r.json()).then(d => { if (d.lines) setData(d); }).catch(() => {}); }, []);
  if (!data || data.lines.length === 0) return null;

  const ask = () => { if (!aiPanelOpen) toggleAIPanel(); sendAIMessage("Give me a short summary of what needs my attention today."); };

  return (
    <div className="card" style={{ marginBottom: 22, overflow: "hidden", border: "1px solid rgba(21,101,192,0.18)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", background: "linear-gradient(120deg, rgba(31,111,214,0.1), rgba(245,166,35,0.08))", borderBottom: "1px solid rgba(21,101,192,0.12)" }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #1f6fd6, #F5A623)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={16} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{data.greeting}</div>
          <div style={{ fontSize: 11, color: "#737373" }}>Your AI briefing · what needs attention</div>
        </div>
        <button onClick={ask} className="btn btn-primary btn-sm cursor-hover">Ask AI</button>
      </div>
      <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
        {data.lines.map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#374151" }}>
            <span style={{ color: l.tone ? TONE[l.tone] : "#1565C0", flexShrink: 0, display: "flex" }}>{ICON[l.icon] || <Sparkles size={15} />}</span>
            <span>{l.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
