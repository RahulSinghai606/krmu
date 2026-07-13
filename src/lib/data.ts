import type { Student, Faculty, Course, FeeRecord, GrievanceCase, Notification, TimetableSlot, HostelRoom } from "./types";

export const SCHOOLS = [
  "School of Engineering & Technology (SOET)",
  "School of Management Studies (SMS)",
  "School of Law (SOL)",
  "School of Media Studies (SoMeS)",
  "School of Architecture (SOA)",
  "School of Pharmacy (SoP)",
  "School of Sciences (SoS)",
  "School of Education (SoEd)",
];

export const PROGRAMMES: Record<string, string[]> = {
  "SOET": ["B.Tech CSE", "B.Tech ECE", "B.Tech ME", "B.Tech Civil", "B.Tech AI & ML", "M.Tech CSE", "MCA", "BCA"],
  "SMS": ["BBA", "MBA", "B.Com (Hons)", "M.Com", "BBA LLB"],
  "SOL": ["LLB", "LLM", "BA LLB", "BBA LLB"],
  "SoMeS": ["BA Journalism", "BA Mass Communication", "MAJMC"],
  "SOA": ["B.Arch", "M.Arch"],
  "SoP": ["B.Pharm", "M.Pharm", "D.Pharm"],
  "SoS": ["BSc (Hons) Physics", "BSc (Hons) Chemistry", "BSc (Hons) Maths", "MSc"],
  "SoEd": ["B.Ed", "M.Ed"],
};

export const STUDENTS: Student[] = [
  { id: "s001", name: "Priya Sharma", enrollmentNo: "KRMU2024CSE001", programme: "B.Tech CSE", batch: "2024-28", semester: 2, section: "A", school: "SOET", status: "enrolled", cgpa: 8.7, attendance: 87, feeDue: 0, phone: "+91-9876543201", email: "priya.sharma@krmu.edu.in", guardianName: "Rajesh Sharma", guardianPhone: "+91-9876543200", address: "C-47, Sector 14, Gurugram", dob: "2006-03-15", category: "General", admissionDate: "2024-08-01" },
  { id: "s002", name: "Arjun Kumar", enrollmentNo: "KRMU2024CSE002", programme: "B.Tech CSE", batch: "2024-28", semester: 2, section: "A", school: "SOET", status: "enrolled", cgpa: 7.4, attendance: 72, feeDue: 45000, phone: "+91-9876543202", email: "arjun.kumar@krmu.edu.in", guardianName: "Vinod Kumar", guardianPhone: "+91-9876543203", address: "H-12, DLF Phase 2, Gurugram", dob: "2005-11-22", category: "OBC", admissionDate: "2024-08-01" },
  { id: "s003", name: "Ananya Singh", enrollmentNo: "KRMU2024CSE003", programme: "B.Tech CSE", batch: "2024-28", semester: 2, section: "B", school: "SOET", status: "enrolled", cgpa: 9.1, attendance: 94, feeDue: 0, phone: "+91-9876543204", email: "ananya.singh@krmu.edu.in", guardianName: "Suresh Singh", guardianPhone: "+91-9876543205", address: "31-A, Model Town, Delhi", dob: "2006-01-08", category: "General", admissionDate: "2024-08-01" },
  { id: "s004", name: "Rohit Verma", enrollmentNo: "KRMU2023ECE045", programme: "B.Tech ECE", batch: "2023-27", semester: 4, section: "A", school: "SOET", status: "enrolled", cgpa: 6.8, attendance: 68, feeDue: 85000, phone: "+91-9876543206", email: "rohit.verma@krmu.edu.in", guardianName: "Manoj Verma", guardianPhone: "+91-9876543207", address: "B-302, Vatika City, Gurugram", dob: "2005-07-19", category: "General", admissionDate: "2023-08-01" },
  { id: "s005", name: "Kavya Nair", enrollmentNo: "KRMU2024MBA001", programme: "MBA", batch: "2024-26", semester: 2, section: "A", school: "SMS", status: "enrolled", cgpa: 8.2, attendance: 89, feeDue: 0, phone: "+91-9876543208", email: "kavya.nair@krmu.edu.in", guardianName: "Sudhir Nair", guardianPhone: "+91-9876543209", address: "F-15, Sector 51, Gurugram", dob: "1999-05-30", category: "General", admissionDate: "2024-07-01" },
  { id: "s006", name: "Sahil Malik", enrollmentNo: "KRMU2022CSE102", programme: "B.Tech CSE", batch: "2022-26", semester: 6, section: "C", school: "SOET", status: "enrolled", cgpa: 7.9, attendance: 82, feeDue: 0, phone: "+91-9876543210", email: "sahil.malik@krmu.edu.in", guardianName: "Anil Malik", guardianPhone: "+91-9876543211", address: "G-44, Sushant Lok, Gurugram", dob: "2004-09-12", category: "OBC", admissionDate: "2022-08-01" },
  { id: "s007", name: "Preethi Rajan", enrollmentNo: "KRMU2024LAW001", programme: "BA LLB", batch: "2024-29", semester: 2, section: "A", school: "SOL", status: "enrolled", cgpa: 8.5, attendance: 91, feeDue: 0, phone: "+91-9876543212", email: "preethi.rajan@krmu.edu.in", guardianName: "K. Rajan", guardianPhone: "+91-9876543213", address: "Flat 7B, Green Park, Delhi", dob: "2006-02-14", category: "General", admissionDate: "2024-08-01" },
  { id: "s008", name: "Deepak Chauhan", enrollmentNo: "KRMU2023ME067", programme: "B.Tech ME", batch: "2023-27", semester: 4, section: "A", school: "SOET", status: "enrolled", cgpa: 7.1, attendance: 74, feeDue: 30000, phone: "+91-9876543214", email: "deepak.chauhan@krmu.edu.in", guardianName: "Ram Chauhan", guardianPhone: "+91-9876543215", address: "H-99, South Extension, Delhi", dob: "2005-04-03", category: "SC", admissionDate: "2023-08-01" },
  { id: "s009", name: "Neha Gupta", enrollmentNo: "KRMU2024BBA002", programme: "BBA", batch: "2024-27", semester: 2, section: "A", school: "SMS", status: "enrolled", cgpa: 8.0, attendance: 85, feeDue: 15000, phone: "+91-9876543216", email: "neha.gupta@krmu.edu.in", guardianName: "Sanjeev Gupta", guardianPhone: "+91-9876543217", address: "L-22, Palam Vihar, Gurugram", dob: "2005-12-25", category: "General", admissionDate: "2024-08-01" },
  { id: "s010", name: "Amit Rawat", enrollmentNo: "KRMU2021CSE015", programme: "B.Tech CSE", batch: "2021-25", semester: 8, section: "A", school: "SOET", status: "enrolled", cgpa: 8.8, attendance: 93, feeDue: 0, phone: "+91-9876543218", email: "amit.rawat@krmu.edu.in", guardianName: "Prakash Rawat", guardianPhone: "+91-9876543219", address: "N-5, Ashok Vihar, Delhi", dob: "2003-06-07", category: "General", admissionDate: "2021-08-01" },
  { id: "s011", name: "Simran Kaur", enrollmentNo: "KRMU2024AIML003", programme: "B.Tech AI & ML", batch: "2024-28", semester: 2, section: "A", school: "SOET", status: "enrolled", cgpa: 9.3, attendance: 96, feeDue: 0, phone: "+91-9876543220", email: "simran.kaur@krmu.edu.in", guardianName: "Gurpreet Kaur", guardianPhone: "+91-9876543221", address: "12B, Rajouri Garden, Delhi", dob: "2006-08-19", category: "General", admissionDate: "2024-08-01" },
  { id: "s012", name: "Rahul Pandey", enrollmentNo: "KRMU2023MBA022", programme: "MBA", batch: "2023-25", semester: 4, section: "B", school: "SMS", status: "on-leave", cgpa: 7.6, attendance: 61, feeDue: 120000, phone: "+91-9876543222", email: "rahul.pandey@krmu.edu.in", guardianName: "Govind Pandey", guardianPhone: "+91-9876543223", address: "K-78, Janakpuri, Delhi", dob: "1999-11-30", category: "General", admissionDate: "2023-07-01" },
];

export const FACULTY: Faculty[] = [
  { id: "f001", name: "Dr. Rajeev Sharma", employeeId: "KRMU-F-2018-001", designation: "Professor & HoD", department: "Computer Science", school: "SOET", email: "rajeev.sharma@krmu.edu.in", phone: "+91-9811234501", qualification: "Ph.D (IIT Delhi)", experience: 18, specialization: "Artificial Intelligence & Machine Learning", status: "active", joiningDate: "2018-07-01", salary: 120000 },
  { id: "f002", name: "Dr. Sunita Agarwal", employeeId: "KRMU-F-2019-002", designation: "Associate Professor", department: "Computer Science", school: "SOET", email: "sunita.agarwal@krmu.edu.in", phone: "+91-9811234502", qualification: "Ph.D (DTU)", experience: 12, specialization: "Database Management Systems & Cloud Computing", status: "active", joiningDate: "2019-08-01", salary: 95000 },
  { id: "f003", name: "Dr. Pankaj Mishra", employeeId: "KRMU-F-2020-003", designation: "Assistant Professor", department: "Electronics", school: "SOET", email: "pankaj.mishra@krmu.edu.in", phone: "+91-9811234503", qualification: "Ph.D (NIT Kurukshetra)", experience: 8, specialization: "VLSI Design & Embedded Systems", status: "active", joiningDate: "2020-01-15", salary: 75000 },
  { id: "f004", name: "Prof. Meena Joshi", employeeId: "KRMU-F-2017-004", designation: "Professor", department: "Management", school: "SMS", email: "meena.joshi@krmu.edu.in", phone: "+91-9811234504", qualification: "Ph.D, MBA (IIM Lucknow)", experience: 22, specialization: "Strategic Management & OB", status: "active", joiningDate: "2017-07-01", salary: 135000 },
  { id: "f005", name: "Dr. Anil Kumar Singh", employeeId: "KRMU-F-2021-005", designation: "Assistant Professor", department: "Law", school: "SOL", email: "anil.singh@krmu.edu.in", phone: "+91-9811234505", qualification: "LLM, Ph.D", experience: 7, specialization: "Constitutional Law & Human Rights", status: "active", joiningDate: "2021-03-01", salary: 70000 },
  { id: "f006", name: "Dr. Swati Bansal", employeeId: "KRMU-F-2016-006", designation: "Associate Professor", department: "Computer Science", school: "SOET", email: "swati.bansal@krmu.edu.in", phone: "+91-9811234506", qualification: "Ph.D (BITS Pilani)", experience: 14, specialization: "Computer Networks & Cybersecurity", status: "on-leave", joiningDate: "2016-07-01", salary: 98000 },
  { id: "f007", name: "Dr. Rohit Bhatnagar", employeeId: "KRMU-F-2022-007", designation: "Assistant Professor", department: "Mathematics", school: "SoS", email: "rohit.bhatnagar@krmu.edu.in", phone: "+91-9811234507", qualification: "Ph.D (Delhi University)", experience: 5, specialization: "Applied Mathematics & Statistics", status: "active", joiningDate: "2022-08-01", salary: 65000 },
  { id: "f008", name: "Dr. Kavitha Reddy", employeeId: "KRMU-F-2019-008", designation: "Assistant Professor", department: "Computer Science", school: "SOET", email: "kavitha.reddy@krmu.edu.in", phone: "+91-9811234508", qualification: "Ph.D (IIIT Hyderabad)", experience: 9, specialization: "Data Science & Natural Language Processing", status: "active", joiningDate: "2019-06-01", salary: 82000 },
];

export const COURSES: Course[] = [
  { id: "cs301", code: "CSE301", name: "Data Structures & Algorithms", credits: 4, type: "core", semester: 3, programme: "B.Tech CSE", faculty: "Dr. Rajeev Sharma", contactHours: 48 },
  { id: "cs302", code: "CSE302", name: "Database Management Systems", credits: 4, type: "core", semester: 3, programme: "B.Tech CSE", faculty: "Dr. Sunita Agarwal", contactHours: 48 },
  { id: "cs303", code: "CSE303", name: "Object Oriented Programming", credits: 3, type: "core", semester: 3, programme: "B.Tech CSE", faculty: "Dr. Kavitha Reddy", contactHours: 36 },
  { id: "cs304", code: "CSE304", name: "Computer Networks", credits: 3, type: "core", semester: 5, programme: "B.Tech CSE", faculty: "Dr. Swati Bansal", contactHours: 36 },
  { id: "cs305", code: "CSE305", name: "Operating Systems", credits: 4, type: "core", semester: 5, programme: "B.Tech CSE", faculty: "Dr. Rajeev Sharma", contactHours: 48 },
  { id: "cs401", code: "CSE401", name: "Machine Learning", credits: 4, type: "elective", semester: 7, programme: "B.Tech CSE", faculty: "Dr. Rajeev Sharma", contactHours: 48 },
  { id: "cs402", code: "CSE402", name: "Deep Learning", credits: 3, type: "elective", semester: 7, programme: "B.Tech CSE", faculty: "Dr. Kavitha Reddy", contactHours: 36 },
  { id: "cs501", code: "CSE501", name: "Cloud Computing", credits: 3, type: "elective", semester: 7, programme: "B.Tech CSE", faculty: "Dr. Sunita Agarwal", contactHours: 36 },
  { id: "ma101", code: "MA101", name: "Engineering Mathematics I", credits: 4, type: "core", semester: 1, programme: "B.Tech CSE", faculty: "Dr. Rohit Bhatnagar", contactHours: 48 },
  { id: "hs101", code: "HS101", name: "Communication Skills", credits: 2, type: "core", semester: 1, programme: "B.Tech CSE", faculty: "Prof. Meena Joshi", contactHours: 24 },
];

export const FEE_RECORDS: FeeRecord[] = [
  { id: "fee001", studentId: "s001", studentName: "Priya Sharma", programme: "B.Tech CSE", semester: 2, feeHead: "Tuition Fee", amount: 95000, paid: 95000, due: 0, dueDate: "2025-01-31", status: "paid", receiptNo: "RCPT-2025-00451", paymentDate: "2025-01-15", paymentMode: "Online" },
  { id: "fee002", studentId: "s002", studentName: "Arjun Kumar", programme: "B.Tech CSE", semester: 2, feeHead: "Tuition Fee", amount: 95000, paid: 50000, due: 45000, dueDate: "2025-01-31", status: "overdue" },
  { id: "fee003", studentId: "s003", studentName: "Ananya Singh", programme: "B.Tech CSE", semester: 2, feeHead: "Tuition Fee", amount: 95000, paid: 95000, due: 0, dueDate: "2025-01-31", status: "paid", receiptNo: "RCPT-2025-00398", paymentDate: "2025-01-10", paymentMode: "NEFT" },
  { id: "fee004", studentId: "s004", studentName: "Rohit Verma", programme: "B.Tech ECE", semester: 4, feeHead: "Tuition Fee", amount: 90000, paid: 5000, due: 85000, dueDate: "2025-01-31", status: "overdue" },
  { id: "fee005", studentId: "s005", studentName: "Kavya Nair", programme: "MBA", semester: 2, feeHead: "Programme Fee", amount: 140000, paid: 140000, due: 0, dueDate: "2025-01-31", status: "paid", receiptNo: "RCPT-2025-00512", paymentDate: "2025-01-08", paymentMode: "Online" },
  { id: "fee006", studentId: "s006", studentName: "Sahil Malik", programme: "B.Tech CSE", semester: 6, feeHead: "Tuition Fee", amount: 95000, paid: 95000, due: 0, dueDate: "2025-01-31", status: "paid", receiptNo: "RCPT-2025-00389", paymentDate: "2025-01-12", paymentMode: "DD" },
  { id: "fee007", studentId: "s007", studentName: "Preethi Rajan", programme: "BA LLB", semester: 2, feeHead: "Tuition Fee", amount: 80000, paid: 80000, due: 0, dueDate: "2025-01-31", status: "paid", receiptNo: "RCPT-2025-00478", paymentDate: "2025-01-20", paymentMode: "Online" },
  { id: "fee008", studentId: "s008", studentName: "Deepak Chauhan", programme: "B.Tech ME", semester: 4, feeHead: "Tuition Fee", amount: 88000, paid: 58000, due: 30000, dueDate: "2025-01-31", status: "partial" },
  { id: "fee009", studentId: "s009", studentName: "Neha Gupta", programme: "BBA", semester: 2, feeHead: "Programme Fee", amount: 65000, paid: 50000, due: 15000, dueDate: "2025-01-31", status: "partial" },
  { id: "fee010", studentId: "s010", studentName: "Amit Rawat", programme: "B.Tech CSE", semester: 8, feeHead: "Tuition Fee", amount: 95000, paid: 95000, due: 0, dueDate: "2025-01-31", status: "paid", receiptNo: "RCPT-2025-00421", paymentDate: "2025-01-05", paymentMode: "Online" },
  { id: "fee011", studentId: "s011", studentName: "Simran Kaur", programme: "B.Tech AI & ML", semester: 2, feeHead: "Tuition Fee", amount: 100000, paid: 100000, due: 0, dueDate: "2025-01-31", status: "paid", receiptNo: "RCPT-2025-00501", paymentDate: "2025-01-18", paymentMode: "Online" },
  { id: "fee012", studentId: "s012", studentName: "Rahul Pandey", programme: "MBA", semester: 4, feeHead: "Programme Fee", amount: 140000, paid: 20000, due: 120000, dueDate: "2024-12-31", status: "overdue" },
];

export const GRIEVANCES: GrievanceCase[] = [
  { id: "g001", ticketNo: "KRMU-GRV-2025-0041", studentId: "s002", studentName: "Arjun Kumar", category: "Academic", subject: "Internal marks discrepancy in DSA", description: "My internal assessment marks for CSE301 show 18/30 but I scored 25 in the test. Requesting re-evaluation.", status: "in-progress", priority: "high", assignedTo: "Dr. Rajeev Sharma", raisedDate: "2025-01-22", comments: ["Escalated to course faculty for review", "Faculty reviewing marks sheet"] },
  { id: "g002", ticketNo: "KRMU-GRV-2025-0038", studentId: "s004", studentName: "Rohit Verma", category: "Fee", subject: "Late fee waiver request", description: "Due to medical emergency, could not pay fee on time. Requesting late fee waiver with medical documents.", status: "open", priority: "medium", assignedTo: "Finance Department", raisedDate: "2025-01-20", comments: [] },
  { id: "g003", ticketNo: "KRMU-GRV-2025-0035", studentId: "s009", studentName: "Neha Gupta", category: "Hostel", subject: "Room allocation not received", description: "Applied for hostel allocation in September but still awaiting confirmation and room number.", status: "resolved", priority: "medium", assignedTo: "Hostel Warden", raisedDate: "2025-01-15", resolvedDate: "2025-01-21", comments: ["Room allocated: Block C, Room 214", "Student intimated via email"] },
  { id: "g004", ticketNo: "KRMU-GRV-2025-0029", studentId: "s008", studentName: "Deepak Chauhan", category: "Academic", subject: "Attendance marked incorrectly", description: "Attendance for ME Lab session on Jan 8 shows absent but I was present. Requesting correction.", status: "resolved", priority: "low", assignedTo: "Dr. Pankaj Mishra", raisedDate: "2025-01-09", resolvedDate: "2025-01-11", comments: ["Verified with lab register", "Attendance corrected to present"] },
  { id: "g005", ticketNo: "KRMU-GRV-2025-0052", studentId: "s003", studentName: "Ananya Singh", category: "Administrative", subject: "Bonafide certificate delay", description: "Applied for bonafide certificate 2 weeks ago, still not issued. Needed urgently for scholarship application.", status: "in-progress", priority: "urgent", assignedTo: "Registrar Office", raisedDate: "2025-01-24", comments: ["Certificate under processing", "Expected by Jan 27"] },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n001", title: "Semester Registration Open - Even Semester 2024-25", message: "Online semester registration for Even Semester 2024-25 is now open. All students must complete registration by February 5, 2025. Check your eligibility and register through the student portal.", type: "info", target: "students", channels: ["email", "app", "whatsapp"], sentAt: "2025-01-20T10:00:00", sentBy: "Registrar Office", readCount: 2841, totalRecipients: 3200 },
  { id: "n002", title: "Attendance Shortage Warning — 34 Students", message: "The following students in B.Tech CSE 2024 batch have attendance below 75% as on Jan 20. Immediate intervention required. Kindly counsel students and inform parents.", type: "warning", target: "faculty", channels: ["email", "app"], sentAt: "2025-01-20T14:00:00", sentBy: "AI System (Auto)", readCount: 18, totalRecipients: 24 },
  { id: "n003", title: "Examination Schedule Released — End Semester Jan 2025", message: "End Semester Examination schedule for January 2025 has been released. Exams commence February 10, 2025. Download the schedule from the portal.", type: "info", target: "all", channels: ["email", "sms", "app", "whatsapp"], sentAt: "2025-01-18T09:00:00", sentBy: "Examination Cell", readCount: 4201, totalRecipients: 4500 },
  { id: "n004", title: "Fee Payment Deadline — Last Date January 31", message: "Fee payment due date is January 31, 2025. Students with pending dues must pay immediately to avoid late fee and examination debarment.", type: "urgent", target: "students", channels: ["sms", "whatsapp", "app"], sentAt: "2025-01-23T11:30:00", sentBy: "Finance Department", readCount: 312, totalRecipients: 425 },
  { id: "n005", title: "Faculty Development Programme — Registration Open", message: "A three-day Faculty Development Programme on 'AI in Education' is scheduled for February 14-16, 2025. All faculty are encouraged to register by February 5.", type: "info", target: "faculty", channels: ["email", "app"], sentAt: "2025-01-22T10:00:00", sentBy: "IQAC", readCount: 87, totalRecipients: 156 },
];

export const TIMETABLE: TimetableSlot[] = [
  { id: "tt001", day: "Monday", startTime: "09:00", endTime: "10:00", courseCode: "CSE301", courseName: "Data Structures & Algorithms", facultyName: "Dr. Rajeev Sharma", room: "SOET-LT-201", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt002", day: "Monday", startTime: "10:00", endTime: "11:00", courseCode: "CSE302", courseName: "Database Management Systems", facultyName: "Dr. Sunita Agarwal", room: "SOET-LT-101", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt003", day: "Monday", startTime: "11:15", endTime: "12:15", courseCode: "MA101", courseName: "Engineering Mathematics I", facultyName: "Dr. Rohit Bhatnagar", room: "SOET-LT-301", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt004", day: "Monday", startTime: "14:00", endTime: "17:00", courseCode: "CSE302L", courseName: "DBMS Lab", facultyName: "Dr. Sunita Agarwal", room: "SOET-LAB-DB1", section: "B.Tech CSE-A", type: "lab" },
  { id: "tt005", day: "Tuesday", startTime: "09:00", endTime: "10:00", courseCode: "CSE303", courseName: "Object Oriented Programming", facultyName: "Dr. Kavitha Reddy", room: "SOET-LT-202", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt006", day: "Tuesday", startTime: "10:00", endTime: "11:00", courseCode: "HS101", courseName: "Communication Skills", facultyName: "Prof. Meena Joshi", room: "SOET-CR-01", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt007", day: "Tuesday", startTime: "11:15", endTime: "12:15", courseCode: "CSE301", courseName: "Data Structures & Algorithms", facultyName: "Dr. Rajeev Sharma", room: "SOET-LT-201", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt008", day: "Tuesday", startTime: "14:00", endTime: "17:00", courseCode: "CSE301L", courseName: "DSA Lab", facultyName: "Dr. Kavitha Reddy", room: "SOET-LAB-CS2", section: "B.Tech CSE-A", type: "lab" },
  { id: "tt009", day: "Wednesday", startTime: "09:00", endTime: "10:00", courseCode: "CSE302", courseName: "Database Management Systems", facultyName: "Dr. Sunita Agarwal", room: "SOET-LT-101", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt010", day: "Wednesday", startTime: "10:00", endTime: "11:00", courseCode: "MA101", courseName: "Engineering Mathematics I", facultyName: "Dr. Rohit Bhatnagar", room: "SOET-LT-301", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt011", day: "Thursday", startTime: "09:00", endTime: "10:00", courseCode: "CSE303", courseName: "Object Oriented Programming", facultyName: "Dr. Kavitha Reddy", room: "SOET-LT-202", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt012", day: "Thursday", startTime: "10:00", endTime: "11:00", courseCode: "CSE301", courseName: "Data Structures & Algorithms", facultyName: "Dr. Rajeev Sharma", room: "SOET-LT-201", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt013", day: "Friday", startTime: "09:00", endTime: "10:00", courseCode: "HS101", courseName: "Communication Skills", facultyName: "Prof. Meena Joshi", room: "SOET-CR-01", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt014", day: "Friday", startTime: "10:00", endTime: "11:00", courseCode: "MA101", courseName: "Engineering Mathematics I", facultyName: "Dr. Rohit Bhatnagar", room: "SOET-LT-301", section: "B.Tech CSE-A", type: "lecture" },
  { id: "tt015", day: "Friday", startTime: "14:00", endTime: "17:00", courseCode: "CSE303L", courseName: "OOP Lab", facultyName: "Dr. Kavitha Reddy", room: "SOET-LAB-CS1", section: "B.Tech CSE-A", type: "lab" },
];

export const HOSTEL_ROOMS: HostelRoom[] = [
  { id: "hr001", roomNo: "A-101", block: "Block A (Boys)", type: "double", capacity: 2, occupied: 2, floor: 1, amenities: ["AC", "Attached Bath", "WiFi", "Study Table"], status: "occupied" },
  { id: "hr002", roomNo: "A-102", block: "Block A (Boys)", type: "double", capacity: 2, occupied: 1, floor: 1, amenities: ["AC", "Attached Bath", "WiFi", "Study Table"], status: "available" },
  { id: "hr003", roomNo: "A-201", block: "Block A (Boys)", type: "triple", capacity: 3, occupied: 3, floor: 2, amenities: ["Fan", "Common Bath", "WiFi"], status: "occupied" },
  { id: "hr004", roomNo: "B-101", block: "Block B (Girls)", type: "double", capacity: 2, occupied: 2, floor: 1, amenities: ["AC", "Attached Bath", "WiFi", "Study Table"], status: "occupied" },
  { id: "hr005", roomNo: "B-102", block: "Block B (Girls)", type: "single", capacity: 1, occupied: 0, floor: 1, amenities: ["AC", "Attached Bath", "WiFi", "Study Table", "Wardrobe"], status: "available" },
  { id: "hr006", roomNo: "C-214", block: "Block C (Girls)", type: "double", capacity: 2, occupied: 1, floor: 2, amenities: ["AC", "Attached Bath", "WiFi"], status: "available" },
  { id: "hr007", roomNo: "A-301", block: "Block A (Boys)", type: "double", capacity: 2, occupied: 0, floor: 3, amenities: ["Fan", "Common Bath"], status: "maintenance" },
  { id: "hr008", roomNo: "D-101", block: "Block D (Research Scholars)", type: "single", capacity: 1, occupied: 1, floor: 1, amenities: ["AC", "Attached Bath", "WiFi", "Study Table", "Wardrobe", "Pantry"], status: "occupied" },
];

// Dashboard stats
export const DASHBOARD_STATS = {
  totalStudents: 3842,
  activeStudents: 3601,
  totalFaculty: 186,
  programmes: 34,
  feePending: "₹2.14 Cr",
  feeCollected: "₹18.6 Cr",
  attendanceToday: "78.4%",
  grievancesOpen: 12,
  examsPending: 3,
  hostelOccupancy: "87%",
};

// Analytics data
export const ENROLMENT_TREND = [
  { year: "2020-21", students: 2890 },
  { year: "2021-22", students: 3124 },
  { year: "2022-23", students: 3398 },
  { year: "2023-24", students: 3611 },
  { year: "2024-25", students: 3842 },
];

export const SCHOOL_DISTRIBUTION = [
  { school: "SOET", students: 1680, color: "#1565C0" },
  { school: "SMS", students: 820, color: "#F5A623" },
  { school: "SOL", students: 430, color: "#C8102E" },
  { school: "SoP", students: 280, color: "#0F9D58" },
  { school: "SoMeS", students: 210, color: "#9C27B0" },
  { school: "SOA", students: 175, color: "#FF5722" },
  { school: "SoS", students: 145, color: "#00BCD4" },
  { school: "SoEd", students: 102, color: "#795548" },
];

export const FEE_COLLECTION_MONTHLY = [
  { month: "Aug", collected: 380, target: 400 },
  { month: "Sep", collected: 142, target: 150 },
  { month: "Oct", collected: 85, target: 90 },
  { month: "Nov", collected: 92, target: 90 },
  { month: "Dec", collected: 310, target: 350 },
  { month: "Jan", collected: 188, target: 220 },
];

export const ATTENDANCE_WEEKLY = [
  { day: "Mon", percentage: 84 },
  { day: "Tue", percentage: 79 },
  { day: "Wed", percentage: 82 },
  { day: "Thu", percentage: 76 },
  { day: "Fri", percentage: 71 },
  { day: "Sat", percentage: 65 },
];

export const AT_RISK_STUDENTS = STUDENTS.filter(s => s.attendance < 75 || s.feeDue > 50000 || s.cgpa < 6.0);

export const UPCOMING_EXAMS = [
  { subject: "Data Structures & Algorithms", code: "CSE301", date: "2025-02-10", time: "10:00 AM", room: "Block-A Hall", programme: "B.Tech CSE" },
  { subject: "Database Management Systems", code: "CSE302", date: "2025-02-12", time: "10:00 AM", room: "Block-B Hall", programme: "B.Tech CSE" },
  { subject: "Engineering Mathematics II", code: "MA201", date: "2025-02-14", time: "02:00 PM", room: "Block-A Hall", programme: "B.Tech All" },
  { subject: "Strategic Management", code: "MBA501", date: "2025-02-11", time: "10:00 AM", room: "SMS Hall", programme: "MBA" },
  { subject: "Constitutional Law", code: "LAW201", date: "2025-02-13", time: "10:00 AM", room: "SOL Hall", programme: "BA LLB" },
];

export const TRANSPORT_ROUTES = [
  { id: "r001", routeNo: "R-01", origin: "Gurugram Bus Stand", via: ["Sector 14", "Sector 23", "KRMU Gate"], students: 87, driver: "Ram Kishore", vehicle: "HR-26-BC-4521", capacity: 45, status: "active" },
  { id: "r002", routeNo: "R-02", origin: "Delhi Saket Metro", via: ["Vasant Kunj", "NH-48", "KRMU Gate"], students: 124, driver: "Suresh Kumar", vehicle: "HR-26-BD-7823", capacity: 60, status: "active" },
  { id: "r003", routeNo: "R-03", origin: "Dwarka Sector 21", via: ["Palam", "NH-48", "KRMU Gate"], students: 96, driver: "Manoj Singh", vehicle: "HR-26-BE-1245", capacity: 50, status: "active" },
  { id: "r004", routeNo: "R-04", origin: "Faridabad Old Railway Station", via: ["Badarpur", "Sohna Road", "KRMU Gate"], students: 62, driver: "Rakesh Verma", vehicle: "HR-55-AC-8834", capacity: 45, status: "active" },
  { id: "r005", routeNo: "R-05", origin: "Noida Sector 18", via: ["Delhi Toll", "NH-48", "KRMU Gate"], students: 41, driver: "Dinesh Yadav", vehicle: "HR-26-BF-3312", capacity: 45, status: "maintenance" },
];

export const ACCREDITATION_DATA = {
  naac: { grade: "A", cgpa: 3.11, year: 2023, nextReview: "2028" },
  nirf: { rank: 142, category: "University", year: 2024 },
  aishe: { collegeCode: "U-0577", lastSubmission: "2023-24", status: "Submitted" },
  ugc: { status: "2f & 12B", recognitions: ["NAAC A Grade", "NIRF Ranked", "NBA Accredited Programmes: 3"] },
};

export const EXAM_RESULTS_SUMMARY = [
  { programme: "B.Tech CSE", semester: 5, appeared: 312, passed: 289, atkt: 18, failed: 5, passRate: "92.6%" },
  { programme: "B.Tech ECE", semester: 5, appeared: 198, passed: 178, atkt: 15, failed: 5, passRate: "89.9%" },
  { programme: "MBA", semester: 3, appeared: 156, passed: 149, atkt: 6, failed: 1, passRate: "95.5%" },
  { programme: "BA LLB", semester: 5, appeared: 143, passed: 132, atkt: 9, failed: 2, passRate: "92.3%" },
  { programme: "BBA", semester: 3, appeared: 212, passed: 198, atkt: 11, failed: 3, passRate: "93.4%" },
];

// Documents
export const CERTIFICATE_REQUESTS = [
  { id: "cert001", studentId: "s001", studentName: "Priya Sharma", type: "Bonafide Certificate", purpose: "Scholarship Application", requestDate: "2025-01-15", status: "issued", issueDate: "2025-01-17" },
  { id: "cert002", studentId: "s003", studentName: "Ananya Singh", type: "Bonafide Certificate", purpose: "Bank Account Opening", requestDate: "2025-01-24", status: "processing", issueDate: null },
  { id: "cert003", studentId: "s006", studentName: "Sahil Malik", type: "Transcript", purpose: "Higher Studies Application", requestDate: "2025-01-20", status: "issued", issueDate: "2025-01-23" },
  { id: "cert004", studentId: "s010", studentName: "Amit Rawat", type: "Degree Certificate", purpose: "Employment", requestDate: "2025-01-22", status: "processing", issueDate: null },
  { id: "cert005", studentId: "s011", studentName: "Simran Kaur", type: "Migration Certificate", purpose: "Transfer", requestDate: "2025-01-18", status: "issued", issueDate: "2025-01-20" },
];

// AI Suggestions for dashboard
export const AI_INSIGHTS = [
  { type: "warning", title: "34 students at attendance risk", message: "B.Tech CSE 2024 batch has 34 students trending below 75% attendance. Recommend immediate faculty alerts.", action: "Draft notices" },
  { type: "info", title: "Fee collection 14% behind target", message: "January collections at ₹1.88 Cr vs ₹2.20 Cr target. 425 students with dues > ₹15,000. Auto-reminders sent to 312.", action: "View defaulters" },
  { type: "success", title: "Registration 94% complete", message: "3,591 of 3,842 eligible students have completed semester registration. 251 pending — window closes Feb 5.", action: "Send reminders" },
  { type: "warning", title: "3 exam halls not confirmed", message: "End semester exam starts Feb 10. Block-C Hall booking not confirmed. 1,240 students affected.", action: "Review schedule" },
];
