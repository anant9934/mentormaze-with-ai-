import { redirect } from "next/navigation";

export default function DashboardMockInterviewsPage() {
  redirect("/dashboard/mentorship?tab=sessions");
}
