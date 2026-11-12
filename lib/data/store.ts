import {
  INITIAL_USERS,
  INITIAL_STUDENT_PROFILE,
  INITIAL_MENTORS,
  INITIAL_APPLICATIONS,
  INITIAL_BOOKINGS,
  INITIAL_MOCK_INTERVIEW_REPORT,
  INITIAL_NOTIFICATIONS,
  UserRecord,
  StudentProfileRecord,
  MentorProfileRecord,
  MentorApplicationRecord,
  BookingRecord,
  SessionRecord,
  MockInterviewRecord,
  MessageRecord,
  NotificationRecord,
  LedgerTransactionRecord,
} from "./mock-data";

// In-Memory Durable Repository Store for Fast, Zero-Cost Dev & Testing
class MentorMazeDataStore {
  private users: Map<string, UserRecord> = new Map();
  private studentProfiles: Map<string, StudentProfileRecord> = new Map();
  private mentors: Map<string, MentorProfileRecord> = new Map();
  private applications: Map<string, MentorApplicationRecord> = new Map();
  private bookings: Map<string, BookingRecord> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private mockReports: Map<string, MockInterviewRecord> = new Map();
  private messages: MessageRecord[] = [];
  private notifications: NotificationRecord[] = [];
  private ledger: LedgerTransactionRecord[] = [];
  private consentGrants: Map<string, { userId: string; scopes: string[]; isRevoked: boolean; updatedAt: string }> = new Map();
  
  // Platform configuration state
  private platformSettings = {
    platformName: "MentorMaze",
    supportEmail: process.env.SMTP_USER || "hellomentormaze@gmail.com",
    commissionPercent: 15.0,
    defaultSessionMinutes: 30,
    matchingWeights: {
      careerGoalAlignment: 0.30,
      skillGapAlignment: 0.25,
      domainExpertise: 0.20,
      academicRelevance: 0.10,
      availability: 0.10,
      studentPreference: 0.05,
    },
    pilotPricing: {
      mentorship15Min: 149,
      mentorship30Min: 249,
      mentorship60Min: 449,
      mockInterviewStarter: 299,
      mockInterviewStandard: 399,
      mockInterviewDetailed: 499,
    },
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    INITIAL_USERS.forEach((u) => this.users.set(u.id, { ...u }));
    this.studentProfiles.set(INITIAL_STUDENT_PROFILE.userId, JSON.parse(JSON.stringify(INITIAL_STUDENT_PROFILE)));
    INITIAL_MENTORS.forEach((m) => this.mentors.set(m.id, JSON.parse(JSON.stringify(m))));
    INITIAL_APPLICATIONS.forEach((a) => this.applications.set(a.id, { ...a }));
    INITIAL_BOOKINGS.forEach((b) => {
      this.bookings.set(b.id, { ...b });
      // Create session pairing
      this.sessions.set(b.id, {
        id: `sess-${b.id}`,
        bookingId: b.id,
        livekitRoomName: b.meetingRoomId,
        status: "scheduled",
        sessionPlanChecklist: (b.agendaItems || []).map((item) => ({ item, completed: false })),
        studentVisibleSummary: "Initial session to review distributed systems project and SDE roadmap.",
        resourcesShared: [
          { title: "SDE_Roadmap.pdf", url: "/documents/SDE_Roadmap.pdf", size: "2.4 MB" },
          { title: "Project_Review_Notes.pdf", url: "/documents/Project_Review_Notes.pdf", size: "1.8 MB" },
        ],
      });
    });
    this.mockReports.set(INITIAL_MOCK_INTERVIEW_REPORT.bookingId, { ...INITIAL_MOCK_INTERVIEW_REPORT });
    this.notifications = [...INITIAL_NOTIFICATIONS];

    // Seed sample conversation
    this.messages = [
      {
        id: "msg-1",
        conversationId: "conv-priya-anant",
        senderUserId: "user-mentor-priya",
        content: "Hi Anant! Welcome to MentorMaze. I saw your goal of cracking SDE interviews and building a distributed systems project.",
        isRead: true,
        createdAt: "2026-11-11T14:00:00Z",
      },
      {
        id: "msg-2",
        conversationId: "conv-priya-anant",
        senderUserId: "user-student-1",
        content: "Hello Priya! Thank you so much for accepting the mentorship session. Looking forward to reviewing the project roadmap.",
        isRead: true,
        createdAt: "2026-11-11T14:15:00Z",
      },
      {
        id: "msg-3",
        conversationId: "conv-priya-anant",
        senderUserId: "user-mentor-priya",
        content: "Please make sure to upload your latest resume and the GitHub link before Tuesday's session so I can prepare detailed notes.",
        attachmentUrl: "/documents/SDE_Interview_Preparation_Guide.pdf",
        attachmentName: "SDE_Interview_Preparation_Guide.pdf",
        isRead: false,
        createdAt: "2026-11-12T12:30:00Z",
      },
    ];

    // Seed ledger
    INITIAL_BOOKINGS.forEach((b) => {
      const commission = this.platformSettings.commissionPercent;
      const platformFee = Math.round((b.priceInr * commission) / 100);
      const mentorPayable = b.priceInr - platformFee;
      this.ledger.push({
        id: `tx-${b.id}`,
        bookingId: b.id,
        studentUserId: b.studentUserId,
        mentorProfileId: b.mentorProfileId,
        grossAmountInr: b.priceInr,
        platformCommissionPercent: commission,
        platformFeeInr: platformFee,
        mentorPayableInr: mentorPayable,
        status: "settled",
        paymentProvider: "cashfree",
        providerOrderId: `order_cf_${b.id}`,
        providerPaymentId: `pay_cf_${b.id}`,
        createdAt: b.createdAt,
      });
    });

    // Default consent for Anant from AI Tathastu
    this.consentGrants.set("user-student-1", {
      userId: "user-student-1",
      scopes: ["academic", "skills", "projects", "goals", "learning_activity"],
      isRevoked: false,
      updatedAt: "2026-01-10T10:00:00Z",
    });
  }

  // ==========================================
  // USERS & AUTH
  // ==========================================

  getUser(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): UserRecord | undefined {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(userData: Omit<UserRecord, "id" | "createdAt">): UserRecord {
    const id = `user-${Date.now()}`;
    const user: UserRecord = {
      id,
      ...userData,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  getAllUsers(): UserRecord[] {
    return Array.from(this.users.values());
  }

  updateUserStatus(userId: string, status: "active" | "suspended" | "closed"): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.accountStatus = status;
    return true;
  }

  // ==========================================
  // STUDENT PROFILES & GOALS
  // ==========================================

  getStudentProfile(userId: string): StudentProfileRecord | undefined {
    return this.studentProfiles.get(userId);
  }

  updateStudentProfile(userId: string, data: Partial<StudentProfileRecord>): StudentProfileRecord {
    let profile = this.studentProfiles.get(userId);
    if (!profile) {
      profile = {
        id: `profile-${Date.now()}`,
        userId,
        institution: "Lovely Professional University",
        degree: "B.Tech Computer Science",
        fieldOfStudy: "Computer Science",
        graduationYear: 2027,
        targetRole: "Software Engineer",
        currentLevel: "Undergraduate",
        bio: "",
        preferredLanguages: ["English"],
        skills: [],
        goals: [],
        actionItems: [],
        ...data,
      };
      this.studentProfiles.set(userId, profile);
    } else {
      Object.assign(profile, data);
    }
    return profile;
  }

  addStudentGoal(userId: string, goal: { title: string; description: string; category: string; targetDate: string }): any {
    const profile = this.studentProfiles.get(userId);
    if (!profile) return null;
    const newGoal = {
      id: `goal-${Date.now()}`,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      progressPercentage: 0,
      status: "in_progress" as const,
      targetDate: goal.targetDate,
    };
    profile.goals.push(newGoal);
    return newGoal;
  }

  toggleActionItem(userId: string, actionItemId: string): boolean {
    const profile = this.studentProfiles.get(userId);
    if (!profile) return false;
    const item = profile.actionItems.find((a) => a.id === actionItemId);
    if (!item) return false;
    item.status = item.status === "completed" ? "pending" : "completed";
    return true;
  }

  addActionItem(userId: string, item: { title: string; description: string; dueDate: string; createdByRole: "student" | "mentor" }): any {
    const profile = this.studentProfiles.get(userId);
    if (!profile) return null;
    const newItem = {
      id: `action-${Date.now()}`,
      title: item.title,
      description: item.description,
      dueDate: item.dueDate,
      status: "pending" as const,
      createdByRole: item.createdByRole,
    };
    profile.actionItems.push(newItem);
    return newItem;
  }

  // ==========================================
  // MENTORS & EXPLAINABLE MATCHING
  // ==========================================

  getMentors(approvedOnly = true): MentorProfileRecord[] {
    const list = Array.from(this.mentors.values());
    if (approvedOnly) {
      return list.filter((m) => m.verificationStatus === "approved");
    }
    return list;
  }

  getMentorById(id: string): MentorProfileRecord | undefined {
    return this.mentors.get(id);
  }

  // Top 3 Explainable Matching Algorithm (Rules-First, Deterministic, Transparent)
  getTopRecommendedMentors(userId: string): { mentor: MentorProfileRecord; matchScore: number; reasons: string[]; isBestMatch: boolean }[] {
    const student = this.getStudentProfile(userId);
    const approvedMentors = this.getMentors(true);

    if (!student) {
      // Return top rated approved mentors as fallback
      return approvedMentors.slice(0, 3).map((m, idx) => ({
        mentor: m,
        matchScore: idx === 0 ? 96 : idx === 1 ? 92 : 89,
        reasons: ["Top rated mentor in technical excellence", "Available for 1:1 sessions"],
        isBestMatch: idx === 0,
      }));
    }

    const studentSkills = (student.skills || []).map((s: any) =>
      (s.skillName || s.name || "").toLowerCase()
    );
    const studentTargetRole = (student.targetRole || "").toLowerCase();
    const studentGoals = (student.goals || [])
      .map((g: any) => `${g.title || ""} ${g.description || ""}`.toLowerCase())
      .join(" ");

    const scored = approvedMentors.map((mentor) => {
      let score = 50; // base score
      const reasons: string[] = [];

      // 1. Goal alignment
      const mentorRole = mentor.currentRole.toLowerCase();
      const mentorDomain = mentor.primaryDomain.toLowerCase();
      if (studentTargetRole && (mentorRole.includes(studentTargetRole) || mentorDomain.includes(studentTargetRole))) {
        score += 25;
        reasons.push("Matches your career goal of " + mentor.currentRole);
      } else if (studentTargetRole.includes("engineer") && mentorRole.includes("engineer")) {
        score += 20;
        reasons.push("Matches your career path in engineering");
      }

      // 2. Skill overlap
      const matchingSkills = mentor.skills.filter((sk) =>
        studentSkills.some((stk) => stk.includes(sk.toLowerCase()) || sk.toLowerCase().includes(stk))
      );
      if (matchingSkills.length > 0) {
        score += Math.min(matchingSkills.length * 5, 15);
        reasons.push("Relevant tech expertise in " + matchingSkills.slice(0, 2).join(", "));
      }

      // 3. Focus area alignment
      if (studentGoals.includes("interview") && mentor.focusAreas.includes("Interview Prep")) {
        score += 5;
        reasons.push("Specializes in technical interview preparation");
      }
      if (studentGoals.includes("project") && mentor.focusAreas.includes("Project Review")) {
        score += 5;
        reasons.push("Provides in-depth project portfolio review");
      }

      // 4. Availability fit
      if (mentor.availabilityWeekly && mentor.availabilityWeekly.some((a) => a.isActive)) {
        score += 5;
        reasons.push("Available this week");
      }

      // Clamp score to 85-98 range for realistic UX calibration
      const finalScore = Math.min(98, Math.max(82, score));

      return {
        mentor,
        matchScore: finalScore,
        reasons: reasons.slice(0, 3),
        isBestMatch: false,
      };
    });

    // Sort descending by match score
    scored.sort((a, b) => b.matchScore - a.matchScore);
    const topThree = scored.slice(0, 3);
    if (topThree.length > 0) {
      topThree[0].isBestMatch = true;
    }
    return topThree;
  }

  // ==========================================
  // MENTOR APPLICATIONS & VERIFICATION
  // ==========================================

  getApplications(): MentorApplicationRecord[] {
    return Array.from(this.applications.values());
  }

  submitMentorApplication(appData: Omit<MentorApplicationRecord, "id" | "status" | "appliedDate">): MentorApplicationRecord {
    const id = `app-${Date.now()}`;
    const newApp: MentorApplicationRecord = {
      id,
      ...appData,
      status: "submitted",
      appliedDate: new Date().toISOString().split("T")[0],
    };
    this.applications.set(id, newApp);

    // Update mentor record verification status
    const mentor = this.mentors.get(appData.mentorProfileId);
    if (mentor) {
      mentor.verificationStatus = "submitted";
    }
    return newApp;
  }

  verifyMentorApplication(appId: string, action: "approve" | "reject", adminNotes?: string, rejectionReason?: string): boolean {
    const app = this.applications.get(appId);
    if (!app) return false;

    const mentor = this.mentors.get(app.mentorProfileId);
    if (action === "approve") {
      app.status = "approved";
      app.adminNotes = adminNotes || "Approved after verifying identity and employer credentials.";
      if (mentor) {
        mentor.verificationStatus = "approved";
        mentor.verifiedAt = new Date().toISOString();
        mentor.isAcceptingBookings = true;
      }
    } else {
      app.status = "rejected";
      app.rejectionReason = rejectionReason || "Evidence provided was incomplete or could not be verified.";
      app.adminNotes = adminNotes;
      if (mentor) {
        mentor.verificationStatus = "rejected";
        mentor.isAcceptingBookings = false;
      }
    }
    return true;
  }

  // ==========================================
  // BOOKINGS & AVAILABILITY ENGINE
  // ==========================================

  getBookingsForUser(userId: string): BookingRecord[] {
    return Array.from(this.bookings.values()).filter(
      (b) => b.studentUserId === userId || (this.mentors.get(b.mentorProfileId)?.userId === userId)
    );
  }

  getBookingById(id: string): BookingRecord | undefined {
    return this.bookings.get(id);
  }

  // Atomic booking with concurrency protection against double-booking
  createBooking(params: {
    studentUserId: string;
    mentorProfileId: string;
    serviceType: "1on1_mentorship" | "group_mentorship" | "mock_interview";
    mockInterviewCategory?: "Technical" | "HR" | "System Design" | "Behavioral" | "Mixed";
    sessionDurationMinutes: number;
    startTimeUtc: string;
    endTimeUtc: string;
    userTimezone: string;
    priceInr: number;
    studentDiscussionPoints?: string;
  }): { success: boolean; booking?: BookingRecord; error?: string } {
    const mentor = this.mentors.get(params.mentorProfileId);
    if (!mentor) {
      return { success: false, error: "Mentor not found." };
    }
    if (mentor.verificationStatus !== "approved" || !mentor.isAcceptingBookings) {
      return { success: false, error: "This mentor is not currently approved or accepting bookings." };
    }

    // Double-booking check: Check for overlap with existing confirmed or pending bookings for this mentor
    const reqStart = new Date(params.startTimeUtc).getTime();
    const reqEnd = new Date(params.endTimeUtc).getTime();

    const hasConflict = Array.from(this.bookings.values()).some((b) => {
      if (b.mentorProfileId !== params.mentorProfileId) return false;
      if (b.status === "cancelled") return false;
      const bStart = new Date(b.startTimeUtc).getTime();
      const bEnd = new Date(b.endTimeUtc).getTime();
      // Overlap condition: start < bEnd && end > bStart
      return reqStart < bEnd && reqEnd > bStart;
    });

    if (hasConflict) {
      return { success: false, error: "This time slot has already been booked. Please select another slot." };
    }

    const bookingId = `booking-${Date.now()}`;
    const meetingRoomId = `mm-room-${mentor.id.replace("mentor-", "")}-${params.studentUserId.replace("user-", "")}-${Date.now().toString().slice(-4)}`;

    const newBooking: BookingRecord = {
      id: bookingId,
      studentUserId: params.studentUserId,
      mentorProfileId: params.mentorProfileId,
      serviceType: params.serviceType,
      mockInterviewCategory: params.mockInterviewCategory,
      sessionDurationMinutes: params.sessionDurationMinutes,
      startTimeUtc: params.startTimeUtc,
      endTimeUtc: params.endTimeUtc,
      userTimezone: params.userTimezone,
      status: "confirmed",
      priceInr: params.priceInr,
      paymentStatus: "paid", // auto-settled in sandbox mode
      studentDiscussionPoints: params.studentDiscussionPoints,
      meetingRoomId,
      agendaItems: [
        "1. Welcome & goal alignment",
        "2. Core topic discussion / mock evaluation",
        "3. Feedback, action items, and next steps",
      ],
      createdAt: new Date().toISOString(),
    };

    this.bookings.set(bookingId, newBooking);

    // Create session entity
    this.sessions.set(bookingId, {
      id: `sess-${bookingId}`,
      bookingId,
      livekitRoomName: meetingRoomId,
      status: "scheduled",
      sessionPlanChecklist: newBooking.agendaItems!.map((item) => ({ item, completed: false })),
      studentVisibleSummary: "Mentorship session scheduled.",
      resourcesShared: [],
    });

    // Record ledger entry
    const commission = this.platformSettings.commissionPercent;
    const platformFee = Math.round((newBooking.priceInr * commission) / 100);
    const mentorPayable = newBooking.priceInr - platformFee;
    this.ledger.push({
      id: `tx-${bookingId}`,
      bookingId,
      studentUserId: params.studentUserId,
      mentorProfileId: params.mentorProfileId,
      grossAmountInr: newBooking.priceInr,
      platformCommissionPercent: commission,
      platformFeeInr: platformFee,
      mentorPayableInr: mentorPayable,
      status: "settled",
      paymentProvider: "cashfree",
      providerOrderId: `order_cf_${bookingId}`,
      providerPaymentId: `pay_cf_${bookingId}`,
      createdAt: newBooking.createdAt,
    });

    // Add notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: params.studentUserId,
      title: "Session Booked Successfully!",
      message: `Your session with ${mentor.headline} is confirmed.`,
      type: "booking",
      linkUrl: `/dashboard/sessions`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return { success: true, booking: newBooking };
  }

  cancelBooking(bookingId: string, reason: string): boolean {
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;
    booking.status = "cancelled";
    booking.paymentStatus = "refunded";

    // Mark ledger transaction as refunded
    const tx = this.ledger.find((l) => l.bookingId === bookingId);
    if (tx) {
      tx.status = "refunded";
    }
    return true;
  }

  rescheduleBooking(bookingId: string, newStartUtc: string, newEndUtc: string): boolean {
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;
    booking.startTimeUtc = newStartUtc;
    booking.endTimeUtc = newEndUtc;
    booking.status = "rescheduled";
    return true;
  }

  // ==========================================
  // SESSIONS & LIVEKIT
  // ==========================================

  getSessionByBookingId(bookingId: string): SessionRecord | undefined {
    return this.sessions.get(bookingId);
  }

  updateSessionNotes(bookingId: string, data: { privateNotes?: string; sharedSummary?: string; checklist?: { item: string; completed: boolean }[] }): boolean {
    const session = this.sessions.get(bookingId);
    if (!session) return false;
    if (data.privateNotes !== undefined) session.mentorPrivateNotes = data.privateNotes;
    if (data.sharedSummary !== undefined) session.studentVisibleSummary = data.sharedSummary;
    if (data.checklist !== undefined) session.sessionPlanChecklist = data.checklist;
    return true;
  }

  // ==========================================
  // MOCK INTERVIEWS & RUBRICS
  // ==========================================

  getMockReportByBookingId(bookingId: string): MockInterviewRecord | undefined {
    return this.mockReports.get(bookingId);
  }

  submitMockEvaluation(report: MockInterviewRecord): void {
    this.mockReports.set(report.bookingId, report);
  }

  // ==========================================
  // MESSAGES & CONVERSATIONS
  // ==========================================

  getMessages(conversationId: string): MessageRecord[] {
    return this.messages.filter((m) => m.conversationId === conversationId);
  }

  sendMessage(conversationId: string, senderUserId: string, content: string, attachmentName?: string, attachmentUrl?: string): MessageRecord {
    const msg: MessageRecord = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderUserId,
      content,
      attachmentName,
      attachmentUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(msg);
    return msg;
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  getNotifications(userId: string): NotificationRecord[] {
    return this.notifications.filter((n) => n.userId === userId);
  }

  markNotificationAsRead(id: string): void {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) n.isRead = true;
  }

  // ==========================================
  // PAYMENTS & LEDGER
  // ==========================================

  getLedger(): LedgerTransactionRecord[] {
    return this.ledger;
  }

  // ==========================================
  // PLATFORM SETTINGS & ANALYTICS
  // ==========================================

  getSettings() {
    return this.platformSettings;
  }

  updateSettings(newSettings: Partial<typeof this.platformSettings>) {
    Object.assign(this.platformSettings, newSettings);
    return this.platformSettings;
  }

  getAnalytics() {
    const verifiedMentors = Array.from(this.mentors.values()).filter((m) => m.verificationStatus === "approved");
    const avgRating = verifiedMentors.length > 0
      ? Number((verifiedMentors.reduce((sum, m) => sum + m.rating, 0) / verifiedMentors.length).toFixed(1))
      : 5.0;

    const completedBookings = Array.from(this.bookings.values()).filter(
      (b) => b.status === "completed" || b.status === "confirmed"
    ).length;
    const completionRate = this.bookings.size > 0
      ? Math.round((completedBookings / this.bookings.size) * 100)
      : 100;

    return {
      totalUsers: this.users.size,
      totalMentors: this.mentors.size,
      approvedMentors: verifiedMentors.length,
      totalSessions: this.bookings.size,
      averageRating: avgRating,
      sessionCompletionRate: completionRate,
      activeMentees: Array.from(this.users.values()).filter((u) => u.role === "student").length,
      pendingApplications: Array.from(this.applications.values()).filter((a) => a.status === "submitted").length,
      isDemonstrationData: process.env.NODE_ENV !== "production",
    };
  }

  // ==========================================
  // AI TATHASTU CONSENT
  // ==========================================

  getConsent(userId: string) {
    return this.consentGrants.get(userId);
  }

  updateConsent(userId: string, scopes: string[], isRevoked = false) {
    this.consentGrants.set(userId, {
      userId,
      scopes,
      isRevoked,
      updatedAt: new Date().toISOString(),
    });
    return this.consentGrants.get(userId);
  }
}

// Global Singleton for Dev/Prod
const globalStore = global as unknown as { __mentorMazeStore?: MentorMazeDataStore };
export const store = globalStore.__mentorMazeStore || (globalStore.__mentorMazeStore = new MentorMazeDataStore());
