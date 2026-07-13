"use client";
import { useState } from "react";
import { TIMETABLE, STUDENTS } from "@/lib/data";
import { useApp } from "@/lib/store";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SLOTS = ["09:00", "10:00", "11:15", "14:00"];
const SLOT_LABELS: Record<string, string> = { "09:00": "09:00–10:00", "10:00": "10:00–11:00", "11:15": "11:15–12:15", "14:00": "14:00–17:00" };

const TYPE_COLOR: Record<string, { bg: string; bar: string; text: string }> = {
  lecture: { bg: "rgba(21,101,192,0.08)", bar: "#1565C0", text: "#1565C0" },
  lab: { bg: "rgba(245,166,35,0.1)", bar: "#F5A623", text: "#b45309" },
  tutorial: { bg: "rgba(15,157,88,0.08)", bar: "#0F9D58", text: "#0F9D58" },
};

export default function TimetablePage() {
  const { user } = useApp();
  const isStudent = user?.role === "student";
  const isFaculty = user?.role === "faculty";
  const isStaff = !isStudent && !isFaculty;

  // Student → own section; faculty → own classes; staff → switchable section.
  const me = STUDENTS.find(s => s.enrollmentNo === user?.studentId) || STUDENTS[0];
  const ownSection = `${me.programme}-${me.section}`;
  const [section, setSection] = useState(isStudent ? ownSection : "B.Tech CSE-A");

  const cell = (day: string, slot: string) =>
    TIMETABLE.find(t => {
      if (t.day !== day || t.startTime !== slot) return false;
      if (isFaculty) return t.facultyName === user?.name;
      return t.section === section;
    });

  const title = isStudent || isFaculty ? "My Timetable" : "Timetable & Scheduling";
  const sub = isFaculty ? `${user?.name} · classes you teach · Even Semester 2024–25`
    : `${section} · Even Semester 2024–25${isStaff ? " · No clashes detected" : ""}`;

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">{title}</span></div>
            <div className="page-hero-sub fade-up fade-up-1">{sub}</div>
          </div>
          {isStaff && (
            <div style={{ display: "flex", gap: 8 }}>
              <select value={section} onChange={e => setSection(e.target.value)} className="field-input cursor-hover" style={{ width: 180, height: 36, background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                <option style={{ color: "#0A1628" }}>B.Tech CSE-A</option>
                <option style={{ color: "#0A1628" }}>B.Tech ECE-A</option>
                <option style={{ color: "#0A1628" }}>MBA-A</option>
              </select>
              <button className="btn btn-gold btn-sm cursor-hover">Auto-Generate</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: `90px repeat(${SLOTS.length}, 1fr)`, borderBottom: "1px solid rgba(10,22,40,0.06)" }}>
            <div style={{ padding: "12px 14px", fontSize: 10.5, fontWeight: 800, color: "#A0AEC0", textTransform: "uppercase", letterSpacing: "0.06em", background: "#1565C0", color: "white" }}>Day</div>
            {SLOTS.map(s => (
              <div key={s} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "white", background: "#1565C0", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>{SLOT_LABELS[s]}</div>
            ))}
          </div>
          {DAYS.map(day => (
            <div key={day} style={{ display: "grid", gridTemplateColumns: `90px repeat(${SLOTS.length}, 1fr)`, borderBottom: "1px solid rgba(10,22,40,0.05)" }}>
              <div style={{ padding: "14px", fontSize: 12.5, fontWeight: 800, color: "#0A1628", display: "flex", alignItems: "center", background: "#F7F7F5" }}>{day.slice(0, 3)}</div>
              {SLOTS.map(slot => {
                const c = cell(day, slot);
                if (!c) return <div key={slot} style={{ padding: 8, borderLeft: "1px solid rgba(10,22,40,0.05)", minHeight: 72 }} />;
                const col = TYPE_COLOR[c.type];
                return (
                  <div key={slot} style={{ padding: 8, borderLeft: "1px solid rgba(10,22,40,0.05)", minHeight: 72 }}>
                    <div className="cursor-hover" style={{ background: col.bg, borderLeft: `3px solid ${col.bar}`, borderRadius: 8, padding: "8px 10px", height: "100%", transition: "transform 0.2s" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.01em", lineHeight: 1.25 }}>{c.courseName}</div>
                      <div style={{ fontSize: 10, color: col.text, fontWeight: 700, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.type} · {c.courseCode}</div>
                      <div style={{ fontSize: 10, color: "#737373", marginTop: 4 }}>{c.facultyName.replace("Dr. ", "").replace("Prof. ", "")}</div>
                      <div style={{ fontSize: 9.5, color: "#A0AEC0", marginTop: 1 }}>{c.room}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          {Object.entries(TYPE_COLOR).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#525252", textTransform: "capitalize" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: v.bar }} /> {k}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
