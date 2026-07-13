# KRMU AI-Native ERP — Demo Script & Talk Track

> One-line pitch: **Not AI bolted onto an ERP — an ERP where every persona talks to the system, it answers grounded in real data within their permissions, anticipates their day, and routes every action through human approval with a full audit trail.**

---

## 1. Tech Stack (say this if asked "what is it built on")

| Layer | Technology |
|-------|-----------|
| Frontend | **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript** |
| UI | Inline design system + **Lucide** icon set, custom charts (SVG) |
| Data / ORM | **Prisma ORM** → **SQLite** in the demo, **PostgreSQL** in production (one-line switch) |
| AI engine | **Azure OpenAI** (Responses API with function/tool-calling) |
| AI layer | Custom **orchestrator** + **49 governed tools** + **RBAC** + **RAG** (policy retrieval) + **audit log** |
| Auth | Session-cookie based, 9 roles |

**Key point:** the AI does not "know" your data. It calls **governed tools** that query the database live. The model only orchestrates — every fact comes from a tool result.

---

## 2. How It Works (the architecture story — 30 seconds)

```
User speaks/types  →  /api/ai/orchestrate
      →  Azure OpenAI decides WHICH tool(s) to call (function-calling)
      →  Tools are FILTERED by the user's role (RBAC) — they only see what they're allowed
      →  Each tool runs a live Prisma query against the database
      →  Results are fed back to the model → it writes a grounded answer + cites sources
      →  Any WRITE action is NOT executed — it becomes a Pending Action for human approval
      →  Every call is logged to the Audit trail (who, what, tool, grounded?, refused?)
```

Four guarantees baked in (§6 governance):
1. **Grounded-or-refuse** — if there's no tool/data to back a claim, it refuses instead of fabricating.
2. **RBAC** — the tool list is built per role; a student literally cannot call staff tools.
3. **Human-in-the-loop** — every write (notice, hall ticket, mentor brief, payment plan) needs approval.
4. **Auditability** — every AI action is recorded with its inputs and sources.

---

## 3. "Where does this data actually come from?" (the honest answer)

**Say this:**
> "Everything the assistant shows is queried **live from the database through governed tools** — nothing is hardcoded in the chat. Today it runs on a **seeded demo database** (Prisma/SQLite) with representative KRMU data — 12 students, 8 faculty, fees, attendance, exam results, registrations, grievances. In production we point the **same tool + API layer** at your **real SIS/ERP database** (PostgreSQL) — the AI layer doesn't change at all, only the connection string."

**If pushed on forward-looking numbers (elective forecast, NAAC checklist):**
> "Predictive figures — like 3-year elective take-up trends or the NAAC evidence checklist — use **representative baselines** because that historical series isn't in the demo seed. They're clearly **labelled 'advisory / prediction, not fact'**, carry a confidence score, and expose the exact inputs that produced them. In production they read from your historical registration and IQAC data."

**Data tables that are real & live-queried (Prisma):**
`Student · Faculty · Course · FeeRecord · AttendanceRecord · ExamResult · Registration · Grievance · CertificateRequest · Policy · Prediction · PendingAction · AiEvent (audit)`

---

## 4. THE 6 USE CASES — full run-of-show

> For each: **who to log in as**, the **exact prompt**, **what fires under the hood**, **where the data comes from**, the **expected result**, and **what to say**.

---

### UC1 · Academic-Risk Intervention
**Log in as:** Registrar (or Admin)
**Say:** "A dean wants to catch struggling students early — one question."
**Type:**
> `List at-risk students, then draft mentor briefs for the top 10.`

**Under the hood:**
- Tools: `get_at_risk_students` → `draft_mentor_briefs`
- Data: `Student` table (attendance, CGPA, fee dues) — **live query**
- Logic: shared `computeAtRisk()` helper — at-risk if **attendance < 75% OR CGPA < 6 OR dues > ₹50k**; blended score = attendance 50% + CGPA 30% + fees 20%

**Expected result:** 4 flagged — Rahul Pandey (0.29), Rohit Verma (0.22), Arjun Kumar (0.11), Deepak Chauhan — each with reasons. Mentor briefs → **approval queue** (not sent).

**What to say:**
> "It blended three modules — attendance, exams, fees — scored every student, and prepared interventions. Notice it didn't *send* anything: the briefs are sitting in the approval queue for a human. That's the governance model."

---

### UC2 · Fee-Deadline Crisis
**Log in as:** Finance
**Type:**
> `Who is overdue by more than 30 days, and propose a 3-instalment plan for Rahul Pandey.`

**Under the hood:**
- Tools: `get_overdue_dues` → `propose_payment_plan`
- Data: `FeeRecord` table — live (due amount, due date, status)

**Expected result:** Only **Rahul Pandey — 36 days overdue, ₹1,20,000**. Plan: **₹40,000 × 3** (Mar/Apr/May). Marked *proposal only — needs approval*.

**What to say:**
> "This is the client's real June-deadline pain. It found who genuinely missed the window and drafted a hardship plan — advisory, needs finance approval before anything changes."

---

### UC3 · Elective Demand → Resource Plan  *(the competitor-killer)*
**Log in as:** HOD
**Type:**
> `Forecast Sem-5 CSE elective demand, tell me which breach capacity, how many extra sections I need, and which faculty are free to teach Machine Learning.`

**Under the hood:**
- Tools: `forecast_elective_demand` → `plan_sections` → `get_faculty_availability` (**3 tools, one turn**)
- Data: elective take-up baselines (advisory) + `Faculty` / `Course` tables (live) for workload

**Expected result:** Machine Learning **68 predicted vs 60 capacity → over-subscribed**, +1 section, and the qualified faculty with spare load.

**What to say:**
> "Competitors demo single-student lookups. This is a **cohort-level planning decision** — predict demand, detect the capacity breach, compute the fix, and staff it — chained in one conversation. Every number shows its basis and a confidence band."

---

### UC4 · Accreditation (NAAC)
**Log in as:** Registrar (or IQAC)
**Type:**
> `What data is missing for NAAC criterion 2, and compute the student-teacher ratio showing how it is derived.`

**Under the hood:**
- Tools: `naac_gap_check` → `assemble_accreditation_figure`
- Data: NAAC evidence checklist (advisory baseline) + **live counts** from `Student` and `Faculty` for the ratio

**Expected result:** 2 gaps (student-satisfaction survey 67%, mentor-mentee evidence missing) + student-teacher ratio computed **with every input cited to its source record**.

**What to say:**
> "Accreditation is a data-gathering nightmare. It tells you exactly what's missing and which module owns it, then computes statutory figures with full traceability — auditor-ready."

---

### UC5 · Permission Kill-Shot
**Part A — Log in as:** Student
**Type:**
> `Show me Arjun Kumar's marks and attendance.`
→ **Refused.** "I can only access your own record."

**Part B — Log in as:** Admin
**Type (same question):**
> `What is Arjun Kumar's attendance and CGPA?`
→ **Answers: 72% attendance, CGPA 7.4.**

**Under the hood:**
- Student: no tool available for other students → refusal
- Admin: `get_student_record` (staff-only tool) → live `Student` query

**What to say:**
> "Same assistant, same question, opposite outcome — because permissions are enforced at the **tool layer**, not by asking the model nicely. A student cannot even reach the tool. This is how you trust AI with student data."

---

### UC6 · Exam Eligibility & Debarment  *(real-ERP flagship)*
**Log in as:** Registrar (or Exam Officer)
**Type:**
> `Run the exam eligibility check, tell me who is debarred and why, then generate hall tickets for the eligible students.`

**Under the hood:**
- Tools: `check_exam_eligibility` → `generate_hall_tickets`
- Data: **three modules joined live** — `Student` (attendance) + `FeeRecord` (dues) + `Registration` (status)
- Gates: attendance ≥ 75% **AND** fees cleared **AND** registration not rejected

**Expected result:** **12 checked → 7 eligible, 5 debarred**, each with exact blocker (e.g. "Arjun — attendance 72% + ₹45,000 dues"). Hall tickets for the 7 → **approval queue**.

**What to say:**
> "This is what a registrar actually does before every exam — and it's error-prone and manual. It cross-checked three systems, produced the debarment list with reasons, and staged hall tickets for approval. Cross-module, high-stakes, auditable."

---

## 5. Beyond the 6 — proves it generalizes (mention, optionally show)

- **Proactive AI briefing** on every dashboard — greets each persona with what needs attention *before they ask* (grounded, role-specific).
- **Everyday self-service:** "show my fees / marks / attendance / timetable / my teachers / exam schedule" — answers **and opens the page**.
- **Voice + Hindi/Hinglish** via the mic orb: "meri fees dikhao", "wifi not working in hostel" → files a grievance, auto-routed.
- **Predictions module** — dropout risk, fee forecast, enrolment — each explainable, confidence-scored, **retained + back-testable**.
- **Governance module** — full audit log of every AI action.
- **49 governed tools**, 9 roles, 19 modules.

---

## 6. Tough Questions — ready answers

**Q: Is the AI making these numbers up?**
> No. The model never sees the database. It calls tools that run live queries; the answer is built from tool results and cites the source. If no tool can ground it, it refuses — we demoed that (ask for "average student height" → it declines).

**Q: What model? Is our data sent to OpenAI to train?**
> Azure OpenAI (enterprise). Azure does **not** train on your data. It can be deployed in an India region for residency. The model only orchestrates tool calls; the data stays in your database.

**Q: Can a student trick it into seeing others' data?**
> No — tools are filtered by role before the model ever runs. Prompt-injection can't grant a tool that isn't in the list. We showed the student refusal + admin allow.

**Q: What happens when the AI wants to *do* something (send a notice, issue tickets)?**
> It never executes writes directly. It creates a **Pending Action** for a human to approve or reject — logged with who decided and when.

**Q: How do we connect our real ERP/SIS?**
> The data layer is Prisma. Switch the provider from SQLite to your PostgreSQL (or point tools at your existing APIs). The AI, RBAC, and governance layers are unchanged.

**Q: How do you know the AI is accurate?**
> There's a built-in **eval harness** (`/api/ai/eval`) — currently 100% (11/11) — covering tool-selection, grounding, refusals, and permission scoping. It runs on demand and can gate releases.

**Q: What about hallucinated predictions?**
> Predictions are labelled "advisory, not fact", carry a confidence score, expose their inputs, and — critically — **no action is ever taken on a person from a prediction alone**.

---

## 7. Suggested demo order (7–8 min)

1. **Login screen** → show the 9 roles.
2. **Log in as Registrar** → point at the **proactive briefing** (it already knows the day's issues).
3. **UC6 Exam Eligibility** (the wow — cross-module).
4. **UC1 At-Risk → mentor briefs** → open **Approvals** to show the queued action.
5. **UC3 Elective Forecast** as HOD (the competitor differentiator).
6. **UC5 Permission** — student refused, admin allowed (trust).
7. **UC2 / UC4** if time.
8. Close on **Governance / Audit log** + the one-line pitch.

> Tip: run UC1/UC4/UC6 as **Registrar/Admin**, UC3 as **HOD**, UC2 as **Finance**, UC5 as **Student then Admin** — that's where each reads cleanest.
