// Applies structured edit operations to a timetable spec. The LLM only produces these
// ops (from plain-English); this code applies them deterministically, then the engine re-runs.
import { TTSpec, Subject, SlotType, hoursFromCredits } from "./engine";

export type EditOp =
  | { type: "set_credits"; subject: string; credits: number }
  | { type: "set_hours"; subject: string; hoursPerWeek: number }
  | { type: "replace_faculty"; subject: string; faculty: string }
  | { type: "rename_subject"; subject: string; name: string }
  | { type: "mark_unavailable"; faculty: string; day: string }
  | { type: "clear_unavailable"; faculty: string }
  | { type: "remove_subject"; subject: string }
  | { type: "add_subject"; name: string; code?: string; faculty: string; credits: number; slotType?: SlotType }
  | { type: "set_target_credits"; credits: number };

function findSub(spec: TTSpec, q: string): Subject | undefined {
  const s = q.trim().toLowerCase();
  return spec.subjects.find(x => x.code.toLowerCase() === s)
    || spec.subjects.find(x => x.name.toLowerCase() === s)
    || spec.subjects.find(x => x.name.toLowerCase().includes(s) || x.code.toLowerCase().includes(s));
}

const DAYS_CANON = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const canonDay = (d: string) => DAYS_CANON.find(x => x.toLowerCase().startsWith(d.trim().toLowerCase().slice(0, 3))) || d;

export function applyEdits(spec: TTSpec, ops: EditOp[]): { spec: TTSpec; applied: string[]; skipped: string[] } {
  const next: TTSpec = JSON.parse(JSON.stringify(spec));
  next.unavailable = next.unavailable || [];
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const op of ops) {
    switch (op.type) {
      case "set_credits": {
        const s = findSub(next, op.subject);
        if (!s) { skipped.push(`No subject matched "${op.subject}"`); break; }
        const old = s.credits;
        s.credits = op.credits;
        s.hoursPerWeek = hoursFromCredits(s.type, op.credits); // keep hours consistent with new credits
        applied.push(`${s.name}: credits ${old} → ${op.credits} (now ${s.hoursPerWeek} hrs/week)`);
        break;
      }
      case "set_hours": {
        const s = findSub(next, op.subject);
        if (!s) { skipped.push(`No subject matched "${op.subject}"`); break; }
        applied.push(`${s.name}: ${s.hoursPerWeek} → ${op.hoursPerWeek} hrs/week`);
        s.hoursPerWeek = op.hoursPerWeek;
        break;
      }
      case "replace_faculty": {
        const s = findSub(next, op.subject);
        if (!s) { skipped.push(`No subject matched "${op.subject}"`); break; }
        applied.push(`${s.name}: faculty ${s.faculty} → ${op.faculty}`);
        s.faculty = op.faculty;
        break;
      }
      case "rename_subject": {
        const s = findSub(next, op.subject);
        if (!s) { skipped.push(`No subject matched "${op.subject}"`); break; }
        applied.push(`Renamed "${s.name}" → "${op.name}"`);
        s.name = op.name;
        break;
      }
      case "mark_unavailable": {
        const day = canonDay(op.day);
        if (!next.unavailable.some(u => u.faculty === op.faculty && u.day === day)) next.unavailable.push({ faculty: op.faculty, day });
        applied.push(`${op.faculty} marked unavailable on ${day}`);
        break;
      }
      case "clear_unavailable": {
        next.unavailable = next.unavailable.filter(u => u.faculty !== op.faculty);
        applied.push(`Cleared unavailability for ${op.faculty}`);
        break;
      }
      case "remove_subject": {
        const s = findSub(next, op.subject);
        if (!s) { skipped.push(`No subject matched "${op.subject}"`); break; }
        next.subjects = next.subjects.filter(x => x !== s);
        applied.push(`Removed ${s.name}`);
        break;
      }
      case "add_subject": {
        const t: SlotType = op.slotType || "lecture";
        const code = op.code || op.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 4) + next.subjects.length;
        next.subjects.push({ code, name: op.name, faculty: op.faculty, credits: op.credits, type: t, hoursPerWeek: hoursFromCredits(t, op.credits) });
        applied.push(`Added ${op.name} (${op.credits} cr, ${op.faculty})`);
        break;
      }
      case "set_target_credits": {
        applied.push(`Target credits ${next.targetCredits} → ${op.credits}`);
        next.targetCredits = op.credits;
        break;
      }
      default:
        skipped.push(`Unknown operation`);
    }
  }
  return { spec: next, applied, skipped };
}
