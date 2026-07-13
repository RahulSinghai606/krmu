// §6.1.2 Agentic automation — multi-step workflows that PREPARE and PROPOSE.
// Every consequential step becomes a PendingAction for human approval (§6.4). Extensible catalogue.
import { prisma } from "@/lib/db";

export interface WorkflowResult {
  brief: string;                 // human-readable summary of what the agent found/did
  findings: unknown;             // structured detail
  prepared: { tool: string; summary: string; params: Record<string, unknown> }[]; // → PendingActions
  sources: string[];
}

export interface Workflow {
  key: string;
  name: string;
  description: string;
  needsInput?: { field: string; label: string }[];
  run: (input: Record<string, string>) => Promise<WorkflowResult>;
}

const riskScore = (attendance: number, cgpa: number, feeDue: number) => {
  // Explainable weighted score 0..1 — higher = more at risk.
  const att = attendance < 75 ? (75 - attendance) / 75 : 0;       // attendance shortfall
  const aca = cgpa < 6 ? (6 - cgpa) / 6 : 0;                        // academic weakness
  const fin = feeDue > 0 ? Math.min(1, feeDue / 100000) : 0;        // financial stress
  return +(att * 0.5 + aca * 0.3 + fin * 0.2).toFixed(2);
};

export const WORKFLOWS: Workflow[] = [
  {
    key: "fee_default_followup",
    name: "Fee-default follow-up",
    description: "Identify defaulters, prepare personalised reminders, and schedule escalation.",
    run: async () => {
      const defaulters = await prisma.feeRecord.findMany({ where: { due: { gt: 0 } }, orderBy: { due: "desc" } });
      const total = defaulters.reduce((s, f) => s + f.due, 0);
      return {
        brief: `Found **${defaulters.length} defaulters** owing **₹${total.toLocaleString("en-IN")}**. Prepared reminders for approval; overdue cases (${defaulters.filter(d => d.status === "overdue").length}) flagged for escalation.`,
        findings: defaulters.map(d => ({ student: d.studentName, programme: d.programme, due: d.due, status: d.status })),
        prepared: [{ tool: "prepare_fee_reminders", summary: `Reminders to ${defaulters.length} fee defaulters (₹${total.toLocaleString("en-IN")})`, params: {} }],
        sources: ["Fee Management"],
      };
    },
  },
  {
    key: "academic_risk",
    name: "Academic-risk intervention",
    description: "Combine attendance, marks and fee status to find at-risk students and route a brief to mentors.",
    run: async () => {
      const students = await prisma.student.findMany();
      const scored = students
        .map(s => ({ s, score: riskScore(s.attendance, s.cgpa, s.feeDue) }))
        .filter(x => x.score >= 0.2)
        .sort((a, b) => b.score - a.score);
      const high = scored.filter(x => x.score >= 0.4);
      return {
        brief: `Identified **${scored.length} at-risk students** (${high.length} high-risk). Risk blends attendance (50%), CGPA (30%), fees (20%). A mentor brief is prepared for approval.`,
        findings: scored.map(x => ({
          student: x.s.name, programme: x.s.programme, risk: x.score,
          band: x.score >= 0.4 ? "high" : x.score >= 0.3 ? "medium" : "low",
          why: [x.s.attendance < 75 ? `attendance ${x.s.attendance}%` : null, x.s.cgpa < 6 ? `CGPA ${x.s.cgpa}` : null, x.s.feeDue > 0 ? `dues ₹${x.s.feeDue}` : null].filter(Boolean).join(", "),
        })),
        prepared: [{ tool: "send_notice", summary: `Academic-risk mentor brief for ${scored.length} students`, params: { audience: "Programme mentors", title: "At-risk student intervention list", message: `${scored.length} students flagged at academic risk this cycle. Please counsel and record outcomes.` } }],
        sources: ["SIS", "Attendance", "Examinations", "Fee Management"],
      };
    },
  },
  {
    key: "draft_circular",
    name: "Draft circular / notice",
    description: "Produce a first draft of a circular from a short instruction, in University format.",
    needsInput: [{ field: "topic", label: "What is the circular about?" }, { field: "audience", label: "Audience" }],
    run: async (input) => {
      const topic = input.topic || "General announcement";
      const audience = input.audience || "All students";
      const draft = `Sub: ${topic}\n\nThis is to inform all concerned (${audience}) that ${topic.toLowerCase()}. All are requested to take note and comply by the stipulated date. For queries, contact the concerned office.\n\n— Office of the Registrar, K.R. Mangalam University`;
      return {
        brief: `Drafted a circular on **"${topic}"** for **${audience}**. Review and approve to release.`,
        findings: { draft },
        prepared: [{ tool: "send_notice", summary: `Circular: ${topic} → ${audience}`, params: { audience, title: topic, message: draft } }],
        sources: ["Registrar templates"],
      };
    },
  },
  {
    key: "data_reconciliation",
    name: "Cross-module reconciliation",
    description: "Compare data across modules and surface mismatches for correction.",
    run: async () => {
      const students = await prisma.student.findMany();
      const fees = await prisma.feeRecord.findMany();
      const dueByStudent: Record<string, number> = {};
      fees.forEach(f => { dueByStudent[f.studentId] = (dueByStudent[f.studentId] || 0) + f.due; });
      const mismatches = students
        .map(s => ({ s, sis: s.feeDue, fees: dueByStudent[s.id] || 0 }))
        .filter(x => x.sis !== x.fees);
      return {
        brief: `Compared SIS \`feeDue\` against Fee-Management records for **${students.length} students**. Found **${mismatches.length} mismatch(es)**. Correction proposals prepared for review.`,
        findings: mismatches.map(m => ({ student: m.s.name, sisFeeDue: m.sis, feeModuleDue: m.fees, delta: m.fees - m.sis })),
        prepared: mismatches.length ? [{ tool: "send_notice", summary: `Data-correction review: ${mismatches.length} fee mismatches`, params: { audience: "Finance + Registry", title: "Fee data reconciliation", message: `${mismatches.length} students have SIS feeDue inconsistent with fee records. Review attached proposals.` } }] : [],
        sources: ["SIS", "Fee Management"],
      };
    },
  },
  {
    key: "accreditation_report",
    name: "Accreditation draft (NAAC/AISHE)",
    description: "Assemble a first draft of statutory figures, each traceable to source.",
    run: async () => {
      const [students, faculty, results] = await Promise.all([
        prisma.student.count(), prisma.faculty.count(),
        prisma.examResult.findMany({ where: { status: "published" } }),
      ]);
      const passed = results.filter(r => r.total >= 45).length;
      const passRate = results.length ? Math.round((passed / results.length) * 100) : 0;
      const ratio = faculty ? Math.round(students / faculty) : 0;
      const figures = [
        { metric: "Total enrolled students", value: students, source: "SIS · Student master" },
        { metric: "Total faculty", value: faculty, source: "HR & Faculty" },
        { metric: "Student–faculty ratio", value: `${ratio}:1`, source: "Derived (SIS / HR)" },
        { metric: "Result pass rate (published)", value: `${passRate}%`, source: "Examinations" },
      ];
      return {
        brief: `Assembled **${figures.length} accreditation figures**, each traceable to its source module. Ready for IQAC review before submission.`,
        findings: figures,
        prepared: [],
        sources: ["SIS", "HR & Faculty", "Examinations"],
      };
    },
  },
  {
    key: "admitted_onboarding",
    name: "Admitted-student onboarding",
    description: "Prepare admitted-student records, flagging gaps and inconsistencies for review.",
    run: async () => {
      const students = await prisma.student.findMany();
      const flagged = students
        .map(s => ({ s, gaps: [!s.phone && "phone", !s.guardianName && "guardian", !s.dob && "DOB", !s.address && "address"].filter(Boolean) as string[] }))
        .filter(x => x.gaps.length > 0);
      return {
        brief: `Reviewed **${students.length} records**. **${flagged.length}** have missing fields needing completion before activation.`,
        findings: flagged.map(f => ({ student: f.s.name, enrollmentNo: f.s.enrollmentNo, missing: f.gaps.join(", ") })),
        prepared: [],
        sources: ["SIS", "Admissions CRM (boundary)"],
      };
    },
  },
];

export function getWorkflow(key: string) { return WORKFLOWS.find(w => w.key === key); }
