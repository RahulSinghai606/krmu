import type { User, UserRole } from "./types";

// Demo identity directory. In production this is replaced by the IdP / SIS-backed user store.
export const DEMO_USERS: Record<UserRole, User> = {
  admin: { id: "u001", name: "Dr. Alok Tiwari", email: "alok.tiwari@krmu.edu.in", role: "admin", department: "Administration", school: "KRMU", employeeId: "KRMU-ADM-001" },
  registrar: { id: "u002", name: "Mrs. Shobha Nair", email: "shobha.nair@krmu.edu.in", role: "registrar", department: "Registry", school: "KRMU", employeeId: "KRMU-REG-001" },
  dean: { id: "u003", name: "Prof. S.K. Pandey", email: "sk.pandey@krmu.edu.in", role: "dean", department: "SOET", school: "SOET", employeeId: "KRMU-F-2012-003" },
  hod: { id: "u004", name: "Dr. Rajeev Sharma", email: "rajeev.sharma@krmu.edu.in", role: "hod", department: "Computer Science", school: "SOET", employeeId: "KRMU-F-2018-001" },
  faculty: { id: "u005", name: "Dr. Kavitha Reddy", email: "kavitha.reddy@krmu.edu.in", role: "faculty", department: "Computer Science", school: "SOET", employeeId: "KRMU-F-2019-008" },
  student: { id: "u006", name: "Priya Sharma", email: "priya.sharma@krmu.edu.in", role: "student", department: "Computer Science", school: "SOET", studentId: "KRMU2024CSE001" },
  finance: { id: "u007", name: "Mr. Deepak Jain", email: "deepak.jain@krmu.edu.in", role: "finance", department: "Finance", school: "KRMU", employeeId: "KRMU-FIN-003" },
  hostel_warden: { id: "u008", name: "Mrs. Anita Rawat", email: "anita.rawat@krmu.edu.in", role: "hostel_warden", department: "Hostel", school: "KRMU", employeeId: "KRMU-HST-001" },
  exam_officer: { id: "u009", name: "Mr. Vikas Chandra", email: "vikas.chandra@krmu.edu.in", role: "exam_officer", department: "Examination Cell", school: "KRMU", employeeId: "KRMU-EXAM-001" },
};

export function userByEmail(email: string): User | undefined {
  return Object.values(DEMO_USERS).find(u => u.email === email);
}
