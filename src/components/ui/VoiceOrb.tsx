"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";

// Siri-style push-to-talk orb. Tap → speak → it sends to the governed AI orchestrator
// (which answers, navigates, files a grievance, or routes writes to approval) and opens the assistant.
export function VoiceOrb() {
  const { sendAIMessage, aiPanelOpen, toggleAIPanel, user } = useApp();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [note, setNote] = useState("");        // status line: Listening / Sent / Didn't catch
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const finalRef = useRef("");
  const startedRef = useRef(false);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const SR = (typeof window !== "undefined") && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    // continuous + our own silence window — a natural mid-sentence pause must NOT auto-send.
    rec.lang = "en-IN"; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      finalRef.current = txt; setTranscript(txt);
      // Reset the silence window on every bit of speech; only ~3s of true silence ends the turn.
      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => { try { rec.stop(); } catch { /* */ } }, 2800);
    };
    rec.onend = () => {
      if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
      startedRef.current = false;
      setListening(false);
      const t = finalRef.current.trim();
      if (t.length >= 2) {
        setNote("Sent");
        if (!aiPanelOpen) toggleAIPanel();
        sendAIMessage(t);
        setTimeout(() => { setNote(""); setTranscript(""); }, 1800);
      } else {
        setNote("Didn't catch that — tap and speak again");
        setTimeout(() => { setNote(""); setTranscript(""); }, 2500);
      }
    };
    rec.onerror = (e: any) => {
      startedRef.current = false; setListening(false);
      setNote(e?.error === "not-allowed" ? "Microphone blocked — allow mic access" : e?.error === "no-speech" ? "Didn't hear anything — try again" : "Voice error — try again");
      setTimeout(() => setNote(""), 2800);
    };
    recRef.current = rec;
    return () => { try { rec.abort(); } catch { /* */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiPanelOpen]);

  if (!user || !supported) return null;

  const toggle = () => {
    const rec = recRef.current; if (!rec) return;
    if (startedRef.current) { try { rec.stop(); } catch { /* */ } return; }
    finalRef.current = ""; setTranscript(""); setNote("Listening…");
    try { rec.start(); startedRef.current = true; setListening(true); }
    catch { startedRef.current = false; setListening(false); }
  };

  const right = aiPanelOpen ? 404 : 28;

  return (
    <>
      {(listening || note) && (
        <div style={{
          position: "fixed", bottom: 104, right, zIndex: 80000, maxWidth: 320,
          background: "white", borderRadius: 14, padding: "12px 16px", boxShadow: "0 12px 40px rgba(10,22,40,0.2)",
          border: "1px solid rgba(10,22,40,0.06)", transition: "right 0.4s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: listening ? "#C8102E" : note === "Sent" ? "#0F9D58" : "#F5A623", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            {listening ? "● Listening…" : note}
          </div>
          <div style={{ fontSize: 13.5, color: "#0A1628", lineHeight: 1.4 }}>
            {transcript || (listening ? "Speak now — e.g. “wifi not working in block C”, “show my marks”, “open my fees”" : "")}
          </div>
        </div>
      )}

      <button onClick={toggle} title="Speak to KRMU AI" className="voice-orb"
        style={{
          position: "fixed", bottom: 28, right, zIndex: 80001,
          width: 60, height: 60, borderRadius: "50%", border: "none", cursor: "pointer",
          background: listening
            ? "radial-gradient(circle at 30% 30%, #ff5a78, #C8102E)"
            : "radial-gradient(circle at 30% 30%, #2a7fe0, #0A1628)",
          boxShadow: listening ? "0 0 0 0 rgba(200,16,46,0.5)" : "0 8px 28px rgba(10,22,40,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "right 0.4s cubic-bezier(0.16,1,0.3,1), background 0.3s",
          animation: listening ? "orbPulse 1.4s ease-out infinite" : "none",
        }}>
        <span style={{ position: "absolute", inset: 6, borderRadius: "50%", border: "1.5px solid rgba(245,166,35,0.5)", opacity: listening ? 1 : 0.4 }} />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
        </svg>
      </button>
    </>
  );
}
