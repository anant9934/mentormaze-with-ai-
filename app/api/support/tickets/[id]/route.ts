import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { emailService } from "@/lib/email/service";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { TicketStatus, TicketPriority } from "@/lib/email/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const data = await emailService.getSupportTicket(params.id);

    if (!data) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    const isAdmin = session?.role === "admin" || session?.role === "super_admin";

    // Non-admins can only see their own tickets
    if (!isAdmin && session && data.ticket.userId !== session.id && data.ticket.userEmail !== session.email) {
      return NextResponse.json({ error: "Forbidden: Not your ticket" }, { status: 403 });
    }

    // Filter out internal notes for non-admin viewers
    const filteredMessages = isAdmin
      ? data.messages
      : data.messages.filter((m) => !m.isInternalNote);

    return NextResponse.json({
      success: true,
      ticket: data.ticket,
      messages: filteredMessages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load support ticket details" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    const { message, isInternalNote } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const ticketData = await emailService.getSupportTicket(params.id);
    if (!ticketData) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const isAdmin = session?.role === "admin" || session?.role === "super_admin";
    const senderRole = isAdmin ? "support_agent" : "user";
    const senderName = session?.displayName || (isAdmin ? "MentorMaze Support" : ticketData.ticket.userName);

    // Only admins can post internal notes
    const actualInternalNote = Boolean(isInternalNote && isAdmin);

    const newMessage = await emailService.replySupportTicket(
      params.id,
      message,
      {
        userId: session?.id,
        name: senderName,
        role: senderRole,
      },
      actualInternalNote
    );

    // If a support agent replied (and it's not an internal note), send an email notification to user!
    if (isAdmin && !actualInternalNote) {
      await dispatchEmailEvent({
        eventType: "support.ticket_replied",
        recipient: {
          email: ticketData.ticket.userEmail,
          name: ticketData.ticket.userName,
          userId: ticketData.ticket.userId,
        },
        variables: {
          ticket_number: ticketData.ticket.ticketNumber,
          ticket_subject: ticketData.ticket.subject,
          agent_name: senderName,
          reply_message: message,
          ticket_url: `https://mentormaze.aitathastu.com/support?ticket=${ticketData.ticket.id}`,
        },
      });
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to post message" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const isAdmin = session?.role === "admin" || session?.role === "super_admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { status, priority, assignedTo } = body;

    const updated = await emailService.updateTicketStatus(
      params.id,
      status as TicketStatus,
      priority as TicketPriority,
      assignedTo
    );

    // If resolved, dispatch ticket resolved email
    if (status === "resolved") {
      await dispatchEmailEvent({
        eventType: "support.ticket_resolved",
        recipient: {
          email: updated.userEmail,
          name: updated.userName,
          userId: updated.userId,
        },
        variables: {
          ticket_number: updated.ticketNumber,
          ticket_subject: updated.subject,
        },
      });
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update ticket" }, { status: 500 });
  }
}
