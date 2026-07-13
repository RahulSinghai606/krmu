import type { UserRole } from "./types";

// Module keys map 1:1 to /dashboard/<key> routes ("dashboard" = index).
export type ModuleKey =
  | "dashboard" | "mis" | "ai" | "notifications" | "approvals" | "aiops" | "workflows" | "predictions" | "calendar"
  | "students" | "curriculum" | "registration" | "timetable" | "timetable-generator" | "attendance" | "examinations"
  | "fees" | "hr" | "hostel" | "transport" | "grievance"
  | "certificates" | "accreditation" | "documents" | "access" | "designsystem"
  | "committee" | "admissions";

// Which modules each role may open. Enforced by sidebar (visibility) AND route guard (access).
export const ACCESS: Record<UserRole, ModuleKey[]> = {
  admin: ["dashboard", "mis", "ai", "aiops", "approvals", "workflows", "predictions", "notifications", "students", "curriculum", "registration", "timetable", "timetable-generator", "attendance", "examinations", "fees", "hr", "hostel", "transport", "grievance", "certificates", "accreditation", "documents", "access", "designsystem", "committee", "admissions"],
  registrar: ["dashboard", "mis", "ai", "aiops", "approvals", "workflows", "predictions", "notifications", "students", "curriculum", "registration", "timetable", "timetable-generator", "examinations", "grievance", "certificates", "accreditation", "documents", "committee", "admissions"],
  dean: ["dashboard", "mis", "ai", "approvals", "workflows", "predictions", "notifications", "students", "curriculum", "registration", "attendance", "examinations", "hr", "grievance", "accreditation", "committee", "admissions"],
  hod: ["dashboard", "ai", "approvals", "workflows", "predictions", "notifications", "students", "curriculum", "timetable", "attendance", "examinations", "hr", "grievance", "committee"],
  faculty: ["dashboard", "ai", "timetable", "attendance", "examinations", "students"],
  student: ["dashboard", "ai", "examinations", "attendance", "fees", "registration", "timetable", "grievance", "certificates"],
  finance: ["dashboard", "mis", "ai", "approvals", "workflows", "predictions", "notifications", "students", "fees", "hr", "transport"],
  exam_officer: ["dashboard", "mis", "ai", "approvals", "workflows", "students", "examinations", "timetable", "certificates", "admissions"],
  hostel_warden: ["dashboard", "ai", "students", "hostel", "grievance"],
};

// Per-role label overrides — a student's "Examinations" is "My Results", etc.
export const LABELS: Partial<Record<UserRole, Partial<Record<ModuleKey, string>>>> = {
  student: {
    examinations: "My Results",
    attendance: "My Attendance",
    fees: "My Fees",
    timetable: "My Timetable",
    grievance: "My Grievances",
    certificates: "Request Certificate",
    registration: "Course Registration",
  },
  faculty: {
    attendance: "Mark Attendance",
    examinations: "Marks Entry",
    students: "My Students",
    timetable: "My Timetable",
  },
  hod: {
    students: "Department Students",
    hr: "Department Faculty",
  },
};

export function canAccess(role: UserRole | undefined, key: ModuleKey): boolean {
  if (!role) return false;
  if (key === "calendar") return true; // personal calendar available to every authenticated role
  return ACCESS[role]?.includes(key) ?? false;
}

export function labelFor(role: UserRole | undefined, key: ModuleKey, fallback: string): string {
  if (!role) return fallback;
  return LABELS[role]?.[key] ?? fallback;
}

// Resolve module key from a pathname like /dashboard/fees → "fees", /dashboard → "dashboard".
export function moduleFromPath(pathname: string): ModuleKey {
  const m = pathname.replace(/^\/dashboard\/?/, "").split("/")[0];
  return (m || "dashboard") as ModuleKey;
}
