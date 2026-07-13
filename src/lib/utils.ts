export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function getStatusColor(status: string): { bg: string; text: string; dot: string } {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    enrolled: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    admitted: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
    "on-leave": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    graduated: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
    withdrawn: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    paid: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    partial: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    overdue: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    pending: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
    open: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    "in-progress": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    resolved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    closed: { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" },
    issued: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    processing: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    available: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    occupied: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    maintenance: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    high: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    medium: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    low: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    urgent: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-600" },
  };
  return map[status] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };
}

export function getAttendanceColor(pct: number): string {
  if (pct >= 85) return "text-green-600";
  if (pct >= 75) return "text-amber-600";
  return "text-red-600";
}

export function getAttendanceBg(pct: number): string {
  if (pct >= 85) return "bg-green-500";
  if (pct >= 75) return "bg-amber-500";
  return "bg-red-500";
}

export function getGradeColor(grade: string): string {
  const map: Record<string, string> = { O: "text-green-600", "A+": "text-green-500", A: "text-blue-600", "B+": "text-blue-500", B: "text-amber-600", C: "text-orange-600", F: "text-red-600" };
  return map[grade] || "text-gray-600";
}

export function daysBetween(date1: string, date2: string = new Date().toISOString()): number {
  return Math.abs(Math.round((new Date(date1).getTime() - new Date(date2).getTime()) / (1000 * 60 * 60 * 24)));
}

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const TIME_SLOTS = ["09:00", "10:00", "11:00", "11:15", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
