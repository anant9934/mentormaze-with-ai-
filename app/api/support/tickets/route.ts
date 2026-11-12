import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { emailService } from "@/lib/email/service";
import { dispatchEmailEvent } from "@/lib/email/dispatcher";
import { TicketCategory, TicketPriority, TicketStatus } from "@/lib/email/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as TicketStatus | null;
    const priority = searchParams.get("priority") as TicketPriority | null;

    let tickets = await emailService.getSupportTickets({
      status: status || undefined,
      priority: priority || undefined,
    });

    // If user is not admin, only show their own tickets
    if (session && session.role !== "admin" && session.role !== "super_admin") {
      tickets = tickets.filter((t) => t.userId === session.id || t.userEmail === session.email);
    }

    return NextResponse.json({ success: true, tickets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load support tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const body = await req.json();
    const { userEmail, userName, category, priority, subject, description, bookingId, paymentReference } = body;

    const email = session?.email || userEmail;
    const name = session?.displayName || userName;

    if (!email || !name || !subject || !description) {
      return NextResponse.json({ error: "Missing required support ticket fields" }, { status: 400 });
    }

    const newTicket = await emailService.createSupportTicket({
      userId: session?.id,
      userEmail: email,
      userName: name,
      category: (category as TicketCategory) || "other",
      priority: (priority as TicketPriority) || "medium",
      subject,
      description,
      bookingId,
      paymentReference,
    });

    // Trigger automated email confirmation to user
    await dispatchEmailEvent({
      eventType: "support.ticket_created",
      recipient: {
        email,
        name,
        userId: session?.id,
      },
      variables: {
        ticket_number: newTicket.ticketNumber,
        ticket_subject: newTicket.subject,
        category: newTicket.category,
        ticket_url: `https://mentormaze.aitathastu.com/support?ticket=${newTicket.id}`,
      },
    });

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create support ticket" }, { status: 500 });
  }
}
