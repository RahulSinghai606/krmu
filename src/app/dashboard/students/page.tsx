"use client";
import { useState, useEffect } from "react";
import { STUDENTS, PROGRAMMES } from "@/lib/data";
import { getStatusColor, formatDate } from "@/lib/utils";
import type { Student } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/Confirm";
import { useApp } from "@/lib/store";

const STATUSES = ["all", "enrolled", "admitted", "on-leave", "graduated", "withdrawn"] as const;
const ALL_PROGRAMMES = Array.from(new Set(Object.values(PROGRAMMES).flat()));
const blankForm = { name: "", enrollmentNo: "", programme: "B.Tech CSE", school: "SOET", semester: "1", section: "A", status: "enrolled", email: "", phone: "", cgpa: "", attendance: "100", category: "General", guardianName: "", guardianPhone: "", dob: "", address: "", batch: "2024-28" };

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [selected, setSelected] = useState<Student | null>(null);
  const [tab, setTab] = useState<"profile"|"attendance"|"fees"|"documents">("profile");

  const [rows, setRows] = useState<Student[]>(STUDENTS);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useApp();

  // Add / edit drawer
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...blankForm });
  const [saving, setSaving] = useState(false);

  const actorMeta = { _actor: user?.email, _role: user?.role };
  const canManage = user?.role === "admin" || user?.role === "registrar"; // only these may admit/edit/remove

  const load = () =>
    fetch("/api/students").then(r => r.json())
      .then(d => { if (Array.isArray(d.students)) setRows(d.students); })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openAdmit = () => { setEditId(null); setForm({ ...blankForm }); setFormOpen(true); };
  const openEdit = (s: Student) => {
    setEditId(s.id);
    setForm({ name: s.name, enrollmentNo: s.enrollmentNo, programme: s.programme, school: s.school, semester: String(s.semester), section: s.section, status: s.status, email: s.email, phone: s.phone, cgpa: String(s.cgpa), attendance: String(s.attendance), category: s.category, guardianName: s.guardianName, guardianPhone: s.guardianPhone, dob: s.dob, address: s.address, batch: s.batch });
    setFormOpen(true);
  };

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submitForm = async () => {
    if (!form.name.trim() || !form.enrollmentNo.trim() || !form.email.trim()) {
      toast.error("Missing fields", "Name, enrolment no. and email are required");
      return;
    }
    setSaving(true);
    try {
      const url = editId ? `/api/students/${editId}` : "/api/students";
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...actorMeta }),
      });
      const data = await res.json();
      if (res.ok) {
        await load();
        toast.success(editId ? "Student updated" : "Student admitted", `${form.name} · ${form.enrollmentNo}`);
        setFormOpen(false);
        if (editId && selected?.id === editId) setSelected(data.student);
      } else {
        toast.error("Could not save", data.error || "Server error");
      }
    } catch { toast.error("Could not save", "Network error"); }
    finally { setSaving(false); }
  };

  const removeStudent = async (s: Student) => {
    const ok = await confirm({ title: "Remove student?", message: `${s.name} (${s.enrollmentNo}) and their fee/grievance records will be permanently deleted.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    const res = await fetch(`/api/students/${s.id}`, { method: "DELETE" });
    if (res.ok) { await load(); setSelected(null); toast.success("Student removed", s.name); }
    else toast.error("Delete failed");
  };

  const exportCSV = () => {
    const cols = ["enrollmentNo", "name", "programme", "school", "semester", "section", "status", "cgpa", "attendance", "feeDue", "email", "phone"] as const;
    const head = cols.join(",");
    const body = filtered.map(s => cols.map(c => `"${String((s as never)[c] ?? "")}"`).join(",")).join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `krmu-students-${filtered.length}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported", `${filtered.length} students → CSV`);
  };

  const filtered = rows.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.enrollmentNo.toLowerCase().includes(q) || s.programme.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || s.status === statusFilter;
    const matchSch = schoolFilter === "all" || s.school === schoolFilter;
    return matchQ && matchS && matchSch;
  });

  const sc = selected ? getStatusColor(selected.status) : null;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>
      {/* LEFT LIST */}
      <div style={{ width: selected ? 420 : "100%", flexShrink: 0, borderRight: "1px solid rgba(10,22,40,0.07)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "width 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
        {/* Hero */}
        <div className="page-hero" style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div className="reveal-wrap"><span className="reveal-inner page-hero-title">Students</span></div>
              <div className="page-hero-sub fade-up fade-up-1">{rows.length} enrolled · {rows.filter(s => s.status === "enrolled").length} active</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {canManage && (
              <button onClick={openAdmit} className="btn btn-gold btn-sm cursor-hover">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Admit Student
              </button>
              )}
              <button onClick={exportCSV} className="btn btn-sm cursor-hover" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(10,22,40,0.06)", background: "white", display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#A0AEC0" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID, programme…" className="field-input cursor-hover" style={{ paddingLeft: 32, height: 36, fontSize: 13 }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="field-input cursor-hover" style={{ width: 140, height: 36, fontSize: 13 }}>
            {STATUSES.map(s => <option key={s} value={s}>{s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")}</option>)}
          </select>
          <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} className="field-input cursor-hover" style={{ width: 160, height: 36, fontSize: 13 }}>
            <option value="all">All Schools</option>
            {["SOET","SMS","SOL","SoMeS","SOA","SoP","SoS","SoEd"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ fontSize: 12, color: "#737373", alignSelf: "center", fontWeight: 600 }}>{filtered.length} students</div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <SkeletonRows rows={9} cols={7} /> : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#A0AEC0", fontSize: 13 }}>No students match your filters.</div>
          ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Enrolment No.</th>
                <th>Programme</th>
                <th>Sem</th>
                <th>Attendance</th>
                <th>CGPA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const sc = getStatusColor(s.status);
                return (
                  <tr key={s.id} onClick={() => setSelected(s)} className="cursor-hover" style={{ background: selected?.id === s.id ? "rgba(21,101,192,0.04)" : "" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: `linear-gradient(135deg, ${s.feeDue > 0 ? "#C8102E" : "#1565C0"}, ${s.attendance < 75 ? "#C8102E" : "#0d4090"})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: "white",
                        }}>
                          {s.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0A1628", letterSpacing: "-0.01em" }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: "#A0AEC0" }}>{s.section} · {s.batch}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#525252" }}>{s.enrollmentNo}</td>
                    <td style={{ fontSize: 12.5, maxWidth: 160 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.programme}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: "#0A1628" }}>{s.semester}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 40, height: 4, background: "#F0F0EE", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${s.attendance}%`, height: "100%", background: s.attendance >= 85 ? "#0F9D58" : s.attendance >= 75 ? "#F5A623" : "#C8102E", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: s.attendance >= 85 ? "#0F9D58" : s.attendance >= 75 ? "#F5A623" : "#C8102E" }}>{s.attendance}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, fontSize: 13, color: s.cgpa >= 8 ? "#0F9D58" : s.cgpa >= 6 ? "#F5A623" : "#C8102E" }}>{s.cgpa}</td>
                    <td>
                      <span className={`chip ${sc.bg === "bg-blue-50" ? "chip-blue" : sc.bg === "bg-green-50" ? "chip-green" : sc.bg === "bg-amber-50" ? "chip-amber" : sc.bg === "bg-red-50" ? "chip-red" : sc.bg === "bg-purple-50" ? "chip-purple" : "chip-gray"}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* RIGHT DETAIL PANEL */}
      {selected && (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* Profile header */}
          <div style={{ background: "#1565C0", padding: "28px 28px 20px", position: "relative", flexShrink: 0, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%)" }} />
            <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8 }}>
              {canManage && (
              <button onClick={() => openEdit(selected)} className="cursor-hover" title="Edit" style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              )}
              {canManage && (
              <button onClick={() => removeStudent(selected)} className="cursor-hover" title="Remove" style={{ background: "rgba(200,16,46,0.25)", border: "none", color: "#ffb3bf", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
              )}
              <button onClick={() => setSelected(null)} className="cursor-hover" style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #1565C0, #F5A623)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800, color: "white",
                border: "3px solid rgba(255,255,255,0.15)",
              }}>
                {selected.name.split(" ").map(n => n[0]).join("").slice(0,2)}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3, fontFamily: "monospace", letterSpacing: "0.04em" }}>{selected.enrollmentNo}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, background: "rgba(21,101,192,0.25)", color: "#93b5e8", padding: "3px 9px", borderRadius: 6, fontWeight: 600 }}>{selected.programme}</span>
                  <span style={{ fontSize: 11, background: "rgba(245,166,35,0.15)", color: "#F5A623", padding: "3px 9px", borderRadius: 6, fontWeight: 600 }}>Semester {selected.semester}</span>
                  <span style={{ fontSize: 11, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", padding: "3px 9px", borderRadius: 6, fontWeight: 600 }}>Section {selected.section}</span>
                </div>
              </div>
            </div>

            {/* Quick metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
              {[
                { label: "CGPA", value: selected.cgpa.toFixed(1), color: selected.cgpa >= 8 ? "#0F9D58" : selected.cgpa >= 6 ? "#F5A623" : "#C8102E" },
                { label: "Attendance", value: `${selected.attendance}%`, color: selected.attendance >= 85 ? "#0F9D58" : selected.attendance >= 75 ? "#F5A623" : "#C8102E" },
                { label: "Fee Due", value: selected.feeDue === 0 ? "Nil" : `₹${(selected.feeDue/1000).toFixed(0)}K`, color: selected.feeDue === 0 ? "#0F9D58" : "#C8102E" },
              ].map(m => (
                <div key={m.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: "-0.04em", marginTop: 2 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ background: "white", borderBottom: "1px solid rgba(10,22,40,0.07)", padding: "0 24px", display: "flex", gap: 24, flexShrink: 0 }}>
            {(["profile", "attendance", "fees", "documents"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="cursor-hover"
                style={{
                  padding: "14px 0", fontSize: 13, fontWeight: 600, border: "none", background: "none",
                  color: tab === t ? "#0A1628" : "#737373",
                  borderBottom: tab === t ? "2px solid #0A1628" : "2px solid transparent",
                  letterSpacing: "-0.01em", textTransform: "capitalize",
                  transition: "all 0.2s",
                }}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, padding: "24px" }}>
            {tab === "profile" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { label: "Date of Birth", value: formatDate(selected.dob) },
                  { label: "Category", value: selected.category },
                  { label: "Batch", value: selected.batch },
                  { label: "School", value: selected.school },
                  { label: "Admission Date", value: formatDate(selected.admissionDate) },
                  { label: "Section", value: selected.section },
                  { label: "Email", value: selected.email },
                  { label: "Phone", value: selected.phone },
                  { label: "Guardian Name", value: selected.guardianName },
                  { label: "Guardian Phone", value: selected.guardianPhone },
                  { label: "Address", value: selected.address },
                  { label: "Status", value: selected.status },
                ].map(f => (
                  <div key={f.label} style={{ padding: "12px 16px", background: "#F7F7F5", borderRadius: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A0AEC0", marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0A1628", letterSpacing: "-0.01em" }}>{f.value}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === "attendance" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Overall", value: `${selected.attendance}%`, color: selected.attendance >= 75 ? "#0F9D58" : "#C8102E" },
                    { label: "Classes Attended", value: `${Math.round(selected.attendance * 1.2)} / ${Math.round(100 * 1.2)}`, color: "#0A1628" },
                    { label: "Shortage Risk", value: selected.attendance < 75 ? "Debarred" : selected.attendance < 85 ? "Warning" : "Safe", color: selected.attendance < 75 ? "#C8102E" : selected.attendance < 85 ? "#F5A623" : "#0F9D58" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "14px 16px", background: "#F7F7F5", borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: m.color, letterSpacing: "-0.04em" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#F7F7F5", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0A1628", marginBottom: 12 }}>Subject-wise Attendance</div>
                  {["CSE301 — Data Structures", "CSE302 — DBMS", "CSE303 — OOP", "MA101 — Engineering Maths", "HS101 — Communication"].map((sub, i) => {
                    const pct = Math.max(60, Math.min(98, selected.attendance + (i % 3 === 0 ? -8 : i % 3 === 1 ? 5 : 0)));
                    return (
                      <div key={sub} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0A1628" }}>{sub}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: pct >= 85 ? "#0F9D58" : pct >= 75 ? "#F5A623" : "#C8102E" }}>{pct}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 85 ? "#0F9D58" : pct >= 75 ? "#F5A623" : "#C8102E" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "fees" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Total Fee", value: "₹95,000", color: "#0A1628" },
                    { label: "Amount Paid", value: `₹${(95000 - selected.feeDue).toLocaleString("en-IN")}`, color: "#0F9D58" },
                    { label: "Outstanding Dues", value: selected.feeDue === 0 ? "Nil" : `₹${selected.feeDue.toLocaleString("en-IN")}`, color: selected.feeDue > 0 ? "#C8102E" : "#0F9D58" },
                    { label: "Due Date", value: "Jan 31, 2025", color: "#F5A623" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: "14px 16px", background: "#F7F7F5", borderRadius: 10 }}>
                      <div style={{ fontSize: 10, color: "#A0AEC0", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: m.color, letterSpacing: "-0.04em" }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                {selected.feeDue > 0 && (
                  <div style={{ background: "#FCEAED", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#C8102E" }}>Outstanding dues will result in examination debarment after Jan 31.</span>
                  </div>
                )}
                <button className="btn btn-blue cursor-hover" style={{ width: "100%", justifyContent: "center" }}>
                  Record Fee Payment
                </button>
              </div>
            )}

            {tab === "documents" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { name: "Aadhaar Card", status: "verified", date: "Aug 2, 2024" },
                  { name: "10th Mark Sheet", status: "verified", date: "Aug 2, 2024" },
                  { name: "12th Mark Sheet", status: "verified", date: "Aug 2, 2024" },
                  { name: "Category Certificate", status: selected.category !== "General" ? "verified" : "not-required", date: "Aug 2, 2024" },
                  { name: "Passport Photo", status: "verified", date: "Aug 2, 2024" },
                  { name: "Transfer Certificate", status: "pending", date: "" },
                ].map(doc => (
                  <div key={doc.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#F7F7F5", borderRadius: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={doc.status === "verified" ? "#0F9D58" : doc.status === "pending" ? "#F5A623" : "#A0AEC0"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {doc.status === "verified" ? <><polyline points="20 6 9 17 4 12"/></> : doc.status === "pending" ? <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0A1628" }}>{doc.name}</div>
                      {doc.date && <div style={{ fontSize: 11, color: "#A0AEC0" }}>Uploaded {doc.date}</div>}
                    </div>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                      background: doc.status === "verified" ? "#dcfce7" : doc.status === "pending" ? "#fef3c7" : "#F0F0EE",
                      color: doc.status === "verified" ? "#15803d" : doc.status === "pending" ? "#b45309" : "#737373",
                    }}>
                      {doc.status.replace(/-/g, " ")}
                    </span>
                  </div>
                ))}
                <button className="btn btn-ghost cursor-hover" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admit / Edit student drawer */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        variant="drawer"
        width={460}
        title={editId ? "Edit Student" : "Admit Student"}
        subtitle={editId ? form.enrollmentNo : "Create a new student record"}
        footer={
          <>
            <button onClick={() => setFormOpen(false)} disabled={saving} className="btn btn-ghost cursor-hover">Cancel</button>
            <button onClick={submitForm} disabled={saving} className="btn btn-primary cursor-hover">{saving ? "Saving…" : editId ? "Save changes" : "Admit student"}</button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { k: "name", label: "Full Name *", span: 2 },
            { k: "enrollmentNo", label: "Enrolment No. *" },
            { k: "email", label: "Email *" },
            { k: "phone", label: "Phone" },
            { k: "dob", label: "Date of Birth", ph: "YYYY-MM-DD" },
          ].map(f => (
            <div key={f.k} style={{ gridColumn: f.span === 2 ? "1 / -1" : "auto" }}>
              <label className="field-label">{f.label}</label>
              <input value={(form as never)[f.k]} onChange={e => setF(f.k, e.target.value)} placeholder={f.ph} className="field-input" style={{ height: 38 }} />
            </div>
          ))}
          <div>
            <label className="field-label">Programme</label>
            <select value={form.programme} onChange={e => setF("programme", e.target.value)} className="field-input" style={{ height: 38 }}>
              {ALL_PROGRAMMES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">School</label>
            <select value={form.school} onChange={e => setF("school", e.target.value)} className="field-input" style={{ height: 38 }}>
              {["SOET","SMS","SOL","SoMeS","SOA","SoP","SoS","SoEd"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Semester</label>
            <input value={form.semester} onChange={e => setF("semester", e.target.value.replace(/\D/g, ""))} className="field-input" style={{ height: 38 }} />
          </div>
          <div>
            <label className="field-label">Section</label>
            <input value={form.section} onChange={e => setF("section", e.target.value)} className="field-input" style={{ height: 38 }} />
          </div>
          <div>
            <label className="field-label">Status</label>
            <select value={form.status} onChange={e => setF("status", e.target.value)} className="field-input" style={{ height: 38 }}>
              {["enrolled","admitted","on-leave","graduated","withdrawn"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Category</label>
            <select value={form.category} onChange={e => setF("category", e.target.value)} className="field-input" style={{ height: 38 }}>
              {["General","OBC","SC","ST","EWS"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">CGPA</label>
            <input value={form.cgpa} onChange={e => setF("cgpa", e.target.value)} placeholder="0.0" className="field-input" style={{ height: 38 }} />
          </div>
          <div>
            <label className="field-label">Attendance %</label>
            <input value={form.attendance} onChange={e => setF("attendance", e.target.value.replace(/\D/g, ""))} className="field-input" style={{ height: 38 }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">Guardian Name</label>
            <input value={form.guardianName} onChange={e => setF("guardianName", e.target.value)} className="field-input" style={{ height: 38 }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="field-label">Address</label>
            <input value={form.address} onChange={e => setF("address", e.target.value)} className="field-input" style={{ height: 38 }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
