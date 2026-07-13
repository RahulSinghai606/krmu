"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { generateTimetable, hoursFromCredits, TTSpec, TTResult, SlotType, Subject } from "@/lib/timetable/engine";
import { expandSemester, SemesterPlan, DEFAULT_HOLIDAYS, Holiday } from "@/lib/timetable/semester";
import { printTimetable } from "@/lib/timetable/print";
import { Sparkles, Download, Plus, Trash2, Wand2, Calendar } from "lucide-react";

const TYPE_BG: Record<SlotType, string> = { lecture: "#EAF2FC", lab: "#FDF3E3", tutorial: "#E9F7EF" };
const TYPE_BAR: Record<SlotType, string> = { lecture: "#1565C0", lab: "#C77800", tutorial: "#0F9D58" };
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_PERIODS = [
  { label: "09:00–10:00", start: "09:00", end: "10:00" },
  { label: "10:00–11:00", start: "10:00", end: "11:00" },
  { label: "11:00–12:00", start: "11:00", end: "12:00" },
  { label: "12:00–13:00", start: "12:00", end: "13:00", isBreak: true },
  { label: "13:00–14:00", start: "13:00", end: "14:00" },
  { label: "14:00–15:00", start: "14:00", end: "15:00" },
  { label: "15:00–16:00", start: "15:00", end: "16:00" },
];

const DEFAULT_SPEC: TTSpec = {
  programme: "B.Tech", branch: "Computer Science & Engineering", semester: 3, section: "A",
  academicYear: "2025–26", studentCount: 120, targetCredits: 20,
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  periods: DEFAULT_PERIODS,
  subjects: [
    { code: "CS301", name: "Data Structures & Algorithms", faculty: "Dr. Rajeev Sharma", credits: 4, type: "lecture", hoursPerWeek: 4 },
    { code: "CS302", name: "Database Management Systems", faculty: "Dr. Sunita Agarwal", credits: 4, type: "lecture", hoursPerWeek: 4 },
    { code: "CS303", name: "Operating Systems", faculty: "Dr. Amit Verma", credits: 3, type: "lecture", hoursPerWeek: 3 },
    { code: "MA301", name: "Discrete Mathematics", faculty: "Dr. Rohit Bhatnagar", credits: 4, type: "lecture", hoursPerWeek: 4 },
    { code: "CS304", name: "Object Oriented Programming", faculty: "Dr. Kavitha Reddy", credits: 3, type: "lecture", hoursPerWeek: 3 },
    { code: "CS305", name: "Data Structures Lab", faculty: "Dr. Rajeev Sharma", credits: 2, type: "lab", hoursPerWeek: 4 },
  ],
  unavailable: [],
};

export default function TimetableGeneratorPage() {
  const toast = useToast();
  const [spec, setSpec] = useState<TTSpec>(DEFAULT_SPEC);
  const [result, setResult] = useState<TTResult | null>(null);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [changes, setChanges] = useState<{ applied: string[]; skipped: string[]; summary: string } | null>(null);
  const [semStart, setSemStart] = useState("2026-07-21");
  const [semEnd, setSemEnd] = useState("2026-12-19");
  const [holidays, setHolidays] = useState<Holiday[]>(DEFAULT_HOLIDAYS);
  const [view, setView] = useState<"weekly" | "semester">("weekly");
  const [semester, setSemester] = useState<SemesterPlan | null>(null);
  const [openMonth, setOpenMonth] = useState<string | null>(null);

  // Expand the weekly grid across the full semester whenever the plan or calendar changes.
  useEffect(() => {
    if (result) setSemester(expandSemester(spec, result, semStart, semEnd, holidays));
    else setSemester(null);
  }, [result, semStart, semEnd, holidays, spec]);

  const addHoliday = () => setHolidays(h => [...h, { date: semStart, name: "New Holiday" }]);
  const updateHoliday = (i: number, patch: Partial<Holiday>) => setHolidays(h => h.map((x, j) => j === i ? { ...x, ...patch } : x));
  const removeHoliday = (i: number) => setHolidays(h => h.filter((_, j) => j !== i));

  const set = (patch: Partial<TTSpec>) => setSpec(s => ({ ...s, ...patch }));
  const totalCredits = spec.subjects.reduce((a, s) => a + s.credits, 0);

  const updateSub = (i: number, patch: Partial<Subject>) => setSpec(s => {
    const subs = s.subjects.map((x, j) => {
      if (j !== i) return x;
      const merged = { ...x, ...patch };
      if (patch.credits !== undefined || patch.type !== undefined) merged.hoursPerWeek = hoursFromCredits(merged.type, merged.credits);
      return merged;
    });
    return { ...s, subjects: subs };
  });
  const addSub = () => setSpec(s => ({ ...s, subjects: [...s.subjects, { code: `NEW${s.subjects.length}`, name: "New Course", faculty: "TBD", credits: 3, type: "lecture", hoursPerWeek: 3 }] }));
  const removeSub = (i: number) => setSpec(s => ({ ...s, subjects: s.subjects.filter((_, j) => j !== i) }));
  const toggleDay = (d: string) => setSpec(s => ({ ...s, days: s.days.includes(d) ? s.days.filter(x => x !== d) : ALL_DAYS.filter(x => s.days.includes(x) || x === d) }));

  const generate = () => {
    if (!spec.subjects.length) { toast.error("Add at least one course"); return; }
    if (!spec.days.length) { toast.error("Select at least one working day"); return; }
    setGenerating(true); setChanges(null);
    // brief staged progress so the constraint-solve reads as real work
    setTimeout(() => {
      setResult(generateTimetable(spec));
      setGenerating(false);
      toast.success("Timetable generated", `${spec.subjects.length} courses scheduled across the semester`);
    }, 900);
  };

  const refine = async () => {
    if (!refineText.trim()) return;
    if (!result) { toast.error("Generate a timetable first"); return; }
    setRefining(true);
    try {
      const res = await fetch("/api/timetable/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spec, instruction: refineText }) });
      const d = await res.json();
      if (res.ok) {
        setSpec(d.spec); setResult(d.result); setChanges({ applied: d.applied, skipped: d.skipped, summary: d.summary });
        setRefineText("");
        toast.success("Timetable updated", d.summary || `${d.applied.length} change(s) applied`);
      } else toast.error("Could not apply", d.error || "Try rephrasing");
    } catch { toast.error("Failed", "Network error"); }
    finally { setRefining(false); }
  };

  const F = { fontSize: 13, height: 36 };

  return (
    <div style={{ minHeight: "100vh" }}>
      {(generating || refining) && <GenOverlay refining={refining} branch={spec.branch} sem={spec.semester} />}
      <div className="page-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">AI-Assisted Timetable Prep</span></div>
            <div className="page-hero-sub fade-up fade-up-1">Auto-build a whole-semester schedule · credit-balanced · clash-free · export to PDF · refine in plain English</div>
          </div>
          <Calendar size={40} color="rgba(255,255,255,0.5)" strokeWidth={1.4} />
        </div>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ── CONFIG ── */}
        <div className="card card-p">
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 14 }}>1 · Semester Setup</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
            <div><label className="field-label">Programme</label><input className="field-input" style={F} value={spec.programme} onChange={e => set({ programme: e.target.value })} /></div>
            <div><label className="field-label">Branch / Department</label><input className="field-input" style={F} value={spec.branch} onChange={e => set({ branch: e.target.value })} /></div>
            <div><label className="field-label">Semester</label><input type="number" className="field-input" style={F} value={spec.semester} onChange={e => set({ semester: +e.target.value })} /></div>
            <div><label className="field-label">Section</label><input className="field-input" style={F} value={spec.section} onChange={e => set({ section: e.target.value })} /></div>
            <div><label className="field-label">Academic Year</label><input className="field-input" style={F} value={spec.academicYear} onChange={e => set({ academicYear: e.target.value })} /></div>
            <div><label className="field-label">No. of Students</label><input type="number" className="field-input" style={F} value={spec.studentCount} onChange={e => set({ studentCount: +e.target.value })} /></div>
            <div><label className="field-label">Target Credits</label><input type="number" className="field-input" style={F} value={spec.targetCredits} onChange={e => set({ targetCredits: +e.target.value })} /></div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="field-label">Working Days</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {ALL_DAYS.map(d => (
                <button key={d} onClick={() => toggleDay(d)} className="cursor-hover" style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid",
                  borderColor: spec.days.includes(d) ? "#1565C0" : "rgba(10,22,40,0.12)",
                  background: spec.days.includes(d) ? "rgba(21,101,192,0.1)" : "white",
                  color: spec.days.includes(d) ? "#1565C0" : "#737373",
                }}>{d.slice(0, 3)}</button>
              ))}
              <span style={{ fontSize: 11.5, color: "#A0AEC0", alignSelf: "center", marginLeft: 6 }}>{spec.periods.filter(p => !p.isBreak).length} teaching periods/day · 1 break</span>
            </div>
          </div>

          {/* Semester duration + holidays */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(10,22,40,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>Semester Duration & Holidays</div>
              <button onClick={addHoliday} className="btn btn-ghost btn-sm cursor-hover" style={{ display: "flex", alignItems: "center", gap: 5 }}><Plus size={13} /> Add holiday</button>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
              <div><label className="field-label">Semester Start</label><input type="date" className="field-input cursor-hover" style={F} value={semStart} onChange={e => setSemStart(e.target.value)} /></div>
              <div><label className="field-label">Semester End</label><input type="date" className="field-input cursor-hover" style={F} value={semEnd} onChange={e => setSemEnd(e.target.value)} /></div>
              <div style={{ alignSelf: "flex-end", fontSize: 11.5, color: "#A0AEC0", paddingBottom: 8 }}>{semester ? `${semester.teachingDays} teaching days · ${semester.weeks} weeks · ${semester.holidays.length} holidays excluded` : "≈ 6-month academic term"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {holidays.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="date" className="field-input" style={{ height: 30, fontSize: 12, width: 150 }} value={h.date} onChange={e => updateHoliday(i, { date: e.target.value })} />
                  <input className="field-input" style={{ height: 30, fontSize: 12, flex: 1, maxWidth: 320 }} value={h.name} onChange={e => updateHoliday(i, { name: e.target.value })} />
                  <button onClick={() => removeHoliday(i)} className="cursor-hover" style={{ background: "none", border: "none", color: "#C8102E", padding: 4 }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SUBJECTS ── */}
        <div className="card card-p">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>2 · Courses & Credits</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="chip" style={{ background: totalCredits === spec.targetCredits ? "rgba(15,157,88,0.12)" : "rgba(200,16,46,0.1)", color: totalCredits === spec.targetCredits ? "#0F9D58" : "#C8102E", fontWeight: 700 }}>
                {totalCredits} / {spec.targetCredits} credits
              </span>
              <button onClick={addSub} className="btn btn-ghost btn-sm cursor-hover" style={{ display: "flex", alignItems: "center", gap: 5 }}><Plus size={14} /> Add course</button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 720 }}>
              <thead><tr><th>Code</th><th>Course</th><th>Faculty</th><th>Type</th><th>Credits</th><th>Hrs/Wk</th><th></th></tr></thead>
              <tbody>
                {spec.subjects.map((s, i) => (
                  <tr key={i}>
                    <td><input className="field-input" style={{ height: 30, fontSize: 12, width: 68 }} value={s.code} onChange={e => updateSub(i, { code: e.target.value })} /></td>
                    <td><input className="field-input" style={{ height: 30, fontSize: 12, minWidth: 180 }} value={s.name} onChange={e => updateSub(i, { name: e.target.value })} /></td>
                    <td><input className="field-input" style={{ height: 30, fontSize: 12, minWidth: 140 }} value={s.faculty} onChange={e => updateSub(i, { faculty: e.target.value })} /></td>
                    <td>
                      <select className="field-input cursor-hover" style={{ height: 30, fontSize: 12 }} value={s.type} onChange={e => updateSub(i, { type: e.target.value as SlotType })}>
                        <option value="lecture">Lecture</option><option value="lab">Lab</option><option value="tutorial">Tutorial</option>
                      </select>
                    </td>
                    <td><input type="number" className="field-input" style={{ height: 30, fontSize: 12, width: 58 }} value={s.credits} onChange={e => updateSub(i, { credits: +e.target.value })} /></td>
                    <td><input type="number" className="field-input" style={{ height: 30, fontSize: 12, width: 58 }} value={s.hoursPerWeek} onChange={e => updateSub(i, { hoursPerWeek: +e.target.value })} /></td>
                    <td><button onClick={() => removeSub(i)} className="cursor-hover" style={{ background: "none", border: "none", color: "#C8102E", padding: 4 }}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={generate} className="btn btn-primary cursor-hover" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 7 }}>
            <Sparkles size={16} /> Generate Timetable
          </button>
        </div>

        {/* ── RESULT ── */}
        {result && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(10,22,40,0.06)" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0A1628" }}>{spec.branch} · Semester {spec.semester} · Section {spec.section}</div>
                <div style={{ fontSize: 12, color: "#A0AEC0", marginTop: 2 }}>{spec.academicYear} · {spec.studentCount} students ({result.sections} section{result.sections > 1 ? "s" : ""}) · {result.totalContactHours} contact hrs/week{semester ? ` · ${semester.teachingDays} teaching days` : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", background: "#EEF3FB", borderRadius: 9, padding: 3 }}>
                  {(["weekly", "semester"] as const).map(v => (
                    <button key={v} onClick={() => setView(v)} className="cursor-hover" style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", background: view === v ? "white" : "transparent", color: view === v ? "#1565C0" : "#737373", boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                      {v === "weekly" ? "Weekly" : "Full Semester"}
                    </button>
                  ))}
                </div>
                <button onClick={() => printTimetable(spec, result, semester || undefined)} className="btn btn-gold cursor-hover" style={{ display: "flex", alignItems: "center", gap: 7 }}><Download size={15} /> Download PDF</button>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div style={{ margin: "14px 20px 0", padding: "10px 14px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 10, fontSize: 12.5, color: "#b45309" }}>
                ⚠ {result.warnings.join(" ")}
              </div>
            )}

            {view === "weekly" && (<div>
            {/* grid */}
            <div style={{ padding: 20, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr>
                    <th style={thHead}>Day / Time</th>
                    {spec.periods.map((p, i) => <th key={i} style={{ ...thHead, ...(p.isBreak ? { background: "#f1f4f9", color: "#94a2b8", width: 34 } : {}) }}>{p.isBreak ? "Break" : p.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {spec.days.map((day, d) => (
                    <tr key={day}>
                      <td style={dayHead}>{day.slice(0, 3)}</td>
                      {spec.periods.map((p, pi) => {
                        if (p.isBreak) return <td key={pi} style={{ ...cellBase, background: "#f6f8fb" }} />;
                        const c = result.grid[d][pi];
                        if (!c) return <td key={pi} style={{ ...cellBase, color: "#c4c9d4", textAlign: "center" }}>—</td>;
                        const prev = pi > 0 ? result.grid[d][pi - 1] : null;
                        const contd = prev && prev.code === c.code && c.type === "lab";
                        return (
                          <td key={pi} style={{ ...cellBase, background: TYPE_BG[c.type], borderLeft: `3px solid ${TYPE_BAR[c.type]}` }}>
                            {contd ? <span style={{ fontSize: 10, color: "#8a93a5", fontStyle: "italic" }}>contd.</span> : <>
                              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0A1628", lineHeight: 1.15 }}>{c.name}</div>
                              <div style={{ fontSize: 9.5, color: TYPE_BAR[c.type], fontWeight: 700, marginTop: 2 }}>{c.code} · {c.type.toUpperCase()}</div>
                              <div style={{ fontSize: 10, color: "#525252", marginTop: 1 }}>{c.faculty.replace(/^Dr\. /, "")}</div>
                              <div style={{ fontSize: 9.5, color: "#A0AEC0" }}>{c.room}</div>
                            </>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* credit summary */}
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1565C0", textTransform: "uppercase", letterSpacing: "0.04em", margin: "8px 0 10px" }}>Course & Credit Structure</div>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl" style={{ minWidth: 640 }}>
                  <thead><tr><th>Code</th><th>Course</th><th>Faculty</th><th>Type</th><th>Credits</th><th>Hrs placed</th></tr></thead>
                  <tbody>
                    {result.creditSummary.map(s => (
                      <tr key={s.code}>
                        <td style={{ fontWeight: 700 }}>{s.code}</td><td>{s.name}</td><td>{s.faculty}</td>
                        <td><span className="chip" style={{ background: TYPE_BG[s.type], color: TYPE_BAR[s.type], textTransform: "capitalize" }}>{s.type}</span></td>
                        <td style={{ fontWeight: 700 }}>{s.credits}</td>
                        <td style={{ color: s.hoursPlaced < s.hoursNeeded ? "#C8102E" : "#0F9D58", fontWeight: 700 }}>{s.hoursPlaced}/{s.hoursNeeded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>)}

            {view === "semester" && semester && (
              <div style={{ padding: 20 }}>
                {/* stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 18 }}>
                  {[
                    { k: "Teaching days", v: semester.teachingDays, c: "#1565C0" },
                    { k: "Weeks", v: semester.weeks, c: "#0F9D58" },
                    { k: "Holidays excluded", v: semester.holidays.length, c: "#C8102E" },
                    { k: "Weekend days off", v: semester.weekendDaysOff, c: "#9C27B0" },
                    { k: "Total sessions", v: semester.totalSessions, c: "#C77800" },
                  ].map(t => (
                    <div key={t.k} style={{ background: "#F7FAFF", border: "1px solid rgba(21,101,192,0.1)", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: t.c, letterSpacing: "-0.02em" }}>{t.v}</div>
                      <div style={{ fontSize: 11, color: "#737373", marginTop: 2 }}>{t.k}</div>
                    </div>
                  ))}
                </div>

                {/* delivery */}
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1565C0", textTransform: "uppercase", letterSpacing: "0.04em", margin: "4px 0 10px" }}>Hours Delivery — Whole Semester</div>
                <div style={{ overflowX: "auto", marginBottom: 20 }}>
                  <table className="tbl" style={{ minWidth: 640 }}>
                    <thead><tr><th>Code</th><th>Course</th><th>Credits</th><th>Hrs/Wk</th><th>Delivered</th><th>Required</th><th>Status</th></tr></thead>
                    <tbody>
                      {semester.delivery.map(d => (
                        <tr key={d.code}>
                          <td style={{ fontWeight: 700 }}>{d.code}</td><td>{d.name}</td><td>{d.credits}</td><td>{d.weeklyHours}</td>
                          <td style={{ fontWeight: 700 }}>{d.deliveredHours}</td><td>{d.requiredHours}</td>
                          <td><span className="chip" style={{ background: d.complete ? "rgba(15,157,88,0.12)" : "rgba(200,16,46,0.1)", color: d.complete ? "#0F9D58" : "#C8102E", fontWeight: 700 }}>{d.complete ? "On track" : "Short"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* holidays */}
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1565C0", textTransform: "uppercase", letterSpacing: "0.04em", margin: "4px 0 10px" }}>Holidays Excluded</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                  {semester.holidays.length === 0 && <span style={{ fontSize: 12.5, color: "#A0AEC0" }}>None fall within the working span.</span>}
                  {semester.holidays.map(h => (
                    <span key={h.date} style={{ fontSize: 12, background: "rgba(200,16,46,0.07)", color: "#C8102E", padding: "5px 10px", borderRadius: 8, fontWeight: 600 }}>
                      {new Date(h.date + "T00:00:00Z").toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "UTC" })} · {h.name}
                    </span>
                  ))}
                </div>

                {/* day-by-day, month collapsible */}
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1565C0", textTransform: "uppercase", letterSpacing: "0.04em", margin: "4px 0 10px" }}>Day-by-Day Schedule</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {semester.byMonth.map(m => (
                    <div key={m.month} className="card" style={{ overflow: "hidden" }}>
                      <button onClick={() => setOpenMonth(openMonth === m.month ? null : m.month)} className="cursor-hover" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 16px", background: "none", border: "none", fontSize: 13, fontWeight: 700, color: "#0A1628" }}>
                        <span>{m.month} <span style={{ color: "#A0AEC0", fontWeight: 500 }}>· {m.days.length} teaching days</span></span>
                        <span style={{ color: "#A0AEC0" }}>{openMonth === m.month ? "▲" : "▼"}</span>
                      </button>
                      {openMonth === m.month && (
                        <div style={{ overflowX: "auto", borderTop: "1px solid rgba(10,22,40,0.06)" }}>
                          <table className="tbl">
                            <thead><tr><th style={{ width: 130 }}>Date</th><th style={{ width: 70 }}>Day</th><th>Classes</th></tr></thead>
                            <tbody>
                              {m.days.map(d => (
                                <tr key={d.date}>
                                  <td>{new Date(d.date + "T00:00:00Z").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}</td>
                                  <td style={{ fontWeight: 600 }}>{d.weekday.slice(0, 3)}</td>
                                  <td style={{ display: "flex", gap: 5, flexWrap: "wrap", padding: "8px 12px" }}>
                                    {d.sessions.length === 0 ? <span style={{ color: "#A0AEC0" }}>—</span> : d.sessions.map((s, si) => (
                                      <span key={si} style={{ fontSize: 10.5, background: TYPE_BG[s.type], color: TYPE_BAR[s.type], padding: "2px 7px", borderRadius: 6, fontWeight: 700 }} title={`${s.name} · ${s.faculty} · ${s.room}`}>{s.period.split("–")[0]} {s.code}</span>
                                    ))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI REFINE ── */}
        {result && (
          <div className="card card-p" style={{ border: "1px solid rgba(21,101,192,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #1f6fd6, #F5A623)", display: "flex", alignItems: "center", justifyContent: "center" }}><Wand2 size={16} color="white" /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628" }}>3 · Refine with AI</div>
                <div style={{ fontSize: 11.5, color: "#A0AEC0" }}>Describe changes in plain English — the AI edits the plan and regenerates</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <input value={refineText} onChange={e => setRefineText(e.target.value)} onKeyDown={e => e.key === "Enter" && refine()}
                placeholder='e.g. "Reduce DBMS to 3 credits and increase OS to 4. Dr. Amit Verma is unavailable on Friday."'
                className="field-input cursor-hover" style={{ flex: 1, height: 40, fontSize: 13 }} />
              <button onClick={refine} disabled={refining} className="btn btn-primary cursor-hover" style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                <Sparkles size={15} /> {refining ? "Applying…" : "Apply with AI"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {["Reduce Discrete Mathematics to 3 credits", "Dr. Rajeev Sharma is unavailable on Monday", "Add a 2-credit Minor Project by Dr. Kavitha Reddy", "Swap OS faculty to Dr. Neha Gupta"].map(ex => (
                <button key={ex} onClick={() => setRefineText(ex)} className="cursor-hover" style={{ fontSize: 11, color: "#1565C0", background: "rgba(21,101,192,0.07)", border: "none", padding: "4px 10px", borderRadius: 7 }}>{ex}</button>
              ))}
            </div>
            {changes && (
              <div style={{ marginTop: 14, padding: 14, background: "#F7FAFF", borderRadius: 10, border: "1px solid rgba(21,101,192,0.12)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0A1628", marginBottom: 8 }}>✦ {changes.summary}</div>
                {changes.applied.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#0F9D58", marginTop: 3 }}>✓ {a}</div>)}
                {changes.skipped.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#C8102E", marginTop: 3 }}>✕ {a}</div>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GenOverlay({ refining, branch, sem }: { refining: boolean; branch: string; sem: number }) {
  const steps = refining
    ? ["Understanding your request", "Applying edits to the plan", "Re-solving the schedule", "Rebuilding the semester calendar"]
    : ["Reading course & credit structure", "Placing lectures & lab blocks", "Resolving faculty & room clashes", "Expanding across the semester", "Excluding weekends & holidays"];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % steps.length), 480); return () => clearInterval(t); }, [steps.length]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,22,40,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 420, maxWidth: "90vw", background: "white", borderRadius: 18, padding: "30px 30px 26px", boxShadow: "0 24px 70px rgba(0,0,0,0.3)", textAlign: "center" }}>
        <div style={{ position: "relative", width: 66, height: 66, margin: "0 auto 16px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(21,101,192,0.15)", borderTopColor: "#1565C0", animation: "ttSpin 0.9s linear infinite" }} />
          <img src="/krmu-logo.png" alt="KRMU" style={{ position: "absolute", inset: 12, width: 42, height: 42, objectFit: "contain" }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0A1628", letterSpacing: "-0.02em" }}>{refining ? "Refining Timetable" : "Generating Timetable"}</div>
        <div style={{ fontSize: 12, color: "#A0AEC0", marginTop: 3 }}>{branch} · Semester {sem}</div>

        <div style={{ height: 7, borderRadius: 5, background: "#EEF3FB", overflow: "hidden", margin: "20px 0 12px" }}>
          <div style={{ height: "100%", borderRadius: 5, background: "linear-gradient(90deg, #1f6fd6, #F5A623)", animation: "ttFill 1.4s cubic-bezier(0.16,1,0.3,1) forwards" }} />
        </div>
        <div style={{ fontSize: 12.5, color: "#1565C0", fontWeight: 600, minHeight: 18, transition: "opacity 0.2s" }}>
          {steps[i]}…
        </div>
      </div>
    </div>
  );
}

const thHead: React.CSSProperties = { background: "#1565C0", color: "white", fontSize: 10.5, fontWeight: 700, padding: "9px 6px", border: "1px solid #d5dbe6", textTransform: "uppercase", letterSpacing: "0.03em" };
const dayHead: React.CSSProperties = { background: "#0f4488", color: "white", fontSize: 11, fontWeight: 800, padding: "8px 6px", border: "1px solid #d5dbe6", textTransform: "uppercase", width: 60 };
const cellBase: React.CSSProperties = { padding: "7px 8px", border: "1px solid #e2e6ee", verticalAlign: "top", height: 62, fontSize: 11 };
