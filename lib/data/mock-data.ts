export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: "student" | "mentor" | "admin" | "super_admin";
  accountStatus: "active" | "suspended" | "closed";
  timezone: string;
  createdAt: string;
}

export interface StudentProfileRecord {
  id: string;
  userId: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
  targetRole: string;
  currentLevel: string;
  bio: string;
  preferredLanguages: string[];
  skills: { name: string; level: "beginner" | "intermediate" | "advanced"; source: string }[];
  goals: {
    id: string;
    title: string;
    description: string;
    category: string;
    progressPercentage: number;
    status: "in_progress" | "completed" | "paused";
    targetDate: string;
  }[];
  actionItems: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: "pending" | "completed";
    createdByRole: "student" | "mentor";
  }[];
}

export interface MentorProfileRecord {
  id: string;
  userId: string;
  headline: string;
  bio: string;
  organization: string;
  companyLogoUrl?: string;
  currentRole: string;
  yearsOfExperience: number;
  location: string;
  rating: number;
  totalSessions: number;
  totalMentees: number;
  verificationStatus: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "suspended";
  verifiedAt?: string;
  languages: string[];
  sessionModes: string[];
  responseTime: string;
  isAcceptingBookings: boolean;
  price15MinInr: number;
  price30MinInr: number;
  price60MinInr: number;
  primaryDomain: string;
  skills: string[];
  focusAreas: string[];
  recentReviews: {
    studentName: string;
    studentTitle: string;
    avatarUrl: string;
    comment: string;
    rating: number;
  }[];
  availabilityWeekly: {
    dayOfWeek: number; // 0 Sunday .. 6 Saturday
    startTime: string; // e.g. "17:00"
    endTime: string;   // e.g. "21:00"
    isActive: boolean;
  }[];
  nextAvailableText: string;
}

export interface MentorApplicationRecord {
  id: string;
  mentorProfileId: string;
  mentorName: string;
  currentRole: string;
  organization: string;
  status: "submitted" | "under_review" | "approved" | "rejected" | "info_requested";
  identityProofType: string;
  identityProofVerified: boolean;
  professionalProofType: string;
  professionalProofVerified: boolean;
  resumeUrl: string;
  linkedinUrl: string;
  appliedDate: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export interface BookingRecord {
  id: string;
  studentUserId: string;
  mentorProfileId: string;
  serviceType: "1on1_mentorship" | "group_mentorship" | "mock_interview";
  mockInterviewCategory?: "Technical" | "HR" | "System Design" | "Behavioral" | "Mixed";
  sessionDurationMinutes: number;
  startTimeUtc: string;
  endTimeUtc: string;
  userTimezone: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  priceInr: number;
  paymentStatus: "pending" | "paid" | "refunded";
  studentDiscussionPoints?: string;
  resumeAttachmentUrl?: string;
  projectLinks?: string;
  meetingRoomId: string;
  agendaItems?: string[];
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  bookingId: string;
  livekitRoomName: string;
  status: "scheduled" | "live" | "completed" | "no_show";
  sessionPlanChecklist: { item: string; completed: boolean }[];
  mentorPrivateNotes?: string;
  studentVisibleSummary?: string;
  resourcesShared?: { title: string; url: string; size?: string }[];
  startedAt?: string;
  endedAt?: string;
}

export interface MockInterviewRecord {
  id: string;
  bookingId: string;
  category: "Technical" | "HR" | "System Design" | "Behavioral" | "Mixed";
  targetRole: string;
  difficulty: "Easy" | "Medium" | "Hard";
  overallScore: number; // out of 10
  scoreTechnical: number;
  scoreProblemSolving: number;
  scoreCommunication: number;
  scoreConfidence: number;
  strengths: string[];
  areasToImprove: string[];
  detailedFeedback: string;
  recommendedNextSteps: string;
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "booking" | "session" | "chat" | "verification" | "payment" | "system";
  linkUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface LedgerTransactionRecord {
  id: string;
  bookingId: string;
  studentUserId: string;
  mentorProfileId: string;
  grossAmountInr: number;
  platformCommissionPercent: number;
  platformFeeInr: number;
  mentorPayableInr: number;
  status: "pending" | "settled" | "refunded";
  paymentProvider: "cashfree";
  providerOrderId: string;
  providerPaymentId?: string;
  createdAt: string;
}

// ==========================================
// INITIAL VERIFIED SEED USERS & MENTORS
// ==========================================

export const INITIAL_USERS: UserRecord[] = [
  {
    id: "user-student-1",
    email: "anant@example.com",
    displayName: "Anant Kumar",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    role: "student",
    accountStatus: "active",
    timezone: "Asia/Kolkata",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "user-mentor-priya",
    email: "priya.sharma@microsoft.com",
    displayName: "Priya Sharma",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
    role: "mentor",
    accountStatus: "active",
    timezone: "Asia/Kolkata",
    createdAt: "2025-11-01T10:00:00Z",
  },
  {
    id: "user-mentor-rohan",
    email: "rohan.mehta@google.com",
    displayName: "Rohan Mehta",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    role: "mentor",
    accountStatus: "active",
    timezone: "Asia/Kolkata",
    createdAt: "2025-11-15T10:00:00Z",
  },
  {
    id: "user-mentor-aditya",
    email: "aditya.singh@adobe.com",
    displayName: "Aditya Singh",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    role: "mentor",
    accountStatus: "active",
    timezone: "Asia/Kolkata",
    createdAt: "2025-12-01T10:00:00Z",
  },
  {
    id: "user-mentor-rahul",
    email: "rahul.mehta@google.com",
    displayName: "Rahul Mehta",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    role: "mentor",
    accountStatus: "active",
    timezone: "Asia/Kolkata",
    createdAt: "2026-02-10T09:00:00Z",
  },
  {
    id: "user-admin-1",
    email: "admin@mentormaze.com",
    displayName: "Platform Admin",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
    role: "admin",
    accountStatus: "active",
    timezone: "Asia/Kolkata",
    createdAt: "2025-10-01T10:00:00Z",
  },
];

export const INITIAL_STUDENT_PROFILE: StudentProfileRecord = {
  id: "student-profile-1",
  userId: "user-student-1",
  institution: "Lovely Professional University (LPU)",
  degree: "B.Tech in Computer Science and Engineering",
  fieldOfStudy: "Computer Science",
  graduationYear: 2027,
  targetRole: "Software Engineer",
  currentLevel: "Undergraduate Student",
  bio: "Passionate CS undergraduate focusing on distributed backend systems, algorithms, and cloud native architectures. Preparing for upcoming tier-1 software engineering summer internships.",
  preferredLanguages: ["English", "Hindi"],
  skills: [
    { name: "Data Structures & Algorithms", level: "intermediate", source: "self_reported" },
    { name: "TypeScript / Node.js", level: "intermediate", source: "aitathastu" },
    { name: "PostgreSQL & Databases", level: "intermediate", source: "aitathastu" },
    { name: "System Design Fundamentals", level: "beginner", source: "self_reported" },
    { name: "Python", level: "intermediate", source: "self_reported" },
  ],
  goals: [
    {
      id: "goal-1",
      title: "Crack SDE Interview",
      description: "Master system design fundamentals, DSA patterns, and complete 3 mock interviews with senior engineers.",
      category: "interview",
      progressPercentage: 60,
      status: "in_progress",
      targetDate: "2026-12-31",
    },
    {
      id: "goal-2",
      title: "Build a Portfolio Project",
      description: "Design and deploy a full-stack production application with real-time WebSockets and database persistence.",
      category: "project",
      progressPercentage: 40,
      status: "in_progress",
      targetDate: "2026-12-15",
    },
  ],
  actionItems: [
    {
      id: "action-1",
      title: "Share updated resume with Priya Sharma",
      description: "Upload resume PDF highlighting distributed systems project.",
      dueDate: "2026-11-15",
      status: "pending",
      createdByRole: "mentor",
    },
    {
      id: "action-2",
      title: "Solve 10 LeetCode Medium Dynamic Programming problems",
      description: "Focus on 0/1 knapsack, unbounded knapsack, and LCS patterns.",
      dueDate: "2026-11-20",
      status: "pending",
      createdByRole: "student",
    },
  ],
};

export const INITIAL_MENTORS: MentorProfileRecord[] = [
  {
    id: "mentor-priya",
    userId: "user-mentor-priya",
    headline: "Software Engineer @ Microsoft",
    bio: "Software engineer passionate about helping students grow in tech, build strong fundamentals, and make confident career decisions. 5+ years building hyperscale cloud infrastructure at Microsoft.",
    organization: "Microsoft",
    currentRole: "Software Engineer",
    yearsOfExperience: 5,
    location: "Bengaluru, India",
    rating: 4.9,
    totalSessions: 210,
    totalMentees: 500,
    verificationStatus: "approved",
    verifiedAt: "2025-11-05T12:00:00Z",
    languages: ["English", "Hindi"],
    sessionModes: ["1:1", "Group"],
    responseTime: "Within 6 hours",
    isAcceptingBookings: true,
    price15MinInr: 149,
    price30MinInr: 249,
    price60MinInr: 449,
    primaryDomain: "Software Engineering",
    skills: ["System Design", "Web Development", "Interview Prep", "Cloud Architecture", "Distributed Systems"],
    focusAreas: ["Career Guidance", "Interview Prep", "Project Review", "Skill Development"],
    recentReviews: [
      {
        studentName: "Ankit Verma",
        studentTitle: "CS Student @ Delhi",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
        comment: "Priya helped me structure my learning and crack my summer internship at a product company. Her system design tips were spot on!",
        rating: 5,
      },
      {
        studentName: "Neha Gupta",
        studentTitle: "B.Tech Final Year",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
        comment: "Incredible feedback on my resume and portfolio project. She gave me specific action items that elevated my interviews immediately.",
        rating: 5,
      },
    ],
    availabilityWeekly: [
      { dayOfWeek: 1, startTime: "17:00", endTime: "21:30", isActive: true }, // Mon
      { dayOfWeek: 2, startTime: "16:00", endTime: "21:30", isActive: true }, // Tue
      { dayOfWeek: 3, startTime: "18:00", endTime: "21:00", isActive: true }, // Wed
      { dayOfWeek: 4, startTime: "17:00", endTime: "20:30", isActive: true }, // Thu
      { dayOfWeek: 5, startTime: "16:00", endTime: "21:00", isActive: true }, // Fri
    ],
    nextAvailableText: "Today, 7:30 PM",
  },
  {
    id: "mentor-rohan",
    userId: "user-mentor-rohan",
    headline: "Data Scientist @ Google",
    bio: "Senior Data Scientist at Google. Passionate about machine learning pipelines, LLM systems, mathematical rigor, and guiding students from tier-2/3 colleges into top tech firms.",
    organization: "Google",
    currentRole: "Data Scientist",
    yearsOfExperience: 4,
    location: "Hyderabad, India",
    rating: 4.9,
    totalSessions: 127,
    totalMentees: 320,
    verificationStatus: "approved",
    verifiedAt: "2025-11-20T12:00:00Z",
    languages: ["English", "Hindi", "Gujarati"],
    sessionModes: ["1:1", "Group"],
    responseTime: "Within 4 hours",
    isAcceptingBookings: true,
    price15MinInr: 149,
    price30MinInr: 249,
    price60MinInr: 449,
    primaryDomain: "Data Science",
    skills: ["Data Science", "Python", "Machine Learning", "Career Growth", "Deep Learning", "SQL"],
    focusAreas: ["Career Guidance", "Project Review", "Skill Development"],
    recentReviews: [
      {
        studentName: "Ravi Kumar",
        studentTitle: "Aspiring ML Engineer",
        avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80",
        comment: "Rohan reviewed my end-to-end ML pipeline project and pointed out key architectural optimizations that impressed interviewers.",
        rating: 5,
      },
    ],
    availabilityWeekly: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "21:00", isActive: true },
      { dayOfWeek: 2, startTime: "18:00", endTime: "21:00", isActive: true },
      { dayOfWeek: 4, startTime: "18:00", endTime: "21:00", isActive: true },
      { dayOfWeek: 6, startTime: "10:00", endTime: "14:00", isActive: true },
    ],
    nextAvailableText: "Today, 6:00 PM",
  },
  {
    id: "mentor-aditya",
    userId: "user-mentor-aditya",
    headline: "Product Manager @ Adobe",
    bio: "Product leader helping aspiring and associate PMs master product teardowns, metrics design, execution frameworks, and behavioral product interviews.",
    organization: "Adobe",
    currentRole: "Product Manager",
    yearsOfExperience: 6,
    location: "Noida, India",
    rating: 4.8,
    totalSessions: 95,
    totalMentees: 280,
    verificationStatus: "approved",
    verifiedAt: "2025-12-05T12:00:00Z",
    languages: ["English", "Hindi"],
    sessionModes: ["1:1", "Group"],
    responseTime: "Within 8 hours",
    isAcceptingBookings: true,
    price15MinInr: 149,
    price30MinInr: 249,
    price60MinInr: 449,
    primaryDomain: "Product Management",
    skills: ["Product Strategy", "Roadmap", "Leadership", "User Research", "Agile Execution"],
    focusAreas: ["Career Guidance", "Interview Prep", "Project Review"],
    recentReviews: [
      {
        studentName: "Simran Kaur",
        studentTitle: "APM Candidate",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        comment: "Aditya conducted an authentic product case round with me. The structured feedback rubric showed me exactly where my problem framing lacked depth.",
        rating: 5,
      },
    ],
    availabilityWeekly: [
      { dayOfWeek: 2, startTime: "17:00", endTime: "21:00", isActive: true },
      { dayOfWeek: 3, startTime: "17:00", endTime: "21:00", isActive: true },
      { dayOfWeek: 5, startTime: "17:00", endTime: "20:00", isActive: true },
    ],
    nextAvailableText: "Tomorrow, 5:00 PM",
  },
  {
    id: "mentor-rahul",
    userId: "user-mentor-rahul",
    headline: "Data Scientist @ Google",
    bio: "5+ years experience building large scale recommendation algorithms. Applying to mentor students on advanced data engineering, analytics, and deep learning.",
    organization: "Google",
    currentRole: "Data Scientist",
    yearsOfExperience: 5,
    location: "Bengaluru, India",
    rating: 5.0,
    totalSessions: 0,
    totalMentees: 0,
    verificationStatus: "submitted", // Pending Admin Review
    languages: ["English", "Hindi"],
    sessionModes: ["1:1"],
    responseTime: "Within 24 hours",
    isAcceptingBookings: false,
    price15MinInr: 149,
    price30MinInr: 249,
    price60MinInr: 449,
    primaryDomain: "Data Science",
    skills: ["Data Science", "ML", "Python", "Recommendation Systems"],
    focusAreas: ["Career Guidance", "Interview Prep"],
    recentReviews: [],
    availabilityWeekly: [],
    nextAvailableText: "Under Review",
  },
];

export const INITIAL_APPLICATIONS: MentorApplicationRecord[] = [
  {
    id: "app-rahul",
    mentorProfileId: "mentor-rahul",
    mentorName: "Rahul Mehta",
    currentRole: "Data Scientist",
    organization: "Google",
    status: "submitted",
    identityProofType: "Aadhaar / Passport",
    identityProofVerified: true,
    professionalProofType: "Work Email (google.com) + LinkedIn",
    professionalProofVerified: true,
    resumeUrl: "/documents/Rahul_Mehta_Resume.pdf",
    linkedinUrl: "https://linkedin.com/in/rahul-mehta-mock",
    appliedDate: "2026-02-10",
    adminNotes: "Credentials match Google domain. LinkedIn profile active with 5+ years experience.",
  },
  {
    id: "app-priya",
    mentorProfileId: "mentor-priya",
    mentorName: "Priya Sharma",
    currentRole: "Software Engineer",
    organization: "Microsoft",
    status: "approved",
    identityProofType: "Passport",
    identityProofVerified: true,
    professionalProofType: "Microsoft Corporate Email + Badge",
    professionalProofVerified: true,
    resumeUrl: "/documents/Priya_Sharma_Resume.pdf",
    linkedinUrl: "https://linkedin.com/in/priya-sharma-mock",
    appliedDate: "2025-11-01",
    adminNotes: "Fully verified by admin. High student rating.",
  },
];

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: "booking-1",
    studentUserId: "user-student-1",
    mentorProfileId: "mentor-priya",
    serviceType: "1on1_mentorship",
    sessionDurationMinutes: 60,
    startTimeUtc: "2026-11-15T14:00:00Z", // 7:30 PM IST
    endTimeUtc: "2026-11-15T15:00:00Z",
    userTimezone: "Asia/Kolkata",
    status: "confirmed",
    priceInr: 449,
    paymentStatus: "paid",
    studentDiscussionPoints: "Career path in Software Engineering, Interview preparation strategy, Project review and feedback",
    resumeAttachmentUrl: "/documents/Anant_Kumar_Resume.pdf",
    projectLinks: "https://github.com/anant/distributed-kv-store",
    meetingRoomId: "mm-room-priya-anant-101",
    agendaItems: [
      "Career path in Software Engineering",
      "Interview preparation strategy",
      "Project review and feedback",
    ],
    createdAt: "2026-11-10T12:00:00Z",
  },
  {
    id: "booking-2",
    studentUserId: "user-student-1",
    mentorProfileId: "mentor-rohan",
    serviceType: "mock_interview",
    mockInterviewCategory: "Technical",
    sessionDurationMinutes: 45,
    startTimeUtc: "2026-11-18T12:30:00Z", // 6:00 PM IST
    endTimeUtc: "2026-11-18T13:15:00Z",
    userTimezone: "Asia/Kolkata",
    status: "confirmed",
    priceInr: 399,
    paymentStatus: "paid",
    studentDiscussionPoints: "Technical mock interview round for SDE intern roles.",
    meetingRoomId: "mm-room-rohan-anant-102",
    agendaItems: [
      "Live Coding & Algorithm evaluation",
      "Time & space complexity trade-offs",
      "Live feedback rubric",
    ],
    createdAt: "2026-11-11T09:00:00Z",
  },
];

export const INITIAL_MOCK_INTERVIEW_REPORT: MockInterviewRecord = {
  id: "mock-report-1",
  bookingId: "booking-2",
  category: "Technical",
  targetRole: "SDE (Software Engineer)",
  difficulty: "Medium",
  overallScore: 8.2,
  scoreTechnical: 8.5,
  scoreProblemSolving: 7.8,
  scoreCommunication: 8.0,
  scoreConfidence: 8.6,
  strengths: [
    "Explained approach clearly with good structure before jumping into code.",
    "Handled follow-up boundary conditions and empty inputs gracefully.",
    "Solid grasp of fundamental graph traversals (BFS/DFS).",
  ],
  areasToImprove: [
    "Can optimize time complexity from O(N^2) to O(N log N) using a min-heap.",
    "Add more test case examples and mention edge cases explicitly before typing.",
  ],
  detailedFeedback: "Anant demonstrated strong problem comprehension and structured his code modularly. He communicates his thought process out loud effectively. With practice on priority queues and dynamic programming memoization, he is well positioned for top tier tech interviews.",
  recommendedNextSteps: "Practice 15 heap/priority queue problems on LeetCode and schedule a System Design starter call.",
  createdAt: "2026-11-12T10:00:00Z",
};

export const INITIAL_NOTIFICATIONS: NotificationRecord[] = [
  {
    id: "notif-1",
    userId: "user-student-1",
    title: "Session Confirmed",
    message: "Your 1:1 Mentorship session with Priya Sharma is confirmed for Tue, Feb 11 at 7:30 PM (IST).",
    type: "booking",
    linkUrl: "/dashboard/sessions",
    isRead: false,
    createdAt: "2026-11-11T10:00:00Z",
  },
  {
    id: "notif-2",
    userId: "user-student-1",
    title: "Mock Interview Feedback Ready",
    message: "Your interview evaluation report (Score: 8.2/10) is now available for review.",
    type: "session",
    linkUrl: "/dashboard/mock-interviews",
    isRead: false,
    createdAt: "2026-11-12T11:00:00Z",
  },
  {
    id: "notif-3",
    userId: "user-student-1",
    title: "New Message from Priya Sharma",
    message: "Looking forward to our session! Please review the shared system design roadmap.",
    type: "chat",
    linkUrl: "/dashboard/messages",
    isRead: false,
    createdAt: "2026-11-12T12:30:00Z",
  },
];

