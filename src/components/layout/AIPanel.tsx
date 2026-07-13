"use client";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/lib/store";
import { MicButton } from "@/components/ui/MicButton";

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export function AIPanel() {
  const { aiPanelOpen, aiMessages, isAITyping, sendAIMessage, user } = useApp();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, isAITyping]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    sendAIMessage(msg);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const SUGGESTIONS_BY_ROLE: Record<string, string[]> = {
    student: [
      "How am I doing this semester?",
      "Which subject should I focus on?",
      "What's my attendance status?",
      "Do I have any pending fees?",
    ],
    faculty: [
      "Which of my courses have marks pending?",
      "List my students below 75% attendance",
      "What classes do I have today?",
    ],
    staff: [
      "Students below 75% attendance",
      "Fee defaulters this semester",
      "At-risk students this month",
      "Exam schedule status",
    ],
  };
  const roleKey = user?.role === "student" ? "student" : user?.role === "faculty" ? "faculty" : "staff";
  const SUGGESTIONS = SUGGESTIONS_BY_ROLE[roleKey];

  return (
    <div className={`ai-panel ${aiPanelOpen ? "open" : ""}`}>
      {/* Header */}
      <div style={{
        padding: "16px 20px 14px",
        borderBottom: "1px solid rgba(10,22,40,0.07)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "linear-gradient(135deg, #1f6fd6, #1250a6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/>
            <path d="M19 3L19.7 5.3L22 6L19.7 6.7L19 9L18.3 6.7L16 6L18.3 5.3Z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em", color: "#0A1628" }}>KRMU AI Assistant</div>
          <div style={{ fontSize: 11, color: "#737373", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0F9D58", display: "inline-block" }} />
            Connected to ERP data
          </div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 10.5, color: "#A0AEC0", padding: "3px 8px", background: "#F7F7F5", borderRadius: 5, fontWeight: 600, letterSpacing: "0.04em" }}>
          GPT-5.4 Live
        </div>
      </div>

      {/* Role scope */}
      {user && (
        <div style={{ padding: "8px 20px", background: "rgba(245,166,35,0.05)", borderBottom: "1px solid rgba(245,166,35,0.1)", flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: "#b45309", fontWeight: 600 }}>
            {roleKey === "student"
              ? `Personalized for ${user.name} — answers cover only your own records`
              : roleKey === "faculty"
              ? `Scoped to ${user.name} — your courses and students`
              : `Scoped as: ${user.role.replace(/_/g, " ").toUpperCase()} — ${user.department || "KRMU"}`}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
        {aiMessages.map(msg => (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 4 }}>
            {msg.role === "assistant" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: "#1565C0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 11, color: "#A0AEC0", fontWeight: 600 }}>KRMU AI</span>
              </div>
            )}
            <div
              className={msg.role === "user" ? "ai-bubble-user" : "ai-bubble-bot"}
              style={{ maxWidth: "88%" }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
            {msg.sources && msg.sources.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                {msg.sources.map((s, i) => (
                  <span key={i} style={{
                    fontSize: 10, color: "#A0AEC0", background: "#F7F7F5",
                    padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(10,22,40,0.08)",
                  }}>
                    📎 {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {isAITyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/></svg>
            </div>
            <div className="ai-bubble-bot" style={{ padding: "10px 14px" }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {aiMessages.length <= 1 && (
        <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
          <div style={{ fontSize: 10.5, color: "#A0AEC0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Try asking</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { sendAIMessage(s); }}
                className="cursor-hover"
                style={{
                  textAlign: "left", padding: "7px 12px", borderRadius: 8,
                  border: "1px solid rgba(10,22,40,0.08)", background: "#F7F7F5",
                  fontSize: 12.5, color: "#0A1628", cursor: "none",
                  transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
                  letterSpacing: "-0.01em",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "10px 16px 16px",
        borderTop: "1px solid rgba(10,22,40,0.07)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-end",
          background: "white", borderRadius: 12,
          border: "1.5px solid rgba(10,22,40,0.1)",
          padding: "8px 8px 8px 14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          transition: "border-color 0.2s",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about KRMU data…"
            className="cursor-hover"
            rows={1}
            style={{
              flex: 1, border: "none", outline: "none", resize: "none",
              fontSize: 13, color: "#0A1628", background: "transparent",
              letterSpacing: "-0.01em", lineHeight: 1.55,
              maxHeight: 120, overflowY: "auto",
            }}
          />
          <MicButton size={32} onTranscript={setInput} onFinal={(t) => { if (t.trim()) { setInput(""); sendAIMessage(t.trim()); } }} />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isAITyping}
            className="cursor-hover"
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: input.trim() ? "#0A1628" : "#F7F7F5",
              color: input.trim() ? "white" : "#A0AEC0",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "none", flexShrink: 0,
              transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 10, color: "#C4C9D4", textAlign: "center", marginTop: 8 }}>
          Scoped to your permissions · Always confirms before writing data
        </p>
      </div>
    </div>
  );
}
