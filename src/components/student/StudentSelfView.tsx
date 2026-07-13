"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { printFeeReceipt, printFeeStatement, printHallTicket } from "@/lib/pdf";

const GRADE_HEX: Record<string, string> = { O: "#0F9D58", "A+": "#22A06B", A: "#1565C0", "B+": "#2E7BD6", B: "#F5A623", C: "#E8730A", F: "#C8102E" };

interface MeData {
  student?: { id: string; name: string; enrollmentNo: string; programme: string; semester: number; cgpa: number };
  results?: { courseCode: string; courseName: string; internal: number; external: number; total: number; grade: string; status: string }[];
  attendance?: { code: string; name: string; pct: number; attended: number; total: number }[];
  overallAtt?: number;
  totalDue?: number;
}

export function StudentSelfView({ view }: { view: "fees" | "attendance" | "results" }) {
  const { user } = useApp();
  const toast = useToast();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<{ id: string; feeHead: string; amount: number; paid: number; due: number; dueDate: string; status: string; receiptNo?: string | null }[]>([]);
  const [payOpen, setPayOpen] = useState<{ id: string; due: number; head: string } | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [saving, setSaving] = useState(false);

  const loadMe = () => { if (user?.email) fetch(`/api/me?email=${encodeURIComponent(user.email)}`).then(r => r.json()).then(setMe).catch(() => {}).finally(() => setLoading(false)); };
  const loadFees = () => { if (me?.student) fetch("/api/fees").then(r => r.json()).then(d => setFees((d.fees || []).filter((f: { studentId: string }) => f.studentId === me.student!.id))); };

  useEffect(() => { loadMe(); }, [user]);
  useEffect(() => { if (view === "fees") loadFees(); }, [me, view]);

  const titles = { fees: "My Fees", attendance: "My Attendance", results: "My Results" };
  const subs = {
    fees: "Your fee statement and payment history",
    attendance: "Your attendance across all courses",
    results: "Your published examination results",
  };

  const pay = async () => {
    if (!payOpen) return;
    const amt = parseInt(payAmt.replace(/\D/g, "") || "0", 10);
    if (!amt || amt > payOpen.due) { toast.error("Enter a valid amount", `Max ₹${payOpen.due.toLocaleString("en-IN")}`); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/fees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: payOpen.id, amount: amt, mode: "Online" }) });
      const data = await res.json();
      if (res.ok) { loadFees(); loadMe(); toast.success("Payment successful", `₹${amt.toLocaleString("en-IN")} · Receipt ${data.fee.receiptNo}`); setPayOpen(null); setPayAmt(""); }
      else toast.error("Payment failed", data.error);
    } catch { toast.error("Payment failed", "Network error"); }
    finally { setSaving(false); }
  };

  const downloadHallTicket = async () => {
    try {
      const res = await fetch("/api/hallticket");
      const d = await res.json();
      if (res.ok && d.eligible) printHallTicket(d.ticket);
      else if (res.ok) toast.error("Not eligible for hall ticket", (d.blockers || []).join(", "));
      else toast.error("Failed", d.error);
    } catch { toast.error("Failed", "Network error"); }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="page-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
          <div>
            <div className="reveal-wrap"><span className="reveal-inner page-hero-title">{titles[view]}</span></div>
            <div className="page-hero-sub fade-up fade-up-1">
              {me?.student ? `${me.student.name} · ${me.student.enrollmentNo} · ${me.student.programme} Sem ${me.student.semester}` : subs[view]}
            </div>
          </div>
          {view === "results" && (
            <button onClick={downloadHallTicket} className="btn btn-gold btn-sm cursor-hover">⬇ Download Hall Ticket</button>
          )}
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {loading ? <div className="card card-p"><Skeleton h={160} /></div> : (
          <>
            {view === "results" && (
              <div className="card" style={{ overflow: "hidden" }}>
                <table className="tbl">
                  <thead><tr><th>Course</th><th>Internal (30)</th><th>External (70)</th><th>Total</th><th>Grade</th><th>Status</th></tr></thead>
                  <tbody>
                    {(me?.results || []).length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#A0AEC0", padding: 28 }}>No results published yet.</td></tr>}
                    {(me?.results || []).map(r => (
                      <tr key={r.courseCode}>
                        <td><div style={{ fontWeight: 700, fontSize: 13 }}>{r.courseName}</div><div style={{ fontSize: 11, color: "#A0AEC0", fontFamily: "monospace" }}>{r.courseCode}</div></td>
                        <td style={{ fontWeight: 700 }}>{r.internal}</td>
                        <td style={{ fontWeight: 700 }}>{r.external}</td>
                        <td style={{ fontWeight: 800 }}>{r.total}</td>
                        <td><span style={{ fontWeight: 800, color: GRADE_HEX[r.grade] || "#737373" }}>{r.grade}</span></td>
                        <td><span className={`chip ${r.status === "published" ? "chip-green" : "chip-amber"}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {view === "attendance" && (
              <>
                <div className="card card-p" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A0AEC0" }}>Overall Attendance</div>
                    <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.05em", color: (me?.overallAtt ?? 0) >= 75 ? "#0F9D58" : "#C8102E", lineHeight: 1 }}>{me?.overallAtt ?? 0}%</div>
                  </div>
                  <div style={{ fontSize: 13, color: (me?.overallAtt ?? 0) >= 75 ? "#0F7B45" : "#C8102E", fontWeight: 600, padding: "8px 14px", borderRadius: 10, background: (me?.overallAtt ?? 0) >= 75 ? "rgba(15,157,88,0.08)" : "rgba(200,16,46,0.07)" }}>
                    {(me?.overallAtt ?? 0) >= 75 ? "✓ You are eligible to sit for examinations." : "⚠ Below 75% — you risk exam debarment. Improve immediately."}
                  </div>
                </div>
                <div className="card card-p">
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1628", marginBottom: 14 }}>By Course</div>
                  {(me?.attendance || []).length === 0 ? <div style={{ color: "#A0AEC0", fontSize: 13 }}>No attendance recorded yet.</div> : (me?.attendance || []).map(a => (
                    <div key={a.code} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0A1628" }}>{a.code} — {a.name} <span style={{ color: "#A0AEC0", fontWeight: 400 }}>({a.attended}/{a.total} classes)</span></span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: a.pct >= 85 ? "#0F9D58" : a.pct >= 75 ? "#F5A623" : "#C8102E" }}>{a.pct}%</span>
                      </div>
                      <div style={{ height: 8, background: "#F1F3F6", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${a.pct}%`, background: a.pct >= 85 ? "#0F9D58" : a.pct >= 75 ? "#F5A623" : "#C8102E", borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "fees" && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                  <button
                    onClick={() => me?.student && printFeeStatement(me.student.name, me.student.programme, me.student.semester, fees)}
                    className="btn btn-primary btn-sm cursor-hover">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Statement (PDF)
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 18 }}>
                  {[
                    { label: "Total Billed", value: `₹${fees.reduce((s, f) => s + f.amount, 0).toLocaleString("en-IN")}`, color: "#0A1628" },
                    { label: "Paid", value: `₹${fees.reduce((s, f) => s + f.paid, 0).toLocaleString("en-IN")}`, color: "#0F9D58" },
                    { label: "Outstanding", value: `₹${(me?.totalDue ?? 0).toLocaleString("en-IN")}`, color: (me?.totalDue ?? 0) > 0 ? "#C8102E" : "#0F9D58" },
                  ].map(c => (
                    <div key={c.label} className="card card-p">
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A0AEC0", marginBottom: 6 }}>{c.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: c.color, letterSpacing: "-0.04em" }}>{c.value}</div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ overflow: "hidden" }}>
                  <table className="tbl">
                    <thead><tr><th>Fee Head</th><th>Amount</th><th>Paid</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {fees.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "#A0AEC0", padding: 28 }}>No fee records.</td></tr>}
                      {fees.map(f => (
                        <tr key={f.id}>
                          <td style={{ fontWeight: 700, fontSize: 13 }}>{f.feeHead}</td>
                          <td style={{ fontWeight: 700 }}>₹{f.amount.toLocaleString("en-IN")}</td>
                          <td style={{ color: "#0F9D58", fontWeight: 700 }}>₹{f.paid.toLocaleString("en-IN")}</td>
                          <td style={{ fontWeight: 800, color: f.due > 0 ? "#C8102E" : "#0F9D58" }}>{f.due > 0 ? `₹${f.due.toLocaleString("en-IN")}` : "—"}</td>
                          <td><span className={`chip ${f.status === "paid" ? "chip-green" : f.status === "partial" ? "chip-amber" : f.status === "overdue" ? "chip-red" : "chip-gray"}`}>{f.status}</span></td>
                          <td>{f.due > 0
                            ? <button onClick={() => { setPayOpen({ id: f.id, due: f.due, head: f.feeHead }); setPayAmt(String(f.due)); }} className="btn btn-sm btn-blue cursor-hover" style={{ padding: "4px 12px", fontSize: 11 }}>Pay Now</button>
                            : <button onClick={() => me?.student && printFeeReceipt({ ...f, studentName: me.student.name, programme: me.student.programme, semester: me.student.semester })} className="btn btn-sm btn-ghost cursor-hover" style={{ padding: "4px 10px", fontSize: 11 }}>Receipt ↓</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Modal open={!!payOpen} onClose={() => !saving && setPayOpen(null)} title="Pay Fees" subtitle={payOpen?.head} width={400}
        footer={<><button onClick={() => setPayOpen(null)} disabled={saving} className="btn btn-ghost cursor-hover">Cancel</button><button onClick={pay} disabled={saving} className="btn btn-primary cursor-hover">{saving ? "Processing…" : "Pay Now"}</button></>}>
        {payOpen && (
          <div>
            <div style={{ padding: "12px 14px", background: "rgba(200,16,46,0.06)", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, color: "#A0AEC0", fontWeight: 700, textTransform: "uppercase" }}>Outstanding Due</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#C8102E" }}>₹{payOpen.due.toLocaleString("en-IN")}</div>
            </div>
            <label className="field-label">Amount (₹)</label>
            <input value={payAmt} onChange={e => setPayAmt(e.target.value.replace(/\D/g, ""))} className="field-input" style={{ height: 40, fontSize: 15, fontWeight: 700 }} autoFocus />
          </div>
        )}
      </Modal>
    </div>
  );
}
