/**
 * MentorMaze Meeting Intelligence UUID Helper
 * Official Platform: MentorMaze by AI Tathastu (https://mentormaze.aitathastu.com)
 *
 * Deterministically maps arbitrary booking IDs (e.g. "booking-1", "booking-1795523874740")
 * and user IDs into valid PostgreSQL UUID format to avoid syntax errors on casting.
 */

export function toBookingUuid(id: string | null | undefined): string {
  if (!id || typeof id !== "string") {
    return "60000000-0000-0000-0000-000000000001";
  }
  const trimmed = id.trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (trimmed === "booking-1" || trimmed === "mm-room-priya-anant-101") {
    return "60000000-0000-0000-0000-000000000001";
  }
  if (trimmed === "booking-2") {
    return "60000000-0000-0000-0000-000000000002";
  }
  // Deterministic UUID for any other arbitrary booking string
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, "0");
  return `60000000-0000-4000-8000-${hex.slice(0, 12)}`;
}

export function toUserUuid(id: string | null | undefined, fallbackRole: "student" | "mentor" = "student"): string {
  if (!id || typeof id !== "string") {
    return fallbackRole === "mentor"
      ? "00000000-0000-0000-0000-000000000002"
      : "00000000-0000-0000-0000-000000000001";
  }
  const trimmed = id.trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  if (trimmed === "user-student-1" || trimmed === "student-user" || trimmed === "student") {
    return "00000000-0000-0000-0000-000000000001";
  }
  if (trimmed === "user-mentor-priya" || trimmed === "mentor-user" || trimmed === "mentor-priya" || trimmed === "mentor") {
    return "00000000-0000-0000-0000-000000000002";
  }
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex.slice(0, 12)}`;
}
