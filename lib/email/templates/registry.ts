import { EmailTemplate, EmailCategory } from "../types";
import { renderEmailShell, renderPlainText } from "../shell";
import { interpolateVariables, escapeHtml } from "../compiler";
import { EMAIL_TOKENS } from "../design-tokens";

export interface TemplateDefinition extends EmailTemplate {
  render: (variables: Record<string, any>) => {
    subject: string;
    previewText: string;
    html: string;
    text: string;
  };
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  // ==========================================
  // CATEGORY A — AUTHENTICATION AND ACCOUNT
  // ==========================================

  // 01. Welcome Student
  {
    id: "auth.welcome_student",
    name: "Welcome Student",
    category: "auth",
    isSystemCritical: true,
    isActive: true,
    subject: "Welcome to MentorMaze, {{user_name}} — Your journey starts here",
    previewText: "Start your mentorship journey with verified industry leaders and human mock interviews.",
    variables: [
      { key: "user_name", description: "First name or display name of the student", sampleValue: "Anant" },
      { key: "profile_url", description: "Direct link to complete student profile", sampleValue: "https://mentormaze.aitathastu.com/profile" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const profileUrl = vars.profile_url || `${EMAIL_TOKENS.brand.officialDomain}/profile`;
      const name = vars.user_name || "there";

      const contentHtml = `
        <p>We are thrilled to welcome you to <strong>MentorMaze by AI Tathastu</strong>. You now have direct access to experienced engineers, product managers, and leaders ready to accelerate your career.</p>
        <p>Here is what you can do next:</p>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; line-height: 26px;">
          <li><strong>Find Verified Mentors:</strong> Connect 1:1 with practitioners at top tech companies.</li>
          <li><strong>Human Mock Interviews:</strong> Practice system design, coding, and behavioral interviews with real-time feedback.</li>
          <li><strong>Career Roadmaps:</strong> Turn your ambitious career targets into structured weekly action items.</li>
        </ul>
        <p>To help us match you with the best mentors, complete your target role and skills profile.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Welcome to MentorMaze",
        heading: `Welcome to MentorMaze, ${name}`,
        introText: "Your mentorship and interview preparation workspace is ready.",
        primaryCta: {
          label: "Complete Your Profile",
          url: profileUrl,
        },
        contentHtml,
        secondaryInfoHtml: `Need help finding a mentor? Explore our curated catalog of vetted mentors at <a href="${EMAIL_TOKENS.brand.officialDomain}/explore" style="color:${EMAIL_TOKENS.colors.forest800};font-weight:600;">Browse Mentors</a>.`,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 02. Welcome Mentor
  {
    id: "auth.welcome_mentor",
    name: "Welcome Mentor",
    category: "auth",
    isSystemCritical: true,
    isActive: true,
    subject: "Welcome to the MentorMaze Mentor Community, {{user_name}}",
    previewText: "Thank you for joining our mission to guide the next generation of engineers and leaders.",
    variables: [
      { key: "user_name", description: "Display name of the mentor", sampleValue: "Priya" },
      { key: "onboarding_url", description: "Link to mentor setup wizard", sampleValue: "https://mentormaze.aitathastu.com/mentor/onboarding" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const onboardingUrl = vars.onboarding_url || `${EMAIL_TOKENS.brand.officialDomain}/apply`;
      const name = vars.user_name || "Mentor";

      const contentHtml = `
        <p>Thank you for offering your expertise to aspiring developers and professionals on MentorMaze. Your guidance will have a lasting impact on your mentees' careers.</p>
        <p>As a verified mentor on MentorMaze:</p>
        <ul style="margin: 0 0 20px 0; padding-left: 20px; line-height: 26px;">
          <li>You define your availability and session formats (15, 30, or 60 min).</li>
          <li>You receive guaranteed payouts directly through our secure ledger.</li>
          <li>You conduct seamless video sessions with integrated agendas and collaborative notes.</li>
        </ul>
        <p>Please complete your verification details and availability calendar to start receiving booking requests.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Mentor Community",
        heading: `Welcome to MentorMaze, ${name}`,
        introText: "Empower future technologists through 1:1 mentorship and mock interviews.",
        primaryCta: {
          label: "Complete Mentor Setup",
          url: onboardingUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 03. Email Verification
  {
    id: "auth.email_verification",
    name: "Email Verification",
    category: "auth",
    isSystemCritical: true,
    isActive: true,
    subject: "Verify your email address for MentorMaze",
    previewText: "Confirm your email address to activate your MentorMaze account.",
    variables: [
      { key: "user_name", description: "Recipient name", sampleValue: "Anant" },
      { key: "verification_url", description: "Single-use verification link", sampleValue: "https://mentormaze.aitathastu.com/verify-email?token=xyz" },
      { key: "expires_in", description: "Expiration window", sampleValue: "24 hours" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const verifyUrl = vars.verification_url || `${EMAIL_TOKENS.brand.officialDomain}/login`;
      const expiresIn = vars.expires_in || "24 hours";

      const contentHtml = `
        <p>Please click the button below to verify your email address and activate your account. For your security, this verification link will expire in <strong>${escapeHtml(expiresIn)}</strong>.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Security Verification",
        heading: "Verify Your Email Address",
        introText: "Confirm your email to complete your registration with MentorMaze.",
        primaryCta: {
          label: "Verify Email Address",
          url: verifyUrl,
        },
        contentHtml,
        secondaryInfoHtml: `If you did not create an account with MentorMaze, please disregard this email or report it to <a href="mailto:${EMAIL_TOKENS.brand.supportEmail}" style="color:${EMAIL_TOKENS.colors.forest800};">${EMAIL_TOKENS.brand.supportEmail}</a>.`,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 04. Password Reset
  {
    id: "auth.password_reset",
    name: "Password Reset Request",
    category: "auth",
    isSystemCritical: true,
    isActive: true,
    subject: "Reset your MentorMaze password",
    previewText: "Instructions to securely reset your MentorMaze account password.",
    variables: [
      { key: "user_name", description: "User's display name", sampleValue: "Anant" },
      { key: "reset_url", description: "Single-use reset link", sampleValue: "https://mentormaze.aitathastu.com/reset-password?token=abc" },
      { key: "expires_in", description: "Link expiration timeframe", sampleValue: "1 hour" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const resetUrl = vars.reset_url || `${EMAIL_TOKENS.brand.officialDomain}/forgot-password`;
      const expiresIn = vars.expires_in || "1 hour";

      const contentHtml = `
        <p>We received a request to reset the password for your MentorMaze account. Click the button below to choose a new password.</p>
        <p>This password reset link is strictly valid for <strong>${escapeHtml(expiresIn)}</strong> and can only be used once.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Account Security",
        heading: "Reset Your Password",
        introText: "Follow the secure link below to reset your password.",
        primaryCta: {
          label: "Reset Password",
          url: resetUrl,
        },
        contentHtml,
        secondaryInfoHtml: `<strong>Did not request this?</strong> If you did not make this request, you can safely ignore this email. Your password will remain unchanged and your account remains secure.`,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 05. Password Changed Alert
  {
    id: "auth.password_changed",
    name: "Password Changed Alert",
    category: "auth",
    isSystemCritical: true,
    isActive: true,
    subject: "Your MentorMaze password was changed",
    previewText: "Security notification regarding your MentorMaze password update.",
    variables: [
      { key: "user_name", description: "User's display name", sampleValue: "Anant" },
      { key: "timestamp", description: "Time of change", sampleValue: "November 12, 2026 at 11:15 PM IST" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const timestamp = vars.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

      const contentHtml = `
        <p>This is a confirmation that the password for your MentorMaze account was successfully changed on <strong>${escapeHtml(timestamp)}</strong>.</p>
        <p>If you made this change, no further action is required.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Security Notification",
        heading: "Password Changed Successfully",
        introText: "Your account credentials were updated.",
        contentHtml,
        secondaryInfoHtml: `<span style="color:${EMAIL_TOKENS.colors.errorRed};font-weight:700;">Important:</span> If you did NOT change your password, someone may have accessed your account. Please <a href="${EMAIL_TOKENS.brand.officialDomain}/forgot-password" style="color:${EMAIL_TOKENS.colors.forest800};font-weight:600;">reset your password immediately</a> and contact support at <a href="mailto:${EMAIL_TOKENS.brand.supportEmail}" style="color:${EMAIL_TOKENS.colors.forest800};font-weight:600;">${EMAIL_TOKENS.brand.supportEmail}</a>.`,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 06. New Login Alert
  {
    id: "auth.new_login_alert",
    name: "New Sign-in Alert",
    category: "auth",
    isSystemCritical: true,
    isActive: true,
    subject: "New sign-in to your MentorMaze account",
    previewText: "We detected a sign-in to your account from a new device or browser.",
    variables: [
      { key: "user_name", description: "User name", sampleValue: "Anant" },
      { key: "device_browser", description: "Browser / Device client", sampleValue: "Chrome on macOS" },
      { key: "ip_address", description: "Client IP address", sampleValue: "49.36.12.8" },
      { key: "login_time", description: "Timestamp of sign-in", sampleValue: "November 12, 2026 at 11:20 PM IST" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>We noticed a sign-in to your MentorMaze account from a new device or session.</p>
      `;

      const summaryCard = {
        title: "Sign-In Details",
        items: [
          { label: "Device / Browser", value: vars.device_browser || "Web Browser" },
          { label: "IP Address", value: vars.ip_address || "Unavailable" },
          { label: "Time", value: vars.login_time || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Security Alert",
        heading: "New Account Sign-In Detected",
        introText: "Review your recent account activity.",
        summaryCard,
        contentHtml,
        secondaryInfoHtml: `If this was you, you can disregard this alert. If you do not recognize this activity, please <a href="${EMAIL_TOKENS.brand.officialDomain}/forgot-password" style="color:${EMAIL_TOKENS.colors.forest800};font-weight:600;">change your password</a> right away.`,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // ==========================================
  // CATEGORY B — STUDENT COMMUNICATION
  // ==========================================

  // 07. Profile Completion Reminder
  {
    id: "student.profile_reminder",
    name: "Profile Completion Reminder",
    category: "student",
    isSystemCritical: false,
    isActive: true,
    subject: "Your mentorship journey is waiting to begin, {{user_name}}",
    previewText: "Complete your profile to unlock precision mentor matching.",
    variables: [
      { key: "user_name", description: "Student's name", sampleValue: "Anant" },
      { key: "completion_percentage", description: "Current percentage complete", sampleValue: "40%" },
      { key: "missing_fields", description: "Fields requiring input", sampleValue: "Target Role, Key Skills, Graduation Year" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const pct = vars.completion_percentage || "50%";
      const missing = vars.missing_fields || "Skills and Target Role";

      const contentHtml = `
        <p>Mentors on MentorMaze review your goals and background before accepting bookings. Complete profiles receive <strong>3x faster responses</strong> and more tailored guidance.</p>
        <p>Your profile is currently at <strong>${escapeHtml(pct)}</strong>. Adding your <strong>${escapeHtml(missing)}</strong> will help our matching engine suggest the most relevant mentors for your target companies.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Profile Progress",
        heading: "Complete Your Profile for Better Matches",
        introText: "Take 2 minutes to fine-tune your career goals.",
        primaryCta: {
          label: "Complete My Profile",
          url: `${EMAIL_TOKENS.brand.officialDomain}/profile`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 08. Mentor Recommendations
  {
    id: "student.mentor_recommendations",
    name: "Mentor Recommendations",
    category: "student",
    isSystemCritical: false,
    isActive: true,
    subject: "We found mentors who match your goals, {{user_name}}",
    previewText: "Explore verified mentors tailored to your target role and skills.",
    variables: [
      { key: "user_name", description: "Student name", sampleValue: "Anant" },
      { key: "target_role", description: "Student target role", sampleValue: "Software Development Engineer" },
      { key: "mentor_names", description: "Highlighted mentors", sampleValue: "Priya Sharma (Senior SWE), Vikram Patel (Principal Architect)" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const targetRole = vars.target_role || "your target role";
      const mentors = vars.mentor_names || "verified industry practitioners";

      const contentHtml = `
        <p>Based on your interest in <strong>${escapeHtml(targetRole)}</strong>, our matching engine has identified top mentors with verified experience in distributed systems, competitive interview prep, and career strategy:</p>
        <p style="padding: 12px 16px; background-color: ${EMAIL_TOKENS.colors.cream100}; border-left: 4px solid ${EMAIL_TOKENS.colors.forest800}; border-radius: 4px; font-weight: 600;">
          ${escapeHtml(mentors)}
        </p>
        <p>Book a 15-minute quick consultation or a full 1-hour deep-dive mock interview to get practical feedback.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Personalized Recommendations",
        heading: "Curated Mentors for Your Career Goals",
        introText: "Explore recommended mentors aligned with your journey.",
        primaryCta: {
          label: "Explore Recommended Mentors",
          url: `${EMAIL_TOKENS.brand.officialDomain}/explore`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 09. Booking Request Confirmation (Student)
  {
    id: "booking.requested_student",
    name: "Booking Request Received (Student)",
    category: "student",
    isSystemCritical: true,
    isActive: true,
    subject: "Your mentorship booking request has been received — {{booking_reference}}",
    previewText: "Your booking request is pending confirmation from your mentor.",
    variables: [
      { key: "user_name", description: "Student name", sampleValue: "Anant" },
      { key: "mentor_name", description: "Mentor's name", sampleValue: "Priya Sharma" },
      { key: "session_type", description: "1:1 Mentorship or Mock Interview", sampleValue: "1:1 Mentorship Deep-Dive" },
      { key: "session_date", description: "Scheduled session date", sampleValue: "Saturday, November 15, 2026" },
      { key: "session_time", description: "Scheduled session time", sampleValue: "4:00 PM - 5:00 PM IST" },
      { key: "booking_reference", description: "Booking ID", sampleValue: "BK-82910" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>We have received your booking request for a session with <strong>${escapeHtml(vars.mentor_name || "your mentor")}</strong>. Your mentor has been notified and will confirm the request shortly.</p>
      `;

      const summaryCard = {
        title: "Booking Request Details",
        items: [
          { label: "Reference", value: vars.booking_reference || "Pending" },
          { label: "Mentor", value: vars.mentor_name || "Mentor" },
          { label: "Session Type", value: vars.session_type || "1:1 Mentorship" },
          { label: "Date & Time", value: `${vars.session_date || "Upcoming"} at ${vars.session_time || "Scheduled Time"}` },
          { label: "Status", value: "Pending Mentor Confirmation", isHighlight: true },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Booking Status",
        heading: "Booking Request Received",
        introText: "Your session request has been forwarded to the mentor.",
        summaryCard,
        primaryCta: {
          label: "View Booking Details",
          url: `${EMAIL_TOKENS.brand.officialDomain}/dashboard/sessions`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 10. Booking Confirmed (Student)
  {
    id: "booking.confirmed_student",
    name: "Booking Confirmed (Student)",
    category: "student",
    isSystemCritical: true,
    isActive: true,
    subject: "Your mentorship session is confirmed! — {{session_date}}",
    previewText: "Your 1:1 mentorship session is confirmed. View meeting room details.",
    variables: [
      { key: "user_name", description: "Student name", sampleValue: "Anant" },
      { key: "mentor_name", description: "Mentor name", sampleValue: "Priya Sharma" },
      { key: "session_date", description: "Date of session", sampleValue: "Saturday, November 15, 2026" },
      { key: "session_time", description: "Time of session with timezone", sampleValue: "4:00 PM IST (30 mins)" },
      { key: "meeting_url", description: "Secure meeting link", sampleValue: "https://mentormaze.aitathastu.com/sessions/bk-1/live" },
      { key: "booking_reference", description: "Booking ID", sampleValue: "BK-82910" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const meetingUrl = vars.meeting_url || `${EMAIL_TOKENS.brand.officialDomain}/dashboard/sessions`;

      const contentHtml = `
        <p>Great news! Your mentorship session with <strong>${escapeHtml(vars.mentor_name || "your mentor")}</strong> has been confirmed.</p>
        <p>Please make sure to arrive 2 minutes early and test your camera and microphone. The meeting room will open 5 minutes prior to the scheduled start time.</p>
      `;

      const summaryCard = {
        title: "Confirmed Session Details",
        items: [
          { label: "Reference", value: vars.booking_reference || "Confirmed" },
          { label: "Mentor", value: vars.mentor_name || "Mentor" },
          { label: "Date & Time", value: `${vars.session_date || "Date"} at ${vars.session_time || "Time"}` },
          { label: "Status", value: "Confirmed", isHighlight: true },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Session Confirmed",
        heading: "Your Mentorship Session is Confirmed",
        introText: "Everything is set for your upcoming session.",
        summaryCard,
        primaryCta: {
          label: "Enter Meeting Room / Add to Calendar",
          url: meetingUrl,
        },
        contentHtml,
        secondaryInfoHtml: `Need to reschedule? You can reschedule free of charge up to 6 hours before the session from your <a href="${EMAIL_TOKENS.brand.officialDomain}/dashboard/sessions" style="color:${EMAIL_TOKENS.colors.forest800};font-weight:600;">Sessions Dashboard</a>.`,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 11. Upcoming Session Reminder (Student)
  {
    id: "booking.reminder_student",
    name: "Upcoming Session Reminder (Student)",
    category: "student",
    isSystemCritical: true,
    isActive: true,
    subject: "Reminder: Your MentorMaze session is coming up in {{time_remaining}}",
    previewText: "Your mentorship session starts soon. Review your agenda and discussion points.",
    variables: [
      { key: "user_name", description: "Student name", sampleValue: "Anant" },
      { key: "mentor_name", description: "Mentor name", sampleValue: "Priya Sharma" },
      { key: "time_remaining", description: "Time interval remaining", sampleValue: "1 hour" },
      { key: "session_time", description: "Scheduled start time", sampleValue: "4:00 PM IST" },
      { key: "meeting_url", description: "Direct join URL", sampleValue: "https://mentormaze.aitathastu.com/sessions/bk-1/live" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const meetingUrl = vars.meeting_url || `${EMAIL_TOKENS.brand.officialDomain}/dashboard/sessions`;

      const contentHtml = `
        <p>This is a quick reminder that your session with <strong>${escapeHtml(vars.mentor_name || "your mentor")}</strong> begins in <strong>${escapeHtml(vars.time_remaining || "soon")}</strong> at <strong>${escapeHtml(vars.session_time || "the scheduled time")}</strong>.</p>
        <p><strong>Quick Checklist:</strong></p>
        <ul style="margin: 0 0 16px 0; padding-left: 20px; line-height: 24px;">
          <li>Review the questions and agenda items you submitted.</li>
          <li>Have your resume or code repository open if requesting a critique.</li>
          <li>Ensure a stable internet connection and quiet environment.</li>
        </ul>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Session Reminder",
        heading: "Your Session Starts Soon",
        introText: `Ready for your session with ${vars.mentor_name || "your mentor"}?`,
        primaryCta: {
          label: "Join Video Session",
          url: meetingUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 12. Session Rescheduled (Student)
  {
    id: "booking.rescheduled_student",
    name: "Session Rescheduled (Student)",
    category: "student",
    isSystemCritical: true,
    isActive: true,
    subject: "Your MentorMaze session has been rescheduled — {{new_date}}",
    previewText: "Your mentorship session has a new confirmed date and time.",
    variables: [
      { key: "user_name", description: "Student name", sampleValue: "Anant" },
      { key: "mentor_name", description: "Mentor name", sampleValue: "Priya Sharma" },
      { key: "previous_time", description: "Old session time", sampleValue: "Friday, Nov 14 at 4:00 PM IST" },
      { key: "new_date", description: "New session date", sampleValue: "Saturday, Nov 15, 2026" },
      { key: "new_time", description: "New session time", sampleValue: "5:00 PM IST" },
      { key: "reason", description: "Reschedule reason if approved", sampleValue: "Mentor schedule conflict" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>Your upcoming session with <strong>${escapeHtml(vars.mentor_name || "your mentor")}</strong> has been rescheduled to a new time slot.</p>
        ${vars.reason ? `<p><strong>Reason:</strong> ${escapeHtml(vars.reason)}</p>` : ""}
      `;

      const summaryCard = {
        title: "Rescheduled Time Details",
        items: [
          { label: "Previous Time", value: vars.previous_time || "Previous Time" },
          { label: "New Date & Time", value: `${vars.new_date || "Date"} at ${vars.new_time || "Time"}`, isHighlight: true },
          { label: "Status", value: "Rescheduled" },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Schedule Update",
        heading: "Session Rescheduled",
        introText: "Please check your updated session time.",
        summaryCard,
        primaryCta: {
          label: "View Updated Booking",
          url: `${EMAIL_TOKENS.brand.officialDomain}/dashboard/sessions`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 13. Session Cancelled (Student)
  {
    id: "booking.cancelled_student",
    name: "Session Cancelled (Student)",
    category: "student",
    isSystemCritical: true,
    isActive: true,
    subject: "Your MentorMaze session has been cancelled — {{booking_reference}}",
    previewText: "Important update regarding your cancelled mentorship session.",
    variables: [
      { key: "user_name", description: "Student name", sampleValue: "Anant" },
      { key: "mentor_name", description: "Mentor name", sampleValue: "Priya Sharma" },
      { key: "booking_reference", description: "Booking ID", sampleValue: "BK-82910" },
      { key: "cancellation_initiator", description: "Who cancelled (Student / Mentor / Admin)", sampleValue: "Mentor" },
      { key: "refund_status", description: "Refund progress", sampleValue: "100% Refund Initiated to Original Payment Method" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>We regret to inform you that your session with <strong>${escapeHtml(vars.mentor_name || "your mentor")}</strong> (Ref: ${escapeHtml(vars.booking_reference || "N/A")}) has been cancelled.</p>
      `;

      const summaryCard = {
        title: "Cancellation & Refund Details",
        items: [
          { label: "Booking Reference", value: vars.booking_reference || "N/A" },
          { label: "Cancelled By", value: vars.cancellation_initiator || "System" },
          { label: "Refund Status", value: vars.refund_status || "Processed per policy", isHighlight: true },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Session Cancelled",
        heading: "Session Cancelled",
        introText: "Your booking has been cancelled and refunded where applicable.",
        summaryCard,
        primaryCta: {
          label: "Find Another Mentor",
          url: `${EMAIL_TOKENS.brand.officialDomain}/explore`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 14. Session Completed (Student)
  {
    id: "booking.completed_student",
    name: "Session Completed (Student)",
    category: "student",
    isSystemCritical: false,
    isActive: true,
    subject: "Your mentorship session is complete — How was your experience?",
    previewText: "Leave feedback for your mentor and review your discussion notes.",
    variables: [
      { key: "user_name", description: "Student name", sampleValue: "Anant" },
      { key: "mentor_name", description: "Mentor name", sampleValue: "Priya Sharma" },
      { key: "session_notes_url", description: "Link to session notes", sampleValue: "https://mentormaze.aitathastu.com/dashboard/sessions" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>Congratulations on completing your mentorship session with <strong>${escapeHtml(vars.mentor_name || "your mentor")}</strong>!</p>
        <p>Taking action on what you discussed is the most crucial part of mentorship. Review any shared resources, action items, and notes from your session.</p>
        <p>Your feedback helps our community flourish. Please take 30 seconds to rate your session.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Session Completed",
        heading: "Great Job Completing Your Session!",
        introText: "Keep your career momentum going.",
        primaryCta: {
          label: "Leave Feedback & View Notes",
          url: vars.session_notes_url || `${EMAIL_TOKENS.brand.officialDomain}/dashboard/sessions`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 15. Mock Interview Completed
  {
    id: "mock_interview.completed",
    name: "Mock Interview Completed",
    category: "student",
    isSystemCritical: false,
    isActive: true,
    subject: "Your mock interview is complete — View your rubric scorecard",
    previewText: "Your mentor has finalized your detailed scorecard and actionable feedback.",
    variables: [
      { key: "user_name", description: "Student name", sampleValue: "Anant" },
      { key: "mentor_name", description: "Interviewer name", sampleValue: "Priya Sharma" },
      { key: "target_role", description: "Interview target role", sampleValue: "Software Engineer (SDE-2)" },
      { key: "overall_score", description: "Overall rubric score", sampleValue: "8.5 / 10" },
      { key: "report_url", description: "Direct link to mock interview report", sampleValue: "https://mentormaze.aitathastu.com/mock-interviews/report/1" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const reportUrl = vars.report_url || `${EMAIL_TOKENS.brand.officialDomain}/dashboard/sessions`;

      const contentHtml = `
        <p>Your mock interview with <strong>${escapeHtml(vars.mentor_name || "your interviewer")}</strong> for the role of <strong>${escapeHtml(vars.target_role || "Software Engineer")}</strong> has been evaluated.</p>
        <p>Your comprehensive scorecard includes ratings across Technical Proficiency, Problem Solving, Communication, and Architecture, as well as high-priority areas for improvement before your live interviews.</p>
      `;

      const summaryCard = {
        title: "Interview Assessment Summary",
        items: [
          { label: "Target Role", value: vars.target_role || "Technical Role" },
          { label: "Interviewer", value: vars.mentor_name || "Mentor" },
          { label: "Overall Score", value: vars.overall_score || "Completed", isHighlight: true },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Evaluation Ready",
        heading: "Your Mock Interview Scorecard is Ready",
        introText: "Review your detailed feedback and targeted improvement steps.",
        summaryCard,
        primaryCta: {
          label: "View Full Scorecard & Rubric",
          url: reportUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // ==========================================
  // CATEGORY C — MENTOR COMMUNICATION
  // ==========================================

  // 16. Mentor Application Received
  {
    id: "mentor.application_received",
    name: "Mentor Application Received",
    category: "mentor",
    isSystemCritical: true,
    isActive: true,
    subject: "We've received your MentorMaze mentor application — {{application_id}}",
    previewText: "Thank you for applying to mentor on MentorMaze. Our admissions team is reviewing your profile.",
    variables: [
      { key: "user_name", description: "Applicant's name", sampleValue: "Priya" },
      { key: "application_id", description: "Application reference ID", sampleValue: "APP-5921" },
      { key: "turnaround_time", description: "Expected review duration", sampleValue: "2-3 business days" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>Thank you for submitting your application to join the MentorMaze mentor community. We appreciate your commitment to sharing your knowledge with students and career switchers.</p>
        <p>Our team verifies all applicants for professional domain expertise and identity. We typically complete reviews within <strong>${escapeHtml(vars.turnaround_time || "2-3 business days")}</strong>.</p>
      `;

      const summaryCard = {
        title: "Application Reference",
        items: [
          { label: "Application ID", value: vars.application_id || "Received" },
          { label: "Review Status", value: "Under Review", isHighlight: true },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Application Received",
        heading: "We Have Received Your Application",
        introText: "Our admissions committee is reviewing your submission.",
        summaryCard,
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 17. Mentor Application Approved
  {
    id: "mentor.application_approved",
    name: "Mentor Application Approved",
    category: "mentor",
    isSystemCritical: true,
    isActive: true,
    subject: "Your MentorMaze mentor application is approved!",
    previewText: "Welcome aboard! Set up your availability to start accepting bookings.",
    variables: [
      { key: "user_name", description: "Mentor's name", sampleValue: "Priya" },
      { key: "setup_url", description: "Link to configure calendar", sampleValue: "https://mentormaze.aitathastu.com/mentor/availability" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const setupUrl = vars.setup_url || `${EMAIL_TOKENS.brand.officialDomain}/mentor/availability`;

      const contentHtml = `
        <p>Congratulations! Your application to become an official mentor on MentorMaze has been approved by our review committee.</p>
        <p>Your profile is now visible to students and professionals across the AI Tathastu ecosystem.</p>
        <p><strong>Next Steps to Start Mentoring:</strong></p>
        <ol style="margin: 0 0 20px 0; padding-left: 20px; line-height: 26px;">
          <li><strong>Set Availability:</strong> Configure the days and time slots when you are open for sessions.</li>
          <li><strong>Review Pricing:</strong> Check your 15, 30, and 60-minute session pricing tiers.</li>
          <li><strong>Connect Calendar:</strong> Sync your Google Calendar to prevent scheduling conflicts.</li>
        </ol>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Application Approved",
        heading: "Welcome to the Mentor Community!",
        introText: "Your mentor profile is officially verified and approved.",
        primaryCta: {
          label: "Configure Availability & Go Live",
          url: setupUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 18. Mentor Application Status Update (Needs Info / Rejected)
  {
    id: "mentor.application_status_update",
    name: "Mentor Application Status Update",
    category: "mentor",
    isSystemCritical: true,
    isActive: true,
    subject: "An update regarding your MentorMaze mentor application",
    previewText: "Review important status feedback on your mentor application.",
    variables: [
      { key: "user_name", description: "Applicant's name", sampleValue: "Priya" },
      { key: "status_title", description: "Status heading", sampleValue: "Additional Information Required" },
      { key: "admin_feedback", description: "Admin feedback message", sampleValue: "Please update your LinkedIn profile URL or provide a corporate email verification." },
      { key: "action_url", description: "URL to update application", sampleValue: "https://mentormaze.aitathastu.com/apply" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const statusTitle = vars.status_title || "Application Update";
      const feedback = vars.admin_feedback || "Our review committee has updated the status of your mentor application.";
      const actionUrl = vars.action_url || `${EMAIL_TOKENS.brand.officialDomain}/apply`;

      const contentHtml = `
        <p>Our review team has evaluated your mentor application and provided the following feedback:</p>
        <div style="background-color:${EMAIL_TOKENS.colors.cream100};border-left:4px solid ${EMAIL_TOKENS.colors.forest800};padding:14px 18px;margin:18px 0;border-radius:4px;font-style:italic;color:${EMAIL_TOKENS.colors.ink950};">
          ${escapeHtml(feedback)}
        </div>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Application Update",
        heading: statusTitle,
        introText: "Please review the notes from our admissions team.",
        primaryCta: {
          label: "Update Application Details",
          url: actionUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 19. New Booking Request for Mentor
  {
    id: "booking.requested_mentor",
    name: "New Booking Request (Mentor)",
    category: "mentor",
    isSystemCritical: true,
    isActive: true,
    subject: "You have a new mentorship booking request from {{student_name}}",
    previewText: "A student has requested a mentorship session. Review their agenda and confirm.",
    variables: [
      { key: "mentor_name", description: "Mentor's name", sampleValue: "Priya" },
      { key: "student_name", description: "Student's name", sampleValue: "Anant Kumar" },
      { key: "session_type", description: "Session mode", sampleValue: "1:1 Mentorship (30 min)" },
      { key: "session_date", description: "Requested date", sampleValue: "Saturday, November 15, 2026" },
      { key: "session_time", description: "Requested time", sampleValue: "4:00 PM IST" },
      { key: "discussion_points", description: "Student discussion goals", sampleValue: "Distributed systems system design and SDE roadmap review" },
      { key: "action_url", description: "Review request URL", sampleValue: "https://mentormaze.aitathastu.com/mentor/dashboard" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const actionUrl = vars.action_url || `${EMAIL_TOKENS.brand.officialDomain}/mentor/dashboard`;

      const contentHtml = `
        <p><strong>${escapeHtml(vars.student_name || "A mentee")}</strong> has requested a mentorship session with you.</p>
        ${
          vars.discussion_points
            ? `<p><strong>Student's Goals / Discussion Points:</strong><br />
               <span style="font-style:italic;color:${EMAIL_TOKENS.colors.ink700};">&ldquo;${escapeHtml(vars.discussion_points)}&rdquo;</span></p>`
            : ""
        }
      `;

      const summaryCard = {
        title: "Session Request Details",
        items: [
          { label: "Student", value: vars.student_name || "Student" },
          { label: "Type", value: vars.session_type || "1:1 Session" },
          { label: "Date & Time", value: `${vars.session_date || "Date"} at ${vars.session_time || "Time"}` },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "New Booking Request",
        heading: "New Session Booking Request",
        introText: `A mentee has booked a slot on your calendar.`,
        summaryCard,
        primaryCta: {
          label: "Review & Manage Booking",
          url: actionUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 20. Mentor Session Reminder
  {
    id: "booking.reminder_mentor",
    name: "Upcoming Session Reminder (Mentor)",
    category: "mentor",
    isSystemCritical: true,
    isActive: true,
    subject: "Reminder: You have a mentorship session with {{student_name}} in {{time_remaining}}",
    previewText: "Your mentorship session starts soon. Access your video room.",
    variables: [
      { key: "mentor_name", description: "Mentor name", sampleValue: "Priya" },
      { key: "student_name", description: "Student name", sampleValue: "Anant" },
      { key: "time_remaining", description: "Time to session", sampleValue: "15 minutes" },
      { key: "session_time", description: "Session start time", sampleValue: "4:00 PM IST" },
      { key: "meeting_url", description: "Direct room URL", sampleValue: "https://mentormaze.aitathastu.com/sessions/bk-1/live" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const meetingUrl = vars.meeting_url || `${EMAIL_TOKENS.brand.officialDomain}/mentor/dashboard`;

      const contentHtml = `
        <p>This is a reminder that your mentorship session with <strong>${escapeHtml(vars.student_name || "your mentee")}</strong> begins in <strong>${escapeHtml(vars.time_remaining || "soon")}</strong> at <strong>${escapeHtml(vars.session_time || "the scheduled time")}</strong>.</p>
        <p>Click below to launch the video room. You will have access to the collaborative session notes and student-submitted agenda.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Mentor Reminder",
        heading: "Upcoming Session Reminder",
        introText: `Your session with ${vars.student_name || "your mentee"} is about to start.`,
        primaryCta: {
          label: "Open Video Room",
          url: meetingUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 21. Mentor Earnings / Settlement Summary
  {
    id: "mentor.earnings_summary",
    name: "Mentor Earnings Summary",
    category: "mentor",
    isSystemCritical: false,
    isActive: true,
    subject: "Your MentorMaze session update & earnings summary — {{period}}",
    previewText: "Review your verified session completions and payout ledger.",
    variables: [
      { key: "mentor_name", description: "Mentor name", sampleValue: "Priya" },
      { key: "period", description: "Reporting period", sampleValue: "November 2026" },
      { key: "completed_sessions", description: "Total completed sessions count", sampleValue: "12" },
      { key: "gross_earnings", description: "Gross session fees", sampleValue: "₹4,800" },
      { key: "net_payout", description: "Net payout after platform commission", sampleValue: "₹4,080" },
      { key: "settlement_status", description: "Payout status", sampleValue: "Settled to Bank Account" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>Here is your verified session and earnings summary for <strong>${escapeHtml(vars.period || "this period")}</strong>. Thank you for guiding mentees on MentorMaze!</p>
      `;

      const summaryCard = {
        title: "Earnings Breakdown",
        items: [
          { label: "Completed Sessions", value: vars.completed_sessions || "0" },
          { label: "Gross Fees", value: vars.gross_earnings || "₹0" },
          { label: "Net Payout", value: vars.net_payout || "₹0", isHighlight: true },
          { label: "Settlement Status", value: vars.settlement_status || "Pending", isHighlight: true },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Earnings Ledger",
        heading: "Your Session & Earnings Update",
        introText: "Detailed payout summary for your mentorship sessions.",
        summaryCard,
        primaryCta: {
          label: "View Mentor Financial Ledger",
          url: `${EMAIL_TOKENS.brand.officialDomain}/mentor/dashboard`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // ==========================================
  // CATEGORY D — PAYMENTS, SUPPORT, AND SYSTEM
  // ==========================================

  // 22. Payment Successful
  {
    id: "payment.successful",
    name: "Payment Receipt",
    category: "payment",
    isSystemCritical: true,
    isActive: true,
    subject: "Receipt for your MentorMaze booking — {{order_id}}",
    previewText: "Thank you for your payment. Your mentorship session is secured.",
    variables: [
      { key: "user_name", description: "Customer name", sampleValue: "Anant" },
      { key: "order_id", description: "Order / Payment transaction ID", sampleValue: "ORDER_92817" },
      { key: "amount", description: "Paid amount in INR", sampleValue: "₹249" },
      { key: "session_name", description: "Service purchased", sampleValue: "1:1 Mentorship Session (30 mins)" },
      { key: "payment_method", description: "Payment gateway method", sampleValue: "UPI / Net Banking" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>Thank you for your payment. This email serves as your official payment receipt for your mentorship booking on MentorMaze.</p>
      `;

      const summaryCard = {
        title: "Payment Receipt",
        items: [
          { label: "Order ID", value: vars.order_id || "N/A" },
          { label: "Service", value: vars.session_name || "Mentorship Session" },
          { label: "Payment Method", value: vars.payment_method || "Online Payment" },
          { label: "Amount Paid", value: vars.amount || "₹0", isHighlight: true },
          { label: "Status", value: "Paid Successfully", isHighlight: true },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Payment Receipt",
        heading: "Payment Receipt",
        introText: "Your transaction was completed successfully.",
        summaryCard,
        primaryCta: {
          label: "View Invoices & Bookings",
          url: `${EMAIL_TOKENS.brand.officialDomain}/dashboard/sessions`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 23. Payment Failed
  {
    id: "payment.failed",
    name: "Payment Failed Alert",
    category: "payment",
    isSystemCritical: true,
    isActive: true,
    subject: "Payment could not be processed for your booking — {{order_id}}",
    previewText: "Your booking transaction could not be completed. Retry payment.",
    variables: [
      { key: "user_name", description: "Customer name", sampleValue: "Anant" },
      { key: "order_id", description: "Order ID", sampleValue: "ORDER_92817" },
      { key: "failure_reason", description: "Reason from gateway", sampleValue: "Transaction declined by issuing bank" },
      { key: "retry_url", description: "Link to retry payment", sampleValue: "https://mentormaze.aitathastu.com/explore" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const retryUrl = vars.retry_url || `${EMAIL_TOKENS.brand.officialDomain}/explore`;

      const contentHtml = `
        <p>We were unable to process your payment for order <strong>${escapeHtml(vars.order_id || "N/A")}</strong>.</p>
        <p><strong>Gateway Note:</strong> ${escapeHtml(vars.failure_reason || "Payment was declined or cancelled.")}</p>
        <p>No funds were charged to your account. You can retry the transaction using another payment method such as UPI, debit/credit card, or net banking.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Payment Alert",
        heading: "Payment Unsuccessful",
        introText: "Your payment attempt could not be finalized.",
        primaryCta: {
          label: "Retry Payment",
          url: retryUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 24. Refund Completed
  {
    id: "payment.refund_completed",
    name: "Refund Completed",
    category: "payment",
    isSystemCritical: true,
    isActive: true,
    subject: "Refund processed for your booking — {{order_id}}",
    previewText: "Your refund has been completed to your original payment method.",
    variables: [
      { key: "user_name", description: "Customer name", sampleValue: "Anant" },
      { key: "order_id", description: "Order reference", sampleValue: "ORDER_92817" },
      { key: "refund_amount", description: "Refunded sum in INR", sampleValue: "₹249" },
      { key: "refund_arn", description: "Bank ARN / Reference number", sampleValue: "ARN-82910482910" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>Your refund of <strong>${escapeHtml(vars.refund_amount || "the booking amount")}</strong> for order <strong>${escapeHtml(vars.order_id || "N/A")}</strong> has been successfully processed.</p>
        <p>Depending on your bank or payment provider, credit reflects within 3-5 business days.</p>
      `;

      const summaryCard = {
        title: "Refund Details",
        items: [
          { label: "Order Reference", value: vars.order_id || "N/A" },
          { label: "Refund Amount", value: vars.refund_amount || "₹0", isHighlight: true },
          { label: "Bank Reference", value: vars.refund_arn || "Processed via Gateway" },
          { label: "Status", value: "Refund Completed" },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Refund Completed",
        heading: "Refund Successfully Processed",
        introText: "Funds have been returned to your original payment method.",
        summaryCard,
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 25. Support Ticket Created
  {
    id: "support.ticket_created",
    name: "Support Ticket Created",
    category: "support",
    isSystemCritical: true,
    isActive: true,
    subject: "Support Request Received — [{{ticket_number}}] {{ticket_subject}}",
    previewText: "We have received your support inquiry and assigned it to our care team.",
    variables: [
      { key: "user_name", description: "Customer name", sampleValue: "Anant" },
      { key: "ticket_number", description: "Ticket reference number", sampleValue: "MM-2026-1042" },
      { key: "ticket_subject", description: "Ticket subject", sampleValue: "Issue joining LiveKit video room" },
      { key: "category", description: "Issue category", sampleValue: "Technical Problem" },
      { key: "ticket_url", description: "Secure link to view ticket status", sampleValue: "https://mentormaze.aitathastu.com/support" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const ticketUrl = vars.ticket_url || `${EMAIL_TOKENS.brand.officialDomain}/support`;

      const contentHtml = `
        <p>Thank you for contacting MentorMaze Support. Your ticket has been logged in our system and an agent has been assigned.</p>
        <p>We aim to resolve all standard requests within 6 hours. You can reply directly to this email to add more information or check its progress using the link below.</p>
      `;

      const summaryCard = {
        title: "Ticket Information",
        items: [
          { label: "Ticket Number", value: vars.ticket_number || "MM-2026-XXXX", isHighlight: true },
          { label: "Category", value: vars.category || "General Support" },
          { label: "Status", value: "Open (Assigned)" },
        ],
      };

      const shellOpts = {
        previewText,
        announcementLabel: "Support Request",
        heading: "Support Ticket Logged",
        introText: `Your request "${vars.ticket_subject || "Support Inquiry"}" is under review.`,
        summaryCard,
        primaryCta: {
          label: "View Ticket & Responses",
          url: ticketUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 26. Support Ticket Reply
  {
    id: "support.ticket_reply",
    name: "Support Ticket Reply",
    category: "support",
    isSystemCritical: true,
    isActive: true,
    subject: "Update on Support Request [{{ticket_number}}] — {{ticket_subject}}",
    previewText: "A support agent has replied to your MentorMaze support ticket.",
    variables: [
      { key: "user_name", description: "Customer name", sampleValue: "Anant" },
      { key: "ticket_number", description: "Ticket reference number", sampleValue: "MM-2026-1042" },
      { key: "ticket_subject", description: "Subject", sampleValue: "Issue joining LiveKit video room" },
      { key: "agent_name", description: "Support agent name", sampleValue: "MentorMaze Support" },
      { key: "reply_message", description: "Customer-facing reply text", sampleValue: "We have refreshed your session token and verified your browser permissions." },
      { key: "ticket_url", description: "Direct ticket thread link", sampleValue: "https://mentormaze.aitathastu.com/support" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const ticketUrl = vars.ticket_url || `${EMAIL_TOKENS.brand.officialDomain}/support`;

      const contentHtml = `
        <p><strong>${escapeHtml(vars.agent_name || "Support Team")}</strong> replied to your ticket:</p>
        <div style="background-color:${EMAIL_TOKENS.colors.cream100};border-left:4px solid ${EMAIL_TOKENS.colors.forest800};padding:16px 20px;margin:20px 0;border-radius:6px;font-size:15px;line-height:24px;color:${EMAIL_TOKENS.colors.ink950};">
          ${escapeHtml(vars.reply_message || "Please check our latest response on your support portal.")}
        </div>
        <p>To respond, simply reply to this email or visit the support portal.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Agent Reply",
        heading: `New Response on Ticket ${vars.ticket_number || ""}`,
        introText: `Regarding "${vars.ticket_subject || "your inquiry"}"`,
        primaryCta: {
          label: "View Conversation in Portal",
          url: ticketUrl,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 27. Support Ticket Resolved
  {
    id: "support.ticket_resolved",
    name: "Support Ticket Resolved",
    category: "support",
    isSystemCritical: true,
    isActive: true,
    subject: "Resolved: Support Ticket [{{ticket_number}}] — {{ticket_subject}}",
    previewText: "Your support request has been marked as resolved.",
    variables: [
      { key: "user_name", description: "Customer name", sampleValue: "Anant" },
      { key: "ticket_number", description: "Ticket reference", sampleValue: "MM-2026-1042" },
      { key: "ticket_subject", description: "Subject", sampleValue: "Issue joining LiveKit video room" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);

      const contentHtml = `
        <p>Your support ticket <strong>${escapeHtml(vars.ticket_number || "MM-2026-XXXX")}</strong> has been marked as <strong>Resolved</strong>.</p>
        <p>If you need further help or if the issue persists, simply reply to this email to automatically reopen the ticket.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Ticket Resolved",
        heading: "Support Request Resolved",
        introText: `Ticket ${vars.ticket_number || ""} has been completed.`,
        primaryCta: {
          label: "View Support History",
          url: `${EMAIL_TOKENS.brand.officialDomain}/support`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 28. Admin Announcement
  {
    id: "system.admin_announcement",
    name: "Admin Announcement",
    category: "system",
    isSystemCritical: false,
    isActive: true,
    subject: "{{announcement_title}} — MentorMaze Announcement",
    previewText: "Important community and platform updates from the MentorMaze team.",
    variables: [
      { key: "user_name", description: "Recipient name", sampleValue: "Community Member" },
      { key: "announcement_title", description: "Announcement headline", sampleValue: "Introducing System Design Mock Interviews 2.0" },
      { key: "announcement_body", description: "Rich announcement content", sampleValue: "We have updated our interactive canvas and rubric scoring tools to provide deeper post-session feedback." },
      { key: "action_url", description: "Call to action link", sampleValue: "https://mentormaze.aitathastu.com" },
      { key: "action_label", description: "Call to action button text", sampleValue: "Read Full Announcement" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const title = vars.announcement_title || "Important Announcement";
      const body = vars.announcement_body || "We have an exciting update for the MentorMaze community.";

      const contentHtml = `
        <p>${escapeHtml(body)}</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Platform Announcement",
        heading: title,
        introText: "From the MentorMaze and AI Tathastu leadership team.",
        primaryCta: vars.action_url
          ? {
              label: vars.action_label || "Explore What's New",
              url: vars.action_url,
            }
          : undefined,
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 29. Product Updates Newsletter
  {
    id: "newsletter.product_update",
    name: "Product Updates Newsletter",
    category: "system",
    isSystemCritical: false,
    isActive: true,
    subject: "MentorMaze Monthly: New Mentors, Mock Interview Tracks & Updates",
    previewText: "Catch up on new mentors joining our community and latest feature releases.",
    variables: [
      { key: "user_name", description: "Subscriber name", sampleValue: "Anant" },
      { key: "newsletter_headline", description: "Main feature highlight", sampleValue: "50+ Senior Tech Mentors from FAANG Join MentorMaze" },
      { key: "newsletter_content", description: "Main story body", sampleValue: "This month we expanded our mock interview catalog with dedicated tracks for distributed systems and DevOps." },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const headline = vars.newsletter_headline || "Monthly Product & Community Roundup";
      const story = vars.newsletter_content || "Here is what is new on MentorMaze this month.";

      const contentHtml = `
        <h3 style="font-family:${EMAIL_TOKENS.typography.serifHeading};color:${EMAIL_TOKENS.colors.forest900};margin:16px 0 8px 0;">${escapeHtml(headline)}</h3>
        <p>${escapeHtml(story)}</p>
        <p>Explore our growing roster of mentors and schedule your next prep session before slots fill up.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Newsletter",
        heading: "MentorMaze Monthly Digest",
        introText: "Insights, mentorship guides, and platform updates.",
        primaryCta: {
          label: "Browse New Mentors",
          url: `${EMAIL_TOKENS.brand.officialDomain}/explore`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 30. Account Deletion Request Confirmation
  {
    id: "account.deletion_requested",
    name: "Account Deletion Request",
    category: "auth",
    isSystemCritical: true,
    isActive: true,
    subject: "Account deletion request received for {{user_email}}",
    previewText: "Security confirmation regarding your MentorMaze account deletion request.",
    variables: [
      { key: "user_name", description: "User's display name", sampleValue: "Anant" },
      { key: "user_email", description: "Account email address", sampleValue: "anant@example.com" },
      { key: "grace_period", description: "Cancellation grace window", sampleValue: "7 days" },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const gracePeriod = vars.grace_period || "7 days";

      const contentHtml = `
        <p>We received a request to permanently delete your MentorMaze account associated with <strong>${escapeHtml(vars.user_email || "your email")}</strong>.</p>
        <p>Your account has been scheduled for permanent erasure. You have a <strong>${escapeHtml(gracePeriod)}</strong> grace period to cancel this request by signing back into your account.</p>
        <p>After this window, all your personal data, session history, and certificates will be irreversibly removed in accordance with our privacy policy.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Account Notice",
        heading: "Account Deletion Requested",
        introText: "Notice regarding your personal data and account deletion.",
        primaryCta: {
          label: "Cancel Deletion & Keep Account",
          url: `${EMAIL_TOKENS.brand.officialDomain}/login`,
        },
        contentHtml,
        secondaryInfoHtml: `If you did not request account deletion, please contact <a href="mailto:${EMAIL_TOKENS.brand.supportEmail}" style="color:${EMAIL_TOKENS.colors.forest800};font-weight:600;">${EMAIL_TOKENS.brand.supportEmail}</a> immediately.`,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },

  // 31. Consent and Privacy Policy Updates
  {
    id: "privacy.consent_update",
    name: "Privacy & Consent Policy Update",
    category: "system",
    isSystemCritical: true,
    isActive: true,
    subject: "Important updates to MentorMaze Privacy Policy and Terms",
    previewText: "Please review the updated privacy terms for MentorMaze and AI Tathastu.",
    variables: [
      { key: "user_name", description: "User name", sampleValue: "Anant" },
      { key: "effective_date", description: "Date updates take effect", sampleValue: "December 1, 2026" },
      { key: "summary_of_changes", description: "Brief bullet points of changes", sampleValue: "Clarified data retention periods, updated payment refund timelines, and outlined multi-cluster video infrastructure privacy safeguards." },
    ],
    htmlBody: "",
    textBody: "",
    render(vars) {
      const subject = interpolateVariables(this.subject, vars);
      const previewText = interpolateVariables(this.previewText, vars);
      const effectiveDate = vars.effective_date || "Upcoming";
      const summary = vars.summary_of_changes || "We have updated our terms to better reflect our multi-cluster video architecture and data security controls.";

      const contentHtml = `
        <p>At MentorMaze and AI Tathastu, we are committed to transparent, privacy-first mentorship. We are updating our Privacy Policy and Terms of Service, effective <strong>${escapeHtml(effectiveDate)}</strong>.</p>
        <p><strong>Key Highlights:</strong></p>
        <p style="background-color:${EMAIL_TOKENS.colors.cream100};padding:14px 18px;border-left:4px solid ${EMAIL_TOKENS.colors.forest800};border-radius:4px;color:${EMAIL_TOKENS.colors.ink950};">
          ${escapeHtml(summary)}
        </p>
        <p>Your continued use of MentorMaze after this date indicates your agreement to the updated terms.</p>
      `;

      const shellOpts = {
        previewText,
        announcementLabel: "Legal Notice",
        heading: "Updates to Our Privacy Policy",
        introText: "We have updated our privacy terms for greater clarity and protection.",
        primaryCta: {
          label: "Read Full Privacy Policy",
          url: `${EMAIL_TOKENS.brand.officialDomain}/privacy`,
        },
        contentHtml,
      };

      return {
        subject,
        previewText,
        html: renderEmailShell(shellOpts),
        text: renderPlainText(shellOpts),
      };
    },
  },
];

export const TEMPLATE_MAP = new Map<string, TemplateDefinition>();
TEMPLATE_DEFINITIONS.forEach((t) => TEMPLATE_MAP.set(t.id, t));

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return TEMPLATE_MAP.get(id);
}

export function getAllTemplates(): TemplateDefinition[] {
  return TEMPLATE_DEFINITIONS;
}

