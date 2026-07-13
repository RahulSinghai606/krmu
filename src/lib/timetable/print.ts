// Client-side: render the timetable as a KRMU-branded printable document → browser "Save as PDF".
// Dependency-free, works offline (logo from /public).
import { TTSpec, TTResult, SlotType } from "./engine";
import { SemesterPlan } from "./semester";

const TYPE_BG: Record<SlotType, string> = { lecture: "#EAF2FC", lab: "#FDF3E3", tutorial: "#E9F7EF" };
const TYPE_BAR: Record<SlotType, string> = { lecture: "#1565C0", lab: "#C77800", tutorial: "#0F9D58" };

export function printTimetable(spec: TTSpec, result: TTResult, semester?: SemesterPlan) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const headRow = `<tr><th class="corner">Day / Time</th>${spec.periods.map(p =>
    `<th class="${p.isBreak ? "brk" : ""}">${p.label}${p.isBreak ? "<br><span class='bl'>BREAK</span>" : ""}</th>`).join("")}</tr>`;

  const bodyRows = spec.days.map((day, d) => {
    const cells = spec.periods.map((p, pi) => {
      if (p.isBreak) return `<td class="brk"></td>`;
      const c = result.grid[d][pi];
      if (!c) return `<td class="empty">—</td>`;
      // Avoid drawing the 2nd half of a lab block twice
      const prev = pi > 0 ? result.grid[d][pi - 1] : null;
      if (prev && prev.code === c.code && c.type === "lab" && prev.faculty === c.faculty) {
        return `<td class="cell" style="background:${TYPE_BG[c.type]};border-left:3px solid ${TYPE_BAR[c.type]}"><div class="cont">contd.</div></td>`;
      }
      return `<td class="cell" style="background:${TYPE_BG[c.type]};border-left:3px solid ${TYPE_BAR[c.type]}">
        <div class="cn">${c.name}</div>
        <div class="cc">${c.code} · ${c.type.toUpperCase()}</div>
        <div class="cf">${c.faculty}</div>
        <div class="cr">${c.room}</div></td>`;
    }).join("");
    return `<tr><th class="dayh">${day}</th>${cells}</tr>`;
  }).join("");

  const creditRows = result.creditSummary.map(s => `<tr>
    <td>${s.code}</td><td style="text-align:left">${s.name}</td><td>${s.faculty}</td>
    <td><span class="pill" style="background:${TYPE_BG[s.type]};color:${TYPE_BAR[s.type]}">${s.type}</span></td>
    <td class="num">${s.credits}</td><td class="num">${s.hoursPlaced}/${s.hoursNeeded}</td></tr>`).join("");

  const statusColor = result.creditStatus === "match" ? "#0F9D58" : "#C8102E";
  const warnBlock = result.warnings.length
    ? `<div class="warn"><b>Notes:</b> ${result.warnings.join(" ")}</div>` : "";

  const fmtD = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
  const credOf = (code: string) => spec.subjects.find(s => s.code === code)?.credits ?? "";
  let semBlock = "";
  if (semester) {
    const deliveryRows = semester.delivery.map(d => `<tr>
      <td>${d.code}</td><td style="text-align:left">${d.name}</td><td class="num">${d.credits}</td>
      <td class="num">${d.weeklyHours}</td><td class="num">${d.deliveredHours}</td><td class="num">${d.requiredHours}</td>
      <td style="color:${d.complete ? "#0F9D58" : "#C8102E"};font-weight:700">${d.complete ? "On track" : "Short"}</td></tr>`).join("");
    const holRows = semester.holidays.map(h => `<tr><td>${fmtD(h.date)}</td><td>${h.weekday}</td><td style="text-align:left">${h.name}</td></tr>`).join("")
      || `<tr><td colspan="3" style="color:#8a93a5">No holidays fall within the working span.</td></tr>`;
    const monthBlocks = semester.byMonth.map(m => `
      <h3 class="mh">${m.month} · ${m.days.length} teaching days</h3>
      <table class="cal">
        <tr><th style="width:96px">Date</th><th style="width:42px">Day</th><th style="width:92px">Time</th><th style="text-align:left">Course</th><th style="width:52px">Code</th><th style="width:60px">Type</th><th style="width:34px">Cr</th><th style="text-align:left">Faculty</th><th style="width:78px">Room</th></tr>
        ${m.days.map(d => {
          if (!d.sessions.length) return `<tr><td>${fmtD(d.date)}</td><td>${d.weekday.slice(0, 3)}</td><td colspan="7" class="none">No scheduled classes</td></tr>`;
          return d.sessions.map((s, idx) => `<tr>
            <td>${idx === 0 ? fmtD(d.date) : ""}</td>
            <td>${idx === 0 ? d.weekday.slice(0, 3) : ""}</td>
            <td>${s.period}</td>
            <td style="text-align:left">${s.name}</td>
            <td>${s.code}</td>
            <td><span class="pchip" style="background:${TYPE_BG[s.type]};color:${TYPE_BAR[s.type]};text-transform:capitalize">${s.type}</span></td>
            <td>${credOf(s.code)}</td>
            <td style="text-align:left">${s.faculty}</td>
            <td>${s.room}</td></tr>`).join("");
        }).join("")}
      </table>`).join("");
    semBlock = `
      <div class="pb"></div>
      <h2>Semester Plan — ${fmtD(semester.start)} to ${fmtD(semester.end)}</h2>
      <div class="totals">
        <div><div class="k">Teaching Days</div><div class="v">${semester.teachingDays}</div></div>
        <div><div class="k">Weeks</div><div class="v">${semester.weeks}</div></div>
        <div><div class="k">Holidays Excluded</div><div class="v">${semester.holidays.length}</div></div>
        <div><div class="k">Weekend Days Off</div><div class="v">${semester.weekendDaysOff}</div></div>
        <div><div class="k">Total Class Sessions</div><div class="v">${semester.totalSessions}</div></div>
      </div>

      <h2>Hours Delivery — Whole Semester</h2>
      <table class="sum">
        <tr><th>Code</th><th style="text-align:left">Course</th><th>Credits</th><th>Hrs/Wk</th><th>Delivered</th><th>Required</th><th>Status</th></tr>
        ${deliveryRows}
      </table>

      <h2>Holidays Excluded</h2>
      <table class="sum"><tr><th>Date</th><th>Day</th><th style="text-align:left">Occasion</th></tr>${holRows}</table>

      <div class="pb"></div>
      <h2>Day-by-Day Academic Schedule</h2>
      ${monthBlocks}`;
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Timetable — ${spec.branch} Sem ${spec.semester}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',Helvetica,Arial,sans-serif; }
    body { color:#0A1628; padding:34px 40px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .head { display:flex; align-items:center; gap:16px; border-bottom:3px solid #1565C0; padding-bottom:14px; }
    .head img { width:58px; height:58px; object-fit:contain; }
    .head h1 { font-size:21px; letter-spacing:-0.5px; }
    .head .sub { font-size:12px; color:#555; margin-top:2px; }
    .meta { display:flex; flex-wrap:wrap; gap:8px 22px; margin:14px 0 16px; font-size:12px; }
    .meta b { color:#1565C0; }
    h2 { font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#1565C0; margin:20px 0 8px; }
    table { width:100%; border-collapse:collapse; }
    .tt th, .tt td { border:1px solid #d5dbe6; font-size:9.5px; }
    .tt th { background:#1565C0; color:#fff; padding:7px 4px; font-weight:700; }
    .tt th.corner,.tt .dayh { background:#0f4488; color:#fff; }
    .tt .dayh { width:74px; font-weight:800; text-transform:uppercase; font-size:10px; }
    .tt td.cell { padding:5px 6px; vertical-align:top; height:56px; }
    .tt td.empty { color:#c4c9d4; text-align:center; }
    .tt .brk { background:#f1f4f9; color:#94a2b8; text-align:center; width:26px; }
    .tt .bl { font-size:7px; }
    .cn { font-weight:800; font-size:9.5px; line-height:1.15; }
    .cc { color:#555; font-size:8px; margin-top:2px; font-weight:700; }
    .cf { color:#333; font-size:8.5px; margin-top:2px; }
    .cr { color:#8a93a5; font-size:8px; }
    .cont { color:#8a93a5; font-style:italic; font-size:8.5px; }
    .sum td,.sum th { border:1px solid #d5dbe6; font-size:10.5px; padding:6px 9px; text-align:center; }
    .sum th { background:#f3f6fb; color:#1565C0; font-weight:700; }
    .sum .num { font-weight:700; }
    .pill { padding:1px 8px; border-radius:9px; font-size:9px; font-weight:700; text-transform:capitalize; }
    .totals { display:flex; gap:26px; margin-top:12px; font-size:13px; }
    .totals .k { color:#777; font-size:11px; }
    .totals .v { font-weight:800; font-size:18px; }
    .warn { margin-top:14px; background:#FFF7E6; border:1px solid #F5D48A; border-radius:8px; padding:9px 12px; font-size:11px; color:#8a5a00; }
    .foot { margin-top:26px; border-top:1px solid #e2e6ee; padding-top:10px; font-size:10px; color:#8a93a5; display:flex; justify-content:space-between; }
    .pb { page-break-before:always; }
    .mh { font-size:12px; color:#0f4488; margin:16px 0 6px; font-weight:800; }
    .cal td,.cal th { border:1px solid #dbe1ea; font-size:9.5px; padding:5px 8px; text-align:center; }
    .cal th { background:#f3f6fb; color:#1565C0; font-weight:700; }
    .pchip { display:inline-block; background:#EAF2FC; color:#1565C0; font-weight:700; font-size:8.5px; padding:1px 6px; border-radius:6px; margin:1px 2px; }
    .cal .none { color:#b3bac7; font-style:italic; }
    @media print { body { padding:0; } @page { size:A4 landscape; margin:12mm; } }
  </style></head><body>
    <div class="head">
      <img src="${origin}/krmu-logo.png" alt="KRMU"/>
      <div>
        <h1>K.R. Mangalam University</h1>
        <div class="sub">Office of the Registrar · Academic Time-Table</div>
      </div>
    </div>
    <div class="meta">
      <span><b>Programme:</b> ${spec.programme}</span>
      <span><b>Branch:</b> ${spec.branch}</span>
      <span><b>Semester:</b> ${spec.semester}</span>
      <span><b>Section:</b> ${spec.section}</span>
      <span><b>A.Y.:</b> ${spec.academicYear}</span>
      <span><b>Students:</b> ${spec.studentCount} (${result.sections} section${result.sections > 1 ? "s" : ""})</span>
    </div>

    <h2>Weekly Time-Table</h2>
    <table class="tt">${headRow}${bodyRows}</table>

    <h2>Course &amp; Credit Structure</h2>
    <table class="sum">
      <tr><th>Code</th><th style="text-align:left">Course</th><th>Faculty</th><th>Type</th><th>Credits</th><th>Hrs/Wk</th></tr>
      ${creditRows}
    </table>
    <div class="totals">
      <div><div class="k">Total Credits</div><div class="v" style="color:${statusColor}">${result.totalCredits} / ${result.targetCredits}</div></div>
      <div><div class="k">Weekly Contact Hours</div><div class="v">${result.totalContactHours}</div></div>
      <div><div class="k">Courses</div><div class="v">${spec.subjects.length}</div></div>
      <div><div class="k">Credit Target</div><div class="v" style="color:${statusColor}">${result.creditStatus === "match" ? "Met" : result.creditStatus === "under" ? "Under" : "Over"}</div></div>
    </div>
    ${warnBlock}
    ${semBlock}

    <div class="foot">
      <span>Generated by KRMU AI-Native ERP · ${today}</span>
      <span>Approved: __________________ (Registrar)</span>
    </div>
  </body></html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { setTimeout(() => w.print(), 350); };
}
