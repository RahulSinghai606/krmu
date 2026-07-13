"use client";
import { useEffect, useRef, useState } from "react";

// Voice input via the browser Web Speech API. Streams interim transcript to onTranscript;
// fires onFinal when the user stops speaking. lang en-IN handles Indian English + much Hinglish.
export function MicButton({ onTranscript, onFinal, size = 36 }: { onTranscript: (t: string) => void; onFinal?: (t: string) => void; size?: number }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);
  const textRef = useRef("");
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const SR = (typeof window !== "undefined") && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    // continuous + our own silence window — a natural mid-sentence pause must NOT auto-send.
    rec.continuous = true;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      textRef.current = txt;
      onTranscript(txt);
      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => { try { rec.stop(); } catch { /* */ } }, 2800);
    };
    rec.onend = () => {
      if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
      setListening(false);
      const t = textRef.current.trim();
      textRef.current = "";
      if (t && onFinal) onFinal(t);
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch { /* */ } };
  }, [onTranscript, onFinal]);

  if (!supported) return null;

  const toggle = () => {
    const rec = recRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); }                       // tap again = done speaking → sends
    else { textRef.current = ""; try { rec.start(); setListening(true); } catch { /* already running */ } }
  };

  return (
    <button onClick={toggle} type="button" title={listening ? "Stop listening" : "Speak"} className="cursor-hover"
      style={{
        width: size, height: size, borderRadius: 10, flexShrink: 0, border: "none", cursor: "pointer",
        background: listening ? "#C8102E" : "#F1F3F6", color: listening ? "white" : "#525252",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: listening ? "0 0 0 4px rgba(200,16,46,0.18)" : "none", transition: "all 0.2s",
      }}>
      {listening && <span style={{ position: "absolute", width: size, height: size, borderRadius: 10, animation: "micPulse 1.2s ease-out infinite", background: "rgba(200,16,46,0.3)" }} />}
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  );
}
