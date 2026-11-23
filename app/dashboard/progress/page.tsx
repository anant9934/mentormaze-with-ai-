import { redirect } from "next/navigation";

export default function ProgressDashboardPage() {
  redirect("/dashboard/mentorship?tab=goals");
}
