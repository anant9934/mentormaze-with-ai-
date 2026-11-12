# MentorMaze — Admin Email Management Guide

## 1. Access & Clearance

- **Route**: `https://mentormaze.aitathastu.com/admin/communications/email`
- **Required Clearance**: `role = 'admin'` or `role = 'super_admin'` enforced at the server-session level via [`lib/auth/server-auth.ts`](file:///Users/quantum/Desktop/MENTOR%20MAZE/lib/auth/server-auth.ts).
- Client-side tampering is blocked with strict database query validation.

---

## 2. Interface Tabs & Functional Capabilities

### Tab 1: Overview
- **Real-Time Counters**: Displays Total Queued, Total Sent, Last 24 Hours, and Failed / Bounced emails.
- **SMTP Gateway Badge**: Real-time health status indicator for the Gmail SMTP connection.
- **Policy Summary**: Summarizes compliance standards (Indian anti-spam, XSS sanitization, transactional non-suppression).

### Tab 2: Template Management
- **Search & Filter**: Search 31 templates by ID, name, or subject. Filter by category pills (`auth`, `student`, `mentor`, `payment`, `support`, `system`).
- **Interactive Previewer**:
  - **Desktop View**: Renders responsive table layout inside a 620px viewport.
  - **Mobile View**: Simulates mobile client rendering (375px viewport).
  - **Plain Text View**: Displays generated plain-text alternative.
- **Template Editor**: Edit subject line, preview preheader text, and customized HTML content.
- **Variable Dictionary**: Displays available `{{key}}` tokens with sample values for easy reference.
- **Restore Defaults**: One-click rollback to reset custom template overrides to the master code registry.
- **System-Critical Guard**: Protects security templates (`auth.password_reset`, `auth.email_verification`, etc.) from being disabled.

### Tab 3: Automated Workflows
- **Table View**: Inspects all 24 registered event workflows.
- **Toggle Switches**: Enable or pause workflows instantly without redeploying code.
- **Execution Tracking**: Displays total execution count and timestamp of last trigger.

### Tab 4: Delivery Activity Logs
- **Audit Table**: Shows recipient email, template ID, subject, attempt count, queue status, and timestamp.
- **Status Filters**: Filter logs by `All`, `Queued`, `Sent`, `Failed`, or `Bounced`.
- **Search**: Fast text search across recipient emails and subject lines.

### Tab 5: Failed Queue & Dead-Letter Management
- **Safe Diagnostics**: Inspects transmission error messages with sensitive credentials redacted.
- **Retry Action**: Triggers immediate re-dispatch of transient failures.
- **Cancel Action**: Marks queued or stuck emails as cancelled.

### Tab 6: SMTP Diagnostics
- **Connection Test**: Executes live `transporter.verify()` against Gmail SMTP.
- **Live Test Sender**: Dispatches a real test email to any authorized address using actual template variables.

