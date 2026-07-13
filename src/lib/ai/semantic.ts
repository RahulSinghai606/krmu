// §6.3.1 Structured & semantic data layer.
// A documented, queryable description of KRMU's entities — what each means and its authoritative source.
// The orchestrator hands this to the model so NL questions resolve to precise tool calls, not guesses.

export interface EntityDef {
  entity: string;
  description: string;
  source: string; // authoritative module
  key: string;
  fields: Record<string, string>;
  relations?: string[];
}

export const ENTITY_CATALOG: EntityDef[] = [
  {
    entity: "Student",
    description: "Authoritative record of a person enrolled at KRMU and their academic standing.",
    source: "Student Information System (SIS)",
    key: "enrollmentNo",
    fields: {
      name: "Full name", enrollmentNo: "Unique enrolment number", programme: "Degree programme (e.g. B.Tech CSE)",
      school: "Owning school code (SOET, SMS, SOL, ...)", semester: "Current semester (int)", section: "Class section",
      cgpa: "Cumulative GPA 0–10", attendance: "Overall attendance %", feeDue: "Outstanding fee (₹)", status: "enrolled|on-leave|graduated|withdrawn",
    },
    relations: ["has many FeeRecord", "has many ExamResult", "has many AttendanceRecord", "has one Registration per semester"],
  },
  {
    entity: "FeeRecord",
    description: "A fee head billed to a student with paid/due amounts and payment status.",
    source: "Fee Management",
    key: "id",
    fields: { studentName: "Student", feeHead: "Fee type", amount: "Billed ₹", paid: "Paid ₹", due: "Outstanding ₹", status: "paid|partial|overdue|pending" },
  },
  {
    entity: "ExamResult",
    description: "A student's internal+external marks, total and grade for a course.",
    source: "Examinations & Evaluation",
    key: "id",
    fields: { studentName: "Student", courseCode: "Course", internal: "/30", external: "/70", total: "/100", grade: "O..F", status: "draft|published" },
  },
  {
    entity: "AttendanceRecord",
    description: "One attendance mark for a student in a course on a date.",
    source: "Attendance",
    key: "id",
    fields: { studentName: "Student", courseCode: "Course", date: "Session date", status: "present|absent|leave" },
  },
  {
    entity: "Registration",
    description: "A student's semester course registration and its approval status.",
    source: "Semester Registration",
    key: "id",
    fields: { studentName: "Student", semester: "Sem", credits: "Total credits", status: "submitted|advisor_approved|confirmed|rejected" },
  },
  {
    entity: "Faculty",
    description: "A teaching staff member and their department/designation.",
    source: "HR & Faculty",
    key: "employeeId",
    fields: { name: "Name", designation: "Title", department: "Department", school: "School", status: "active|on-leave" },
  },
];

export function catalogPrompt(): string {
  return [
    "=== KRMU SEMANTIC DATA MODEL ===",
    ...ENTITY_CATALOG.map(e =>
      `${e.entity} (source: ${e.source}; key: ${e.key}): ${e.description}\n  fields: ${Object.entries(e.fields).map(([k, v]) => `${k} (${v})`).join(", ")}` +
      (e.relations ? `\n  relations: ${e.relations.join("; ")}` : "")
    ),
    "Resolve user questions to the right entity + tool. Never invent fields not listed here.",
  ].join("\n");
}
