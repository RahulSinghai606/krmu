import crypto from "crypto";

export const CERT_TYPES = [
  "Bonafide Certificate", "Transcript", "Migration Certificate",
  "Duplicate Marksheet", "Character Certificate", "Fee Structure Certificate",
];

export interface EligibilityInput {
  status: string; feeDue: number; libraryDue: number; disciplinaryFlag: boolean;
}

// A certificate can be issued only if the student is active and has NO holds.
export function certEligibility(s: EligibilityInput): { clear: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (s.status !== "enrolled") reasons.push(`enrolment status is "${s.status}"`);
  if (s.feeDue > 0) reasons.push(`pending fees ₹${s.feeDue.toLocaleString("en-IN")}`);
  if (s.libraryDue > 0) reasons.push(`library dues ₹${s.libraryDue.toLocaleString("en-IN")}`);
  if (s.disciplinaryFlag) reasons.push("active disciplinary hold");
  return { clear: reasons.length === 0, reasons };
}

// Deterministic verification code for the issued document (SHA-256 → short code).
export function certHash(id: string, name: string, type: string): string {
  return crypto.createHash("sha256").update(`${id}|${name}|${type}|KRMU-REGISTRAR`).digest("hex").slice(0, 16).toUpperCase();
}
