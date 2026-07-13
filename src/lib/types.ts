export type UserRole =
  | "admin"
  | "registrar"
  | "dean"
  | "hod"
  | "faculty"
  | "student"
  | "finance"
  | "hostel_warden"
  | "exam_officer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  school?: string;
  employeeId?: string;
  studentId?: string;
}

export interface Student {
  id: string;
  name: string;
  enrollmentNo: string;
  programme: string;
  batch: string;
  semester: number;
  section: string;
  school: string;
  status: "enrolled" | "admitted" | "on-leave" | "graduated" | "withdrawn";
  cgpa: number;
  attendance: number;
  feeDue: number;
  phone: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  dob: string;
  category: "General" | "OBC" | "SC" | "ST" | "EWS";
  admissionDate: string;
  photo?: string;
}

export interface Faculty {
  id: string;
  name: string;
  employeeId: string;
  designation: string;
  department: string;
  school: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  specialization: string;
  status: "active" | "on-leave" | "resigned";
  joiningDate: string;
  salary: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  type: "core" | "elective" | "open";
  semester: number;
  programme: string;
  faculty: string;
  contactHours: number;
}

export interface AttendanceRecord {
  studentId: string;
  courseId: string;
  date: string;
  status: "present" | "absent" | "late" | "medical";
  markedBy: string;
}

export interface ExamResult {
  studentId: string;
  courseId: string;
  internalMarks: number;
  endSemMarks: number;
  totalMarks: number;
  grade: string;
  gradePoints: number;
  status: "pass" | "fail" | "withheld";
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  programme: string;
  semester: number;
  feeHead: string;
  amount: number;
  paid: number;
  due: number;
  dueDate: string;
  status: "paid" | "partial" | "overdue" | "pending";
  receiptNo?: string;
  paymentDate?: string;
  paymentMode?: string;
}

export interface HostelRoom {
  id: string;
  roomNo: string;
  block: string;
  type: "single" | "double" | "triple";
  capacity: number;
  occupied: number;
  floor: number;
  amenities: string[];
  status: "available" | "occupied" | "maintenance";
}

export interface GrievanceCase {
  id: string;
  ticketNo: string;
  studentId: string;
  studentName: string;
  category: string;
  subject: string;
  description: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo: string;
  raisedDate: string;
  resolvedDate?: string;
  comments: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "urgent";
  target: "all" | "students" | "faculty" | "staff";
  channels: ("email" | "sms" | "whatsapp" | "app")[];
  sentAt: string;
  sentBy: string;
  readCount: number;
  totalRecipients: number;
}

export interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  room: string;
  section: string;
  type: "lecture" | "lab" | "tutorial";
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
  roles: UserRole[];
  children?: MenuItem[];
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color?: string;
  icon?: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
  isTyping?: boolean;
}
