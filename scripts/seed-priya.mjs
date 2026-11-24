import { neon } from "@neondatabase/serverless";

const dbUrl = "postgresql://neondb_owner:npg_h6L3cvsjztUO@ep-withered-heart-bebleio4-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require";
const sql = neon(dbUrl);

async function run() {
  const priya = await sql`SELECT * FROM users WHERE email = 'priya.sharma@microsoft.com'`;
  console.log("Priya user:", priya);
  if (!priya.length) {
    console.error("Priya user not found!");
    return;
  }

  const userId = priya[0].id;

  // Ensure role is mentor
  await sql`UPDATE users SET role = 'mentor' WHERE id = ${userId}`;

  const existing = await sql`SELECT * FROM mentor_profiles WHERE user_id = ${userId}`;
  console.log("Existing profile:", existing);

  if (existing.length === 0) {
    const profileId = "30000000-0000-0000-0000-000000000002";
    await sql`
      INSERT INTO mentor_profiles (
        id, user_id, headline, bio, organization, "current_role", years_of_experience,
        location, rating, total_sessions, total_mentees, verification_status, verified_at,
        languages, session_modes, response_time, is_accepting_bookings,
        price_15min_inr, price_30min_inr, price_60min_inr
      ) VALUES (
        ${profileId},
        ${userId},
        'Senior Software Engineer @ Microsoft',
        'Senior Software Engineer at Microsoft. 5+ years building hyperscale cloud infrastructure. Passionate about helping students crack system design interviews and land dream roles.',
        'Microsoft',
        'Senior Software Engineer',
        5,
        'Bengaluru, India',
        4.95,
        210,
        500,
        'approved',
        now(),
        '["English", "Hindi"]',
        '["1:1", "Group"]',
        'Within 4 hours',
        true,
        149,
        249,
        449
      )
    `;
    console.log("Created mentor profile for Priya!");
  } else {
    await sql`UPDATE mentor_profiles SET verification_status = 'approved', is_accepting_bookings = true WHERE user_id = ${userId}`;
    console.log("Updated mentor profile for Priya to approved!");
  }

  // Also seed a sample booking request so the mentor dashboard has active session data!
  const student = await sql`SELECT * FROM users WHERE email = 'anant@example.com'`;
  if (student.length > 0) {
    const profile = await sql`SELECT id FROM mentor_profiles WHERE user_id = ${userId}`;
    const mentorProfileId = profile[0].id;
    
    // Check if bookings exist
    const bookings = await sql`SELECT * FROM bookings WHERE mentor_profile_id = ${mentorProfileId}`;
    if (bookings.length === 0) {
      await sql`
        INSERT INTO bookings (
          id, student_user_id, mentor_profile_id, service_type, session_duration_minutes,
          start_time_utc, end_time_utc, user_timezone, status, price_inr, amount_paise,
          currency, is_free_session, payment_status, student_discussion_points, meeting_room_id
        ) VALUES (
          '60000000-0000-0000-0000-000000000002',
          ${student[0].id},
          ${mentorProfileId},
          'mock_interview',
          45,
          now() + interval '2 hours',
          now() + interval '2 hours 45 minutes',
          'Asia/Kolkata',
          'pending_mentor_confirmation',
          249,
          24900,
          'INR',
          false,
          'captured',
          'System Design Mock Interview: Design a distributed key-value store like Redis/Cassandra.',
          'room-mock-sys-design-456'
        ) ON CONFLICT (id) DO NOTHING;
      `;
      console.log("Seeded pending booking request for Priya!");
    }
  }

  const updatedProfile = await sql`SELECT * FROM mentor_profiles WHERE user_id = ${userId}`;
  console.log("Updated profile:", updatedProfile);
}

run().catch(console.error);
