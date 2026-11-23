import { getDb, initializeDatabaseSchema } from "./index";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  // Prevent predictable demo credentials from ever being seeded in production
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_SEED) {
    console.warn("[Security] Seed aborted: Default demo fixtures are strictly forbidden in production.");
    return;
  }

  const db = getDb();

  const studentPasswordHash = await bcrypt.hash("student123", 10);
  const mentorPasswordHash = await bcrypt.hash("mentor123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  // Insert Users
  await db.execute(sql`
    INSERT INTO users (id, email, password_hash, display_name, avatar_url, role, account_status, timezone)
    VALUES 
      ('00000000-0000-0000-0000-000000000001', 'anant@example.com', ${studentPasswordHash}, 'Anant Kumar', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', 'student', 'active', 'Asia/Kolkata'),
      ('00000000-0000-0000-0000-000000000002', 'priya.sharma@microsoft.com', ${mentorPasswordHash}, 'Priya Sharma', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', 'mentor', 'active', 'Asia/Kolkata'),
      ('00000000-0000-0000-0000-000000000003', 'rohan.mehta@google.com', ${mentorPasswordHash}, 'Rohan Mehta', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 'mentor', 'active', 'Asia/Kolkata'),
      ('00000000-0000-0000-0000-000000000004', 'aditya.singh@adobe.com', ${mentorPasswordHash}, 'Aditya Singh', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', 'mentor', 'active', 'Asia/Kolkata'),
      ('00000000-0000-0000-0000-000000000005', 'rahul.mehta@google.com', ${mentorPasswordHash}, 'Rahul Mehta', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', 'mentor', 'active', 'Asia/Kolkata'),
      ('00000000-0000-0000-0000-000000000006', 'admin@mentormaze.com', ${adminPasswordHash}, 'Platform Admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', 'admin', 'active', 'Asia/Kolkata')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insert Student Profile
  await db.execute(sql`
    INSERT INTO student_profiles (id, user_id, institution, degree, field_of_study, graduation_year, target_role, current_level, bio, preferred_languages)
    VALUES (
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      'Lovely Professional University (LPU)',
      'B.Tech in Computer Science and Engineering',
      'Computer Science',
      2027,
      'Software Engineer',
      'Undergraduate Student',
      'Passionate CS undergraduate focusing on distributed backend systems, algorithms, and cloud native architectures.',
      '["English", "Hindi"]'
    ) ON CONFLICT (id) DO NOTHING;
  `);

  // Insert Student Goals
  await db.execute(sql`
    INSERT INTO student_goals (id, student_profile_id, title, description, category, status, progress_percentage, target_date)
    VALUES 
      ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Crack SDE Interview', 'Master system design fundamentals, DSA patterns, and complete 3 mock interviews with senior engineers.', 'interview', 'in_progress', 60, '2026-12-31'),
      ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Build a Portfolio Project', 'Design and deploy a full-stack production application with real-time WebSockets and database persistence.', 'project', 'in_progress', 40, '2026-12-15')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insert Mentor Profiles
  await db.execute(sql`
    INSERT INTO mentor_profiles (id, user_id, headline, bio, organization, "current_role", years_of_experience, location, rating, total_sessions, total_mentees, verification_status, verified_at, languages, session_modes, response_time, is_accepting_bookings, price_15min_inr, price_30min_inr, price_60min_inr)
    VALUES 
      ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Software Engineer @ Microsoft', 'Software engineer passionate about helping students grow in tech, build strong fundamentals, and make confident career decisions. 5+ years building hyperscale cloud infrastructure at Microsoft.', 'Microsoft', 'Software Engineer', 5, 'Bengaluru, India', 4.90, 210, 500, 'approved', now(), '["English", "Hindi"]', '["1:1", "Group"]', 'Within 6 hours', true, 149, 249, 449),
      ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Data Scientist @ Google', 'Senior Data Scientist at Google. Passionate about machine learning pipelines, LLM systems, mathematical rigor, and guiding students from tier-2/3 colleges into top tech firms.', 'Google', 'Data Scientist', 4, 'Hyderabad, India', 4.90, 127, 320, 'approved', now(), '["English", "Hindi", "Gujarati"]', '["1:1", "Group"]', 'Within 4 hours', true, 149, 249, 449),
      ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Product Manager @ Adobe', 'Product leader helping aspiring and associate PMs master product teardowns, metrics design, execution frameworks, and behavioral product interviews.', 'Adobe', 'Product Manager', 6, 'Noida, India', 4.80, 95, 280, 'approved', now(), '["English", "Hindi"]', '["1:1", "Group"]', 'Within 8 hours', true, 149, 249, 449),
      ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 'Data Scientist @ Google', '5+ years experience building large scale recommendation algorithms. Applying to mentor students on advanced data engineering, analytics, and deep learning.', 'Google', 'Data Scientist', 5, 'Bengaluru, India', 5.00, 0, 0, 'submitted', null, '["English", "Hindi"]', '["1:1"]', 'Within 24 hours', false, 149, 249, 449)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insert Mentor Expertise
  await db.execute(sql`
    INSERT INTO mentor_expertise (id, mentor_profile_id, primary_domain, skills, focus_areas)
    VALUES
      ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Software Engineering', '["System Design", "Web Development", "Interview Prep", "Cloud Architecture", "Distributed Systems"]', '["Career Guidance", "Interview Prep", "Project Review", "Skill Development"]'),
      ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Data Science', '["Data Science", "Python", "Machine Learning", "Career Growth", "Deep Learning", "SQL"]', '["Career Guidance", "Project Review", "Skill Development"]'),
      ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Product Management', '["Product Strategy", "Roadmap", "Leadership", "User Research", "Agile Execution"]', '["Career Guidance", "Interview Prep", "Project Review"]'),
      ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Data Science', '["Data Science", "ML", "Python", "Recommendation Systems"]', '["Career Guidance", "Interview Prep"]')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insert Mentor Applications
  await db.execute(sql`
    INSERT INTO mentor_applications (id, mentor_profile_id, status, identity_proof_type, professional_proof_type, resume_url, linkedin_url, created_at, admin_notes)
    VALUES
      ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'submitted', 'Aadhaar / Passport', 'Google Corporate Email + LinkedIn', '/documents/Rahul_Mehta_Resume.pdf', 'https://linkedin.com/in/rahul-mehta-mock', now(), 'Credentials match Google domain. LinkedIn profile active with 5+ years experience.'),
      ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'approved', 'Passport', 'Microsoft Corporate Email + Badge', '/documents/Priya_Sharma_Resume.pdf', 'https://linkedin.com/in/priya-sharma-mock', now() - interval '3 months', 'Fully verified by admin. High student rating.')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insert Platform Settings
  await db.execute(sql`
    INSERT INTO platform_settings (key, value, description)
    VALUES
      ('general', '{"platformName": "MentorMaze", "supportEmail": "hellomentormaze@gmail.com", "defaultSessionMinutes": 30}', 'Core platform configuration'),
      ('payments', '{"commissionPercent": 15.0, "environment": "TEST", "currency": "INR"}', 'Marketplace economics and Cashfree settings'),
      ('matching_weights', '{"careerGoalAlignment": 0.30, "skillGapAlignment": 0.25, "domainExpertise": 0.20, "academicRelevance": 0.10, "availability": 0.10, "studentPreference": 0.05}', 'Explainable mentor recommendation weights')
    ON CONFLICT (key) DO NOTHING;
  `);

  // Insert Bookings (Active today session and pending request)
  await db.execute(sql`
    INSERT INTO bookings (
      id, student_user_id, mentor_profile_id, service_type, session_duration_minutes,
      start_time_utc, end_time_utc, user_timezone, status, price_inr, amount_paise,
      currency, is_free_session, payment_status, student_discussion_points, meeting_room_id
    ) VALUES 
      (
        '60000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '1on1_mentorship',
        45,
        now() + interval '30 minutes',
        now() + interval '75 minutes',
        'Asia/Kolkata',
        'confirmed',
        249,
        24900,
        'INR',
        false,
        'paid',
        'Distributed systems architecture, rate limiter trade-offs, and behavioral mock review.',
        'room-60000000-0000-0000-0000-000000000001'
      ),
      (
        '60000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001',
        '30000000-0000-0000-0000-000000000001',
        '1on1_mentorship',
        30,
        now() + interval '2 days',
        now() + interval '2 days 30 minutes',
        'Asia/Kolkata',
        'pending',
        249,
        24900,
        'INR',
        false,
        'unpaid',
        'System design for distributed rate limiter and mock interview prep',
        NULL
      )
    ON CONFLICT (id) DO NOTHING;
  `);

  // Insert Shared Mentorship Bridge Briefing for Priya Sharma
  await db.execute(sql`
    INSERT INTO mentorship_bridge_shares (
      id, student_user_id, mentor_profile_id, booking_id, timeframe,
      student_background, mentoring_history, current_challenges, progress_and_evidence,
      development_areas, mentoring_objectives, questions_for_mentor, student_note,
      status, share_purpose, consent_reference, shared_at, expires_at
    ) VALUES (
      '70000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      '60000000-0000-0000-0000-000000000001',
      'last_30_days',
      '{"targetRole": "Software Engineer", "degree": "B.Tech CSE", "graduationYear": 2027}'::jsonb,
      '[{"topic": "System Architecture", "summary": "Discussed partition tolerance, caching layers, and database sharding.", "provenance": "assessment_verified"}]'::jsonb,
      '["Handling high concurrency in sliding-window rate limiters", "Designing resilient circuit breakers"]'::jsonb,
      '[{"milestoneTitle": "Rate Limiter Core Algorithm", "status": "completed", "completionEvidence": "Token bucket and sliding log implementations verified.", "provenance": "assessment_verified"}]'::jsonb,
      '[{"area": "Distributed Locking & Redis Consensus", "type": "measured_evidence", "details": "Redlock algorithm and failover scenarios.", "provenance": "assessment_verified"}]'::jsonb,
      '["Review system design for distributed rate limiter", "Discuss interview trade-offs at hyperscale"]'::jsonb,
      '["How do production systems at Microsoft handle clock drift with sliding windows?", "What are the common pitfalls when scaling Redis clusters for rate limiting?"]'::jsonb,
      'Looking forward to our session! I have prepared my rate limiter architecture diagrams and want your feedback on failure mode recovery.',
      'shared',
      'session_preparation',
      'explicit_student_grant',
      now(),
      now() + interval '7 days'
    ) ON CONFLICT (id) DO NOTHING;
  `);
}
