// Deterministic constraint-based timetable scheduler.
// The AI never invents the grid — it only edits the SPEC (credits/faculty/availability);
// this engine produces a clash-free schedule from that spec. That keeps the timetable correct.

export type SlotType = "lecture" | "lab" | "tutorial";

export interface Subject {
  code: string;
  name: string;
  faculty: string;
  credits: number;
  type: SlotType;
  hoursPerWeek: number;
}

export interface Period {
  label: string;   // e.g. "09:00–10:00"
  start: string;
  end: string;
  isBreak?: boolean;
}

export interface TTSpec {
  programme: string;
  branch: string;
  semester: number;
  section: string;
  academicYear: string;
  studentCount: number;
  targetCredits: number;
  days: string[];
  periods: Period[];
  subjects: Subject[];
  unavailable?: { faculty: string; day: string }[];
}

export interface Placed {
  code: string;
  name: string;
  faculty: string;
  type: SlotType;
  room: string;
}

export interface TTResult {
  grid: (Placed | null)[][];               // [dayIndex][periodIndex]
  creditSummary: {
    code: string; name: string; faculty: string; credits: number;
    type: SlotType; hoursPlaced: number; hoursNeeded: number;
  }[];
  facultyLoad: { faculty: string; hours: number; subjects: string[] }[];
  sections: number;
  totalCredits: number;
  targetCredits: number;
  creditStatus: "match" | "under" | "over";
  totalContactHours: number;
  unplaced: { code: string; name: string; missing: number }[];
  warnings: string[];
}

// Credits → weekly contact hours (AICTE-style convention): lecture 1h/credit, lab 2h/credit, tutorial 1h.
export function hoursFromCredits(type: SlotType, credits: number): number {
  if (type === "lab") return Math.max(2, credits * 2);
  if (type === "tutorial") return 1;
  return Math.max(1, credits);
}

const roomFor = (spec: TTSpec, s: Subject) =>
  s.type === "lab" ? `${s.code}-Lab` : `${spec.branch}-${spec.section}-${String(101 + (spec.semester % 5))}`;

function isUnavailable(spec: TTSpec, faculty: string, day: string): boolean {
  return !!spec.unavailable?.some(u => u.faculty === faculty && u.day === day);
}

/** Produce a clash-free weekly timetable for one representative section. */
export function generateTimetable(spec: TTSpec): TTResult {
  const D = spec.days.length;
  const P = spec.periods.length;
  const grid: (Placed | null)[][] = Array.from({ length: D }, () => Array(P).fill(null));
  const teachable = (p: number) => !spec.periods[p].isBreak;
  const warnings: string[] = [];
  const unplaced: TTResult["unplaced"] = [];

  // Labs first (need consecutive blocks), then heavier subjects.
  const ordered = [...spec.subjects].sort((a, b) => {
    if (a.type === "lab" && b.type !== "lab") return -1;
    if (b.type === "lab" && a.type !== "lab") return 1;
    return b.hoursPerWeek - a.hoursPerWeek;
  });

  const hoursPlaced: Record<string, number> = {};

  for (const s of ordered) {
    hoursPlaced[s.code] = 0;
    const daysUsed = new Set<number>();

    const placeOne = (allowRepeatDay: boolean): boolean => {
      if (s.type === "lab") {
        // find two consecutive teachable, empty periods on the same day
        for (let d = 0; d < D; d++) {
          if (isUnavailable(spec, s.faculty, spec.days[d])) continue;
          if (!allowRepeatDay && daysUsed.has(d)) continue;
          for (let p = 0; p < P - 1; p++) {
            if (teachable(p) && teachable(p + 1) && !grid[d][p] && !grid[d][p + 1]) {
              const cell: Placed = { code: s.code, name: s.name, faculty: s.faculty, type: s.type, room: roomFor(spec, s) };
              grid[d][p] = cell; grid[d][p + 1] = cell;
              daysUsed.add(d); hoursPlaced[s.code] += 2;
              return true;
            }
          }
        }
        return false;
      }
      // lecture / tutorial: one free teachable slot, spread across days
      for (let d = 0; d < D; d++) {
        if (isUnavailable(spec, s.faculty, spec.days[d])) continue;
        if (!allowRepeatDay && daysUsed.has(d)) continue;
        for (let p = 0; p < P; p++) {
          if (teachable(p) && !grid[d][p]) {
            grid[d][p] = { code: s.code, name: s.name, faculty: s.faculty, type: s.type, room: roomFor(spec, s) };
            daysUsed.add(d); hoursPlaced[s.code] += 1;
            return true;
          }
        }
      }
      return false;
    };

    const step = s.type === "lab" ? 2 : 1;
    while (hoursPlaced[s.code] < s.hoursPerWeek) {
      // try to spread first; if the grid forces it, allow a second session same day
      const ok = placeOne(false) || placeOne(true);
      if (!ok) break;
      if (s.hoursPerWeek - hoursPlaced[s.code] < step) break;
    }
    const missing = s.hoursPerWeek - hoursPlaced[s.code];
    if (missing > 0) unplaced.push({ code: s.code, name: s.name, missing });
  }

  // Credit summary
  const creditSummary = spec.subjects.map(s => ({
    code: s.code, name: s.name, faculty: s.faculty, credits: s.credits, type: s.type,
    hoursPlaced: hoursPlaced[s.code] || 0, hoursNeeded: s.hoursPerWeek,
  }));

  // Faculty load
  const loadMap: Record<string, { hours: number; subjects: Set<string> }> = {};
  for (let d = 0; d < D; d++) for (let p = 0; p < P; p++) {
    const c = grid[d][p];
    if (!c) continue;
    (loadMap[c.faculty] ||= { hours: 0, subjects: new Set() });
    loadMap[c.faculty].hours += 1;
    loadMap[c.faculty].subjects.add(c.code);
  }
  const facultyLoad = Object.entries(loadMap).map(([faculty, v]) => ({ faculty, hours: v.hours, subjects: [...v.subjects] }))
    .sort((a, b) => b.hours - a.hours);

  // Credits vs target
  const totalCredits = spec.subjects.reduce((s, x) => s + x.credits, 0);
  const creditStatus: TTResult["creditStatus"] = totalCredits === spec.targetCredits ? "match" : totalCredits < spec.targetCredits ? "under" : "over";
  if (creditStatus !== "match") warnings.push(`Total credits ${totalCredits} ${creditStatus === "under" ? "below" : "above"} target of ${spec.targetCredits}.`);
  if (unplaced.length) warnings.push(`${unplaced.length} subject(s) could not be fully placed — grid is too small for the required hours. Add periods/days or reduce hours.`);
  facultyLoad.forEach(f => { if (f.hours > 20) warnings.push(`${f.faculty} is loaded ${f.hours} hrs/week (high).`); });

  const sections = Math.max(1, Math.ceil(spec.studentCount / 60));
  const totalContactHours = Object.values(hoursPlaced).reduce((a, b) => a + b, 0);

  return { grid, creditSummary, facultyLoad, sections, totalCredits, targetCredits: spec.targetCredits, creditStatus, totalContactHours, unplaced, warnings };
}
