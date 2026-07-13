// Expands the weekly timetable across the FULL semester (≈6 months), day by day,
// excluding weekends-off and holidays, and tracks each course's delivered vs required hours.
import { TTSpec, TTResult, SlotType } from "./engine";

export interface Holiday { date: string; name: string; }

const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Representative Indian national/gazetted holidays for an Odd-Semester (Jul–Dec 2026) window.
// Universities set their own calendar — these are editable in the UI.
export const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-09-04", name: "Janmashtami" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-10-20", name: "Dussehra (Vijayadashami)" },
  { date: "2026-11-08", name: "Diwali" },
  { date: "2026-11-09", name: "Govardhan Puja" },
  { date: "2026-11-24", name: "Guru Nanak Jayanti" },
];

export interface DaySchedule {
  date: string;
  weekday: string;
  sessions: { period: string; code: string; name: string; faculty: string; type: SlotType; room: string }[];
}

export interface SemesterPlan {
  start: string;
  end: string;
  totalDays: number;
  teachingDays: number;
  weeks: number;
  holidays: (Holiday & { weekday: string })[];
  weekendDaysOff: number;
  days: DaySchedule[];               // teaching days only, chronological
  byMonth: { month: string; days: DaySchedule[] }[];
  delivery: {
    code: string; name: string; faculty: string; credits: number; type: SlotType;
    weeklyHours: number; deliveredHours: number; requiredHours: number; complete: boolean;
  }[];
  totalSessions: number;
}

// All date math in UTC so toISOString() never shifts the day across a timezone offset.
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const weekdayOf = (iso: string) => WD[new Date(iso + "T00:00:00Z").getUTCDay()];
const monthLabel = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

/** Expand the weekly grid over [start, end], skipping non-working weekdays and holidays. */
const emptyPlan = (start: string, end: string, spec: TTSpec): SemesterPlan => ({
  start, end, totalDays: 0, teachingDays: 0, weeks: 0, holidays: [], weekendDaysOff: 0,
  days: [], byMonth: [],
  delivery: spec.subjects.map(s => ({ code: s.code, name: s.name, faculty: s.faculty, credits: s.credits, type: s.type, weeklyHours: s.hoursPerWeek, deliveredHours: 0, requiredHours: 0, complete: false })),
  totalSessions: 0,
});

export function expandSemester(spec: TTSpec, weekly: TTResult, start: string, end: string, holidays: Holiday[]): SemesterPlan {
  // Guard against invalid/partial dates (the date inputs fire this on every keystroke).
  const sd = new Date(start + "T00:00:00Z"), ed = new Date(end + "T00:00:00Z");
  if (!start || !end || isNaN(sd.getTime()) || isNaN(ed.getTime()) || sd.getTime() > ed.getTime()) return emptyPlan(start, end, spec);

  const holidayMap = new Map(holidays.filter(h => h.date).map(h => [h.date, h.name]));

  // Index the weekly grid by weekday name → its sessions (dedupe lab "contd" cells).
  const weekdaySessions: Record<string, DaySchedule["sessions"]> = {};
  spec.days.forEach((day, di) => {
    const list: DaySchedule["sessions"] = [];
    spec.periods.forEach((p, pi) => {
      if (p.isBreak) return;
      const c = weekly.grid[di]?.[pi];
      if (!c) return;
      const prev = pi > 0 ? weekly.grid[di][pi - 1] : null;
      if (prev && prev.code === c.code && c.type === "lab") return; // skip the 2nd half of a lab block
      list.push({ period: p.label, code: c.code, name: c.name, faculty: c.faculty, type: c.type, room: c.room });
    });
    weekdaySessions[day] = list;
  });

  const days: DaySchedule[] = [];
  const holidaysHit: (Holiday & { weekday: string })[] = [];
  let totalDays = 0, weekendOff = 0;
  const deliveredHours: Record<string, number> = {};
  const weekdayOccur: Record<string, number> = {};

  let guard = 0;
  for (let cur = start; cur <= end; cur = addDays(cur, 1)) {
    if (++guard > 800) break; // hard cap (~2 years) — never runs away
    totalDays++;
    const wd = weekdayOf(cur);
    if (!spec.days.includes(wd)) { weekendOff++; continue; }
    if (holidayMap.has(cur)) { holidaysHit.push({ date: cur, name: holidayMap.get(cur)!, weekday: wd }); continue; }
    // teaching day
    const sessions = weekdaySessions[wd] || [];
    days.push({ date: cur, weekday: wd, sessions });
    weekdayOccur[wd] = (weekdayOccur[wd] || 0) + 1;
    // count delivered hours per course (lab block = 2 hrs)
    spec.days.forEach((day, di) => {
      if (day !== wd) return;
      spec.periods.forEach((p, pi) => {
        if (p.isBreak) return;
        const c = weekly.grid[di]?.[pi];
        if (c) deliveredHours[c.code] = (deliveredHours[c.code] || 0) + 1;
      });
    });
  }

  const weeks = Math.max(...Object.values(weekdayOccur), 0) || Math.round(days.length / Math.max(1, spec.days.length));

  const delivery = spec.subjects.map(s => {
    const delivered = deliveredHours[s.code] || 0;
    const required = s.hoursPerWeek * weeks;
    return {
      code: s.code, name: s.name, faculty: s.faculty, credits: s.credits, type: s.type,
      weeklyHours: s.hoursPerWeek, deliveredHours: delivered, requiredHours: required,
      complete: delivered >= required,
    };
  });

  // group teaching days by month
  const byMonthMap: Record<string, DaySchedule[]> = {};
  days.forEach(d => {
    const m = monthLabel(d.date);
    (byMonthMap[m] ||= []).push(d);
  });
  const byMonth = Object.entries(byMonthMap).map(([month, ds]) => ({ month, days: ds }));

  return {
    start, end, totalDays, teachingDays: days.length, weeks,
    holidays: holidaysHit, weekendDaysOff: weekendOff,
    days, byMonth, delivery,
    totalSessions: days.reduce((a, d) => a + d.sessions.length, 0),
  };
}
