// Dependency-free PDF generation via a styled print window → browser "Save as PDF".
// Produces a professional KRMU-branded document. Works fully offline (logo from /public).

interface FeeLike {
  studentName: string; programme: string; semester: number; feeHead: string;
  amount: number; paid: number; due: number; status: string;
  receiptNo?: string | null; paymentDate?: string | null; paymentMode?: string | null;
}

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const today = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

function shell(title: string, inner: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; }
    body { color:#0A1628; padding:48px 54px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .head { display:flex; align-items:center; gap:16px; border-bottom:3px solid #0A1628; padding-bottom:18px; }
    .head img { width:64px; height:64px; object-fit:contain; }
    .head h1 { font-size:22px; letter-spacing:-0.5px; color:#0A1628; }
    .head .sub { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#1565C0; font-weight:700; margin-top:2px; }
    .head .addr { font-size:11px; color:#737373; margin-top:3px; }
    .doctype { margin-left:auto; text-align:right; }
    .doctype .t { font-size:13px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#C8102E; }
    .doctype .d { font-size:11px; color:#737373; margin-top:3px; }
    .meta { display:flex; justify-content:space-between; margin:26px 0; gap:24px; }
    .meta .box { flex:1; }
    .meta .lbl { font-size:9px; text-transform:uppercase; letter-spacing:1px; color:#A0AEC0; font-weight:700; }
    .meta .val { font-size:13px; font-weight:600; margin-top:3px; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#A0AEC0; padding:10px 12px; border-bottom:2px solid #0A1628; }
    td { padding:12px; font-size:13px; border-bottom:1px solid #eee; }
    td.r, th.r { text-align:right; }
    .total { display:flex; justify-content:flex-end; margin-top:18px; }
    .total .card { width:280px; }
    .total .row { display:flex; justify-content:space-between; padding:7px 0; font-size:13px; }
    .total .grand { border-top:2px solid #0A1628; margin-top:6px; padding-top:10px; font-size:16px; font-weight:800; }
    .stamp { margin-top:32px; display:inline-block; padding:8px 16px; border:2px solid #0F9D58; color:#0F9D58; border-radius:8px; font-weight:800; font-size:14px; letter-spacing:1px; transform:rotate(-3deg); }
    .foot { margin-top:48px; border-top:1px solid #eee; padding-top:14px; font-size:10px; color:#A0AEC0; display:flex; justify-content:space-between; }
    .chip { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:700; }
    @media print { body { padding:24px 30px; } .noprint { display:none; } }
    .bar { position:fixed; bottom:0; left:0; right:0; background:#0A1628; color:#fff; padding:12px; text-align:center; }
    .bar button { background:#F5A623; border:none; padding:9px 22px; border-radius:8px; font-weight:700; cursor:pointer; font-size:13px; }
  </style></head><body>
  <div class="head">
    <img src="${origin}/krmu-logo.png" alt="KRMU" />
    <div>
      <h1>K.R. Mangalam University</h1>
      <div class="sub">Destination Success</div>
      <div class="addr">Sohna Road, Gurugram, Haryana 122103 · www.krmangalam.edu.in</div>
    </div>
    ${inner.includes("__DOCTYPE__") ? "" : ""}
  </div>
  ${inner}
  <div class="foot"><span>This is a computer-generated document. No physical signature required.</span><span>Generated ${today()}</span></div>
  <div class="bar noprint"><button onclick="window.print()">⬇ Save as PDF / Print</button></div>
  </body></html>`;
}

function open(html: string) {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  // Auto-trigger print once the logo image has loaded.
  w.onload = () => setTimeout(() => w.print(), 350);
  return true;
}

export function printFeeReceipt(f: FeeLike): boolean {
  const inner = `
    <div class="doctype" style="position:absolute;top:48px;right:54px;"><div class="t">Fee Receipt</div><div class="d">${f.receiptNo || "PROVISIONAL"}</div></div>
    <div class="meta">
      <div class="box"><div class="lbl">Student</div><div class="val">${f.studentName}</div></div>
      <div class="box"><div class="lbl">Programme</div><div class="val">${f.programme} · Sem ${f.semester}</div></div>
      <div class="box"><div class="lbl">Payment Date</div><div class="val">${f.paymentDate || today()}</div></div>
      <div class="box"><div class="lbl">Mode</div><div class="val">${f.paymentMode || "Online"}</div></div>
    </div>
    <table>
      <thead><tr><th>Fee Particulars</th><th class="r">Amount</th></tr></thead>
      <tbody>
        <tr><td>${f.feeHead}</td><td class="r">${inr(f.amount)}</td></tr>
        <tr><td>Amount Paid</td><td class="r" style="color:#0F9D58;font-weight:700">${inr(f.paid)}</td></tr>
        ${f.due > 0 ? `<tr><td>Balance Due</td><td class="r" style="color:#C8102E;font-weight:700">${inr(f.due)}</td></tr>` : ""}
      </tbody>
    </table>
    <div class="total"><div class="card">
      <div class="row"><span>Total Fee</span><span>${inr(f.amount)}</span></div>
      <div class="row"><span>Paid</span><span style="color:#0F9D58">${inr(f.paid)}</span></div>
      <div class="row grand"><span>Balance</span><span style="color:${f.due > 0 ? "#C8102E" : "#0F9D58"}">${inr(f.due)}</span></div>
    </div></div>
    ${f.due === 0 ? `<div class="stamp">PAID IN FULL</div>` : ""}
  `;
  return open(shell(`KRMU Fee Receipt ${f.receiptNo || ""}`, inner));
}

export function printFeeStatement(studentName: string, programme: string, semester: number, fees: FeeLike[]): boolean {
  const totAmt = fees.reduce((s, f) => s + f.amount, 0);
  const totPaid = fees.reduce((s, f) => s + f.paid, 0);
  const totDue = fees.reduce((s, f) => s + f.due, 0);
  const rows = fees.map(f => `<tr>
    <td>${f.feeHead}</td>
    <td class="r">${inr(f.amount)}</td>
    <td class="r" style="color:#0F9D58">${inr(f.paid)}</td>
    <td class="r" style="color:${f.due > 0 ? "#C8102E" : "#0F9D58"}">${f.due > 0 ? inr(f.due) : "—"}</td>
    <td><span class="chip" style="background:${f.status === "paid" ? "#dcfce7;color:#15803d" : f.status === "overdue" ? "#fee2e2;color:#b91c1c" : "#fef3c7;color:#b45309"}">${f.status}</span></td>
  </tr>`).join("");
  const inner = `
    <div class="doctype" style="position:absolute;top:48px;right:54px;"><div class="t">Fee Statement</div><div class="d">${today()}</div></div>
    <div class="meta">
      <div class="box"><div class="lbl">Student</div><div class="val">${studentName}</div></div>
      <div class="box"><div class="lbl">Programme</div><div class="val">${programme} · Sem ${semester}</div></div>
      <div class="box"><div class="lbl">Academic Year</div><div class="val">2024–25</div></div>
    </div>
    <table>
      <thead><tr><th>Fee Head</th><th class="r">Amount</th><th class="r">Paid</th><th class="r">Due</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total"><div class="card">
      <div class="row"><span>Total Billed</span><span>${inr(totAmt)}</span></div>
      <div class="row"><span>Total Paid</span><span style="color:#0F9D58">${inr(totPaid)}</span></div>
      <div class="row grand"><span>Outstanding</span><span style="color:${totDue > 0 ? "#C8102E" : "#0F9D58"}">${inr(totDue)}</span></div>
    </div></div>
  `;
  return open(shell(`KRMU Fee Statement — ${studentName}`, inner));
}

interface CertLike {
  type: string; studentName: string; enrollmentNo?: string; programme?: string;
  purpose?: string; issueDate?: string | null; hash?: string | null; signedBy?: string | null;
}

// Issued, digitally-verifiable certificate on university stationery.
export function printCertificate(c: CertLike): boolean {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const verifyUrl = c.hash ? `${origin}/verify/${c.hash}` : "";
  const inner = `
    <div class="doctype" style="text-align:center;margin:6px 0 22px">
      <div class="t" style="color:#1565C0;font-size:16px;letter-spacing:2px">${c.type.toUpperCase()}</div>
    </div>
    <p style="font-size:14px;line-height:2;margin-top:10px">
      This is to certify that <b>${c.studentName}</b>${c.enrollmentNo ? ` (Enrolment No. <b>${c.enrollmentNo}</b>)` : ""}
      ${c.programme ? `is a bonafide student of <b>${c.programme}</b> at` : "is a bonafide member of"}
      K.R. Mangalam University, Gurugram.
    </p>
    ${c.purpose ? `<p style="font-size:13px;line-height:1.9;margin-top:10px">This certificate is issued for the purpose of <b>${c.purpose}</b>.</p>` : ""}
    <p style="font-size:12.5px;color:#555;margin-top:10px">The student is in good standing with no outstanding academic, financial, library or disciplinary holds as on the date of issue.</p>

    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:52px">
      <div>
        ${c.hash ? `<div style="border:1.5px solid #0F9D58;border-radius:8px;padding:8px 12px;display:inline-block">
          <div style="font-size:9px;letter-spacing:1px;color:#0F9D58;text-transform:uppercase;font-weight:700">Digitally Verified</div>
          <div style="font-size:14px;font-weight:800;letter-spacing:2px;color:#0A1628">${c.hash}</div>
          <div style="font-size:8.5px;color:#8a93a5;margin-top:2px">Verify at ${verifyUrl}</div>
        </div>` : ""}
      </div>
      <div style="text-align:center">
        <div style="font-family:cursive;font-size:20px;color:#1565C0">R. Kumar</div>
        <div style="border-top:1px solid #0A1628;padding-top:5px;font-size:11px;font-weight:700;width:180px">Registrar</div>
        <div style="font-size:10px;color:#737373">${c.issueDate || ""}</div>
      </div>
    </div>`;
  return open(shell(c.type, inner));
}

interface HallTicketLike {
  name: string; enrollmentNo: string; programme: string; semester: number; section: string;
  photoInitials: string; code: string; session: string;
  exams: { code: string; subject: string; date: string; time: string; venue: string }[];
}

// Deterministic Code39-style barcode as SVG rects, derived from the verification code.
function barcodeSVG(code: string): string {
  const seed = code.split("").map(c => c.charCodeAt(0));
  let x = 4; const bars: string[] = [];
  for (let i = 0; i < 44; i++) {
    const v = seed[i % seed.length] + i * 7;
    const w = (v % 3) + 1;             // bar width 1–3
    bars.push(`<rect x="${x}" y="0" width="${w}" height="44" fill="#0A1628"/>`);
    x += w + ((v >> 2) % 2) + 1;       // gap 1–2
  }
  return `<svg width="${x + 4}" height="58" xmlns="http://www.w3.org/2000/svg">${bars.join("")}
    <text x="${(x + 4) / 2}" y="55" text-anchor="middle" font-family="monospace" font-size="9" fill="#0A1628" letter-spacing="2">${code}</text></svg>`;
}

// Exam hall ticket — eligibility-gated, barcode-verified, on university stationery.
export function printHallTicket(t: HallTicketLike): boolean {
  const rows = t.exams.map(e => `<tr><td>${e.code}</td><td style="text-align:left">${e.subject}</td><td>${e.date}</td><td>${e.time}</td><td>${e.venue}</td></tr>`).join("");
  const inner = `
    <div class="doctype" style="text-align:center;margin:4px 0 16px">
      <div class="t" style="color:#1565C0;font-size:15px;letter-spacing:2px">EXAMINATION HALL TICKET</div>
      <div class="d">${t.session}</div>
    </div>
    <div style="display:flex;gap:20px;align-items:flex-start">
      <div style="width:86px;height:104px;border:1.5px solid #d5dbe6;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#1565C0;background:#F4F7FD">${t.photoInitials}</div>
      <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:10px 24px">
        <div><div class="lbl" style="font-size:9px;text-transform:uppercase;color:#A0AEC0;font-weight:700">Candidate</div><div style="font-size:15px;font-weight:800">${t.name}</div></div>
        <div><div class="lbl" style="font-size:9px;text-transform:uppercase;color:#A0AEC0;font-weight:700">Enrolment No.</div><div style="font-size:15px;font-weight:800">${t.enrollmentNo}</div></div>
        <div><div class="lbl" style="font-size:9px;text-transform:uppercase;color:#A0AEC0;font-weight:700">Programme</div><div style="font-size:13px;font-weight:600">${t.programme} · Sem ${t.semester} · Sec ${t.section}</div></div>
        <div><div class="lbl" style="font-size:9px;text-transform:uppercase;color:#A0AEC0;font-weight:700">Eligibility</div><div style="font-size:13px;font-weight:700;color:#0F9D58">CLEARED — attendance, fees & registration verified</div></div>
      </div>
      <div style="text-align:center">${barcodeSVG(t.code)}</div>
    </div>
    <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#1565C0;margin:22px 0 6px">Examination Schedule</h2>
    <table class="sum" style="width:100%;border-collapse:collapse">
      <tr><th style="border:1px solid #d5dbe6;background:#f3f6fb;color:#1565C0;font-size:10px;padding:7px">Code</th><th style="border:1px solid #d5dbe6;background:#f3f6fb;color:#1565C0;font-size:10px;padding:7px;text-align:left">Subject</th><th style="border:1px solid #d5dbe6;background:#f3f6fb;color:#1565C0;font-size:10px;padding:7px">Date</th><th style="border:1px solid #d5dbe6;background:#f3f6fb;color:#1565C0;font-size:10px;padding:7px">Time</th><th style="border:1px solid #d5dbe6;background:#f3f6fb;color:#1565C0;font-size:10px;padding:7px">Venue</th></tr>
      ${rows.replace(/<td/g, '<td style="border:1px solid #e2e6ee;font-size:11.5px;padding:8px;text-align:center"')}
    </table>
    <div style="margin-top:18px;font-size:10.5px;color:#737373;line-height:1.7">
      <b>Instructions:</b> Carry this hall ticket with a valid photo ID. Report 30 minutes before the exam. Electronic devices are prohibited in the examination hall. The barcode above is verified at entry.
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:34px">
      <div style="font-size:10px;color:#8a93a5">Verification code: <b>${t.code}</b></div>
      <div style="text-align:center"><div style="font-family:cursive;font-size:18px;color:#1565C0">A. Mehra</div><div style="border-top:1px solid #0A1628;padding-top:4px;font-size:10.5px;font-weight:700;width:170px">Controller of Examinations</div></div>
    </div>`;
  return open(shell("Hall Ticket", inner));
}
