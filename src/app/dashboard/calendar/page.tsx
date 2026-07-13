"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { TIMETABLE, STUDENTS, UPCOMING_EXAMS } from "@/lib/data";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYNAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const HOLIDAYS: Record<string, string> = {
  "2025-01-26": "Republic Day", "2025-03-14": "Holi", "2025-02-26": "Maha Shivratri",
};

interface Ev { label: string; type: "class" | "exam" | "fee" | "holiday" }
const TYPE_COLOR: Record<string, string> = { class: "#1565C0", exam: "#C8102E", fee: "#F5A623", holiday: "#0F9D58" };

export default function CalendarPage() {
  const { user } = useApp();
  const role = user?.role;
  const isStudent = role === "student";
  const isFaculty = role === "faculty";
  const me = STUDENTS.find(s => s.enrollmentNo === user?.studentId) || STUDENTS[0];
  const section = `${me.programme}-${me.section}`;

  const [ym, setYm] = useState({ y: 2025, m: 1 }); // Feb 2025 (exam season)
  const first = new Date(ym.y, ym.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();

  // Classes the user has on a given weekday
  const classesOn = (weekday: string): Ev[] => {
    let slots = TIMETABLE.filter(t => t.day === weekday);
    if (isFaculty) slots = slots.filter(t => t.facultyName === user?.name);
    else if (isStudent) slots = slots.filter(t => t.section === section);
    else slots = slots.filter(t => t.section === "B.Tech CSE-A"); // staff: sample section
    return slots.length ? [{ label: `${slots.length} class${slots.length > 1 ? "es" : ""}`, type: "class" }] : [];
  };

  const eventsFor = (dateStr: string, weekday: string): Ev[] => {
    const evs: Ev[] = [...classesOn(weekday)];
    UPCOMING_EXAMS.filter(e => e.date === dateStr).forEach(e => {
      if (isStudent && e.programme !== me.programme && !e.programme.includes("All")) return;
      evs.push({ label: `Exam: ${e.code}`, type: "exam" });
    });
    if (dateStr === "2025-01-31") evs.push({ label: isStudent ? "Fee due" : "Fee deadline", type: "fee" });
    if (HOLIDAYS[dateStr]) evs.push({ label: HOLIDAYS[dateStr], type: "holiday" });
    return evs;
  };

  const cells: ({ day: number; dateStr: string; weekday: string; events: Ev[] } | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday = DAYNAME[new Date(ym.y, ym.m, d).getDay()];
    cells.push({ day: d, dateStr, weekday, events: eventsFor(dateStr, weekday) });
  }

  const move = (delta: number) => setYm(p => { const nm = p.m + delta; return { y: p.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }; });

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="page-hero" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">{isStudent || isFaculty ? "My Calendar" : "Academic Calendar"}</span></div>
            <div className="page-hero-sub fade-up fade-up-1">
              {isFaculty ? "Your classes, exam duties & key dates" : isStudent ? `${section} · classes, exams & deadlines` : "Institution academic calendar"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => move(-1)} className="btn btn-sm cursor-hover" style={{ background: "rgba(255,255,255,0.1)", color: "white", width: 36, padding: 0 }}>‹</button>
            <div style={{ color: "white", fontWeight: 800, fontSize: 15, minWidth: 150, textAlign: "center", letterSpacing: "-0.02em" }}>{MONTHS[ym.m]} {ym.y}</div>
            <button onClick={() => move(1)} className="btn btn-sm cursor-hover" style={{ background: "rgba(255,255,255,0.1)", color: "white", width: 36, padding: 0 }}>›</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#1565C0" }}>
            {WD.map(w => <div key={w} style={{ padding: "10px 12px", fontSize: 11, fontWeight: 700, color: w === "Sun" ? "#ff9aa9" : "white", textTransform: "uppercase", letterSpacing: "0.06em" }}>{w}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {cells.map((c, i) => (
              <div key={i} style={{ minHeight: 104, borderRight: "1px solid rgba(10,22,40,0.05)", borderBottom: "1px solid rgba(10,22,40,0.05)", padding: 8, background: c && (i % 7 === 0) ? "rgba(200,16,46,0.02)" : "white" }}>
                {c && (
                  <>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628", marginBottom: 6 }}>{c.day}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {c.events.slice(0, 3).map((e, j) => (
                        <div key={j} style={{ fontSize: 9.5, fontWeight: 600, color: "white", background: TYPE_COLOR[e.type], borderRadius: 4, padding: "2px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.label}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 14, flexWrap: "wrap" }}>
          {Object.entries(TYPE_COLOR).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#525252", textTransform: "capitalize" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: v }} /> {k === "fee" ? "Fee deadline" : k}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
