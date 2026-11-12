import { TEMPLATE_DEFINITIONS } from "../lib/email/templates/registry";
import { sendEmailDirect } from "../lib/email/transport";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendAllTemplates() {
  const recipientEmail = "720anant@gmail.com";
  const recipientName = "Anant Kumar";

  console.log(`Starting transmission of all ${TEMPLATE_DEFINITIONS.length} email templates to: ${recipientEmail}\n`);

  const results: { id: string; name: string; subject: string; success: boolean; messageId?: string; error?: string }[] = [];

  for (let i = 0; i < TEMPLATE_DEFINITIONS.length; i++) {
    const template = TEMPLATE_DEFINITIONS[i];
    console.log(`[${i + 1}/${TEMPLATE_DEFINITIONS.length}] Preparing: ${template.name} (${template.id})...`);

    // Build sample variables tailored to Anant
    const sampleVars: Record<string, any> = {
      user_name: recipientName,
      user_email: recipientEmail,
      mentor_name: "Priya Sharma",
      student_name: recipientName,
      target_role: "Software Development Engineer (Distributed Systems)",
      booking_reference: "BK-82910",
      order_id: "CF_ORDER_99214",
      amount: "₹249",
      ticket_number: "MM-2026-1042",
      ticket_subject: "LiveKit video room connection assistance",
      announcement_title: "Introducing System Design Mock Interviews 2.0",
      announcement_body: "We have updated our interactive canvas and rubric scoring tools to provide deeper post-session feedback.",
      action_url: "https://mentormaze.aitathastu.com",
      action_label: "Explore What's New",
      newsletter_headline: "50+ Senior Tech Mentors from FAANG Join MentorMaze",
      newsletter_content: "This month we expanded our mock interview catalog with dedicated tracks for distributed systems, system design, and DevOps.",
      grace_period: "7 days",
      effective_date: "December 1, 2026",
      summary_of_changes: "Clarified data retention periods, updated payment refund timelines, and outlined multi-cluster video infrastructure privacy safeguards.",
      status_title: "Additional Information Required",
      admin_feedback: "Please provide your corporate LinkedIn profile or verified GitHub link to complete mentor approval.",
      session_date: "Saturday, November 22, 2026",
      session_time: "4:00 PM - 5:00 PM IST",
      session_type: "1:1 Mentorship Session (Deep-Dive)",
      meeting_url: "https://mentormaze.aitathastu.com/sessions/bk-82910/live",
      time_remaining: "1 hour",
      previous_time: "Friday, Nov 21 at 4:00 PM IST",
      new_date: "Saturday, Nov 22, 2026",
      new_time: "5:00 PM IST",
      reason: "Mentor schedule conflict",
      cancellation_initiator: "Mentor",
      refund_status: "100% Refund Initiated to Original UPI/Bank Account",
      session_notes_url: "https://mentormaze.aitathastu.com/dashboard/sessions",
      overall_score: "8.8 / 10",
      report_url: "https://mentormaze.aitathastu.com/mock-interviews/report/1",
      application_id: "APP-5921",
      turnaround_time: "2-3 business days",
      setup_url: "https://mentormaze.aitathastu.com/mentor/availability",
      action_url_app: "https://mentormaze.aitathastu.com/apply",
      discussion_points: "Distributed systems system design, caching architecture, and SDE roadmap review.",
      period: "November 2026",
      completed_sessions: "12",
      gross_earnings: "₹4,800",
      net_payout: "₹4,080",
      settlement_status: "Settled to Bank Account",
      session_name: "1:1 Mentorship Session (30 mins)",
      payment_method: "UPI (Google Pay / PhonePe)",
      failure_reason: "Transaction declined by issuing bank",
      retry_url: "https://mentormaze.aitathastu.com/explore",
      refund_amount: "₹249",
      refund_arn: "ARN-82910482910",
      category: "Technical Problem",
      ticket_url: "https://mentormaze.aitathastu.com/support",
      agent_name: "MentorMaze Support",
      reply_message: "We have refreshed your LiveKit token and verified browser permissions. Please refresh the page.",
      verification_url: "https://mentormaze.aitathastu.com/verify-email?token=sec_verify_9210",
      reset_url: "https://mentormaze.aitathastu.com/reset-password?token=sec_reset_8819",
      expires_in: "24 hours",
      timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      device_browser: "Chrome on macOS (Apple Silicon)",
      ip_address: "49.36.12.8",
      login_time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      completion_percentage: "45%",
      missing_fields: "Target Role, Key Skills, and Graduation Year",
      mentor_names: "Priya Sharma (Senior SWE @ Microsoft), Vikram Patel (Principal Architect @ Google)",
    };

    // Fill in any other defined template variables
    template.variables.forEach((v) => {
      if (!sampleVars[v.key]) {
        sampleVars[v.key] = v.sampleValue;
      }
    });

    const rendered = template.render(sampleVars);

    try {
      const sendResult = await sendEmailDirect({
        to: recipientEmail,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        category: template.category,
        templateId: template.id,
      });

      if (sendResult.success) {
        console.log(`  ✓ SENT: "${rendered.subject}" (Message ID: ${sendResult.messageId})`);
        results.push({
          id: template.id,
          name: template.name,
          subject: rendered.subject,
          success: true,
          messageId: sendResult.messageId,
        });
      } else {
        console.error(`  ✗ FAILED: "${rendered.subject}" (Error: ${sendResult.error})`);
        results.push({
          id: template.id,
          name: template.name,
          subject: rendered.subject,
          success: false,
          error: sendResult.error,
        });
      }
    } catch (err: any) {
      console.error(`  ✗ EXCEPTION: ${err.message}`);
      results.push({
        id: template.id,
        name: template.name,
        subject: rendered.subject,
        success: false,
        error: err.message,
      });
    }

    // Small delay between transmissions to respect Gmail SMTP rate controls
    await sleep(750);
  }

  console.log("\n=======================================================");
  console.log("TRANSMISSION SUMMARY");
  console.log("=======================================================");
  const successCount = results.filter((r) => r.success).length;
  console.log(`Total Templates: ${results.length}`);
  console.log(`Successfully Delivered: ${successCount}`);
  console.log(`Failed: ${results.length - successCount}`);
  console.log(`Recipient: ${recipientEmail}`);

  return results;
}

sendAllTemplates()
  .then((res) => {
    process.exit(res.every((r) => r.success) ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal error running dispatch script:", err);
    process.exit(1);
  });
