import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/server-auth";
import { getDb, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid authentication session required." },
        { status: 401 }
      );
    }

    const db = getDb();

    // Query user's mentor profile and latest application
    // NOTE: admin_notes is STRICTLY excluded from the projection to protect compliance privacy.
    const appResult: any = await db.execute(sql`
      SELECT 
        ma.id as "applicationId",
        ma.status,
        ma.identity_proof_type as "identityProofType",
        ma.professional_proof_type as "professionalProofType",
        ma.resume_url as "resumeUrl",
        ma.linkedin_url as "linkedinUrl",
        ma.rejection_reason as "rejectionReason",
        ma.created_at as "createdAt",
        mp.id as "mentorProfileId",
        mp.headline,
        mp.organization,
        mp.current_role as "currentRole",
        mp.years_of_experience as "yearsOfExperience",
        mp.verification_status as "verificationStatus",
        COALESCE(me.primary_domain, 'Software Engineering') as "domain",
        COALESCE(me.skills, '[]'::jsonb) as "skills"
      FROM mentor_profiles mp
      LEFT JOIN mentor_applications ma ON ma.mentor_profile_id = mp.id
      LEFT JOIN mentor_expertise me ON me.mentor_profile_id = mp.id
      WHERE mp.user_id = ${session.id}
      ORDER BY ma.created_at DESC
      LIMIT 1;
    `);

    const row = appResult.rows?.[0] || appResult?.[0] || null;

    if (!row) {
      return NextResponse.json({
        success: true,
        hasApplication: false,
        application: null,
      });
    }

    const skills = Array.isArray(row.skills)
      ? row.skills
      : typeof row.skills === "string"
      ? JSON.parse(row.skills)
      : [];

    return NextResponse.json({
      success: true,
      hasApplication: true,
      application: {
        id: row.applicationId,
        mentorProfileId: row.mentorProfileId,
        status: row.status || row.verificationStatus || "submitted",
        currentRole: row.currentRole,
        organization: row.organization,
        domain: row.domain,
        yearsExperience: row.yearsOfExperience,
        skills,
        linkedinUrl: row.linkedinUrl,
        resumeUrl: row.resumeUrl,
        rejectionReason: row.rejectionReason || null,
        createdAt: row.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[API /api/mentor/applications GET] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load mentor application status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please sign in before applying as a mentor." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      currentRole,
      organization,
      domain = "Software Engineering",
      yearsExperience = 1,
      skills = ["General Mentorship"],
      linkedinUrl,
      identityProofType = "Aadhaar / Passport",
      professionalProofType = "Corporate Email / LinkedIn",
      resumeUrl = "/documents/Resume.pdf",
    } = body;

    if (!currentRole?.trim() || !organization?.trim()) {
      return NextResponse.json(
        { success: false, error: "Current role and organization are required." },
        { status: 400 }
      );
    }

    // URL scheme validation: Prevent javascript:, data:, or other dangerous schemes
    if (linkedinUrl && typeof linkedinUrl === "string") {
      const trimmed = linkedinUrl.trim().toLowerCase();
      if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
        return NextResponse.json(
          { success: false, error: "Invalid LinkedIn URL: Unsafe URL scheme rejected." },
          { status: 400 }
        );
      }
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return NextResponse.json(
          { success: false, error: "Invalid LinkedIn URL: Must start with https:// or http://" },
          { status: 400 }
        );
      }
    }

    if (resumeUrl && typeof resumeUrl === "string") {
      const trimmed = resumeUrl.trim().toLowerCase();
      if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
        return NextResponse.json(
          { success: false, error: "Invalid Resume URL: Unsafe URL scheme rejected." },
          { status: 400 }
        );
      }
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
        return NextResponse.json(
          { success: false, error: "Invalid Resume URL: Must be a valid URL or safe relative path." },
          { status: 400 }
        );
      }
    }

    const db = getDb();
    const headline = `${currentRole.trim()} @ ${organization.trim()}`;
    const skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["General Mentorship"];

    // 1. Check if user already has a mentor profile (strictly bound to session.id)
    const existingProfileResult: any = await db.execute(sql`
      SELECT id, verification_status FROM mentor_profiles WHERE user_id = ${session.id} LIMIT 1;
    `);
    const existingProfile = existingProfileResult.rows?.[0] || existingProfileResult?.[0];

    let mentorProfileId: string;

    if (existingProfile) {
      mentorProfileId = existingProfile.id;
      // An approved mentor profile CANNOT be silently downgraded by a duplicate application submission!
      const isAlreadyApproved = existingProfile.verification_status === "approved";
      const targetVerificationStatus = isAlreadyApproved ? "approved" : "submitted";

      await db.execute(sql`
        UPDATE mentor_profiles
        SET 
          headline = ${headline},
          organization = ${organization.trim()},
          "current_role" = ${currentRole.trim()},
          years_of_experience = ${Number(yearsExperience) || 1},
          verification_status = ${targetVerificationStatus},
          updated_at = now()
        WHERE id = ${mentorProfileId};
      `);

      if (isAlreadyApproved) {
        return NextResponse.json(
          {
            success: true,
            message: "Your mentor profile is already verified and approved. Profile details updated.",
            mentorProfileId,
            status: "approved",
          },
          { status: 200 }
        );
      }
    } else {
      const newProfileResult: any = await db.execute(sql`
        INSERT INTO mentor_profiles (
          user_id, headline, bio, organization, "current_role", years_of_experience,
          verification_status, location, rating, languages, session_modes
        ) VALUES (
          ${session.id},
          ${headline},
          ${`Industry mentor with ${yearsExperience}+ years experience at ${organization}. Guiding students in career growth, system design, and mock interviews.`},
          ${organization.trim()},
          ${currentRole.trim()},
          ${Number(yearsExperience) || 1},
          'submitted',
          'India',
          5.00,
          '["English", "Hindi"]'::jsonb,
          '["1:1", "Group"]'::jsonb
        )
        RETURNING id;
      `);
      const newRow = newProfileResult.rows?.[0] || newProfileResult?.[0];
      mentorProfileId = newRow.id;
    }

    // 2. Upsert mentor expertise
    await db.execute(sql`
      INSERT INTO mentor_expertise (mentor_profile_id, primary_domain, skills, focus_areas)
      VALUES (
        ${mentorProfileId},
        ${domain.trim()},
        ${JSON.stringify(skillsArray)}::jsonb,
        '["Career Guidance", "Interview Prep", "Project Review", "Skill Development"]'::jsonb
      )
      ON CONFLICT DO NOTHING;
    `);

    // 3. Check for existing pending/submitted application to prevent duplicates
    const existingAppResult: any = await db.execute(sql`
      SELECT id, status FROM mentor_applications
      WHERE mentor_profile_id = ${mentorProfileId}
        AND status IN ('submitted', 'under_review')
      LIMIT 1;
    `);
    const existingApp = existingAppResult.rows?.[0] || existingAppResult?.[0];

    if (existingApp) {
      // Update existing application record
      await db.execute(sql`
        UPDATE mentor_applications
        SET 
          identity_proof_type = ${identityProofType},
          professional_proof_type = ${professionalProofType},
          resume_url = ${resumeUrl},
          linkedin_url = ${linkedinUrl || null},
          updated_at = now()
        WHERE id = ${existingApp.id};
      `);

      return NextResponse.json(
        {
          success: true,
          message: "Your existing mentor application has been updated and remains under review.",
          applicationId: existingApp.id,
          mentorProfileId,
          status: existingApp.status,
        },
        { status: 200 }
      );
    }

    // 4. Create new mentor application record with status strictly 'submitted' (cannot self-approve)
    const appResult: any = await db.execute(sql`
      INSERT INTO mentor_applications (
        mentor_profile_id,
        status,
        identity_proof_type,
        professional_proof_type,
        resume_url,
        linkedin_url,
        admin_notes
      ) VALUES (
        ${mentorProfileId},
        'submitted',
        ${identityProofType},
        ${professionalProofType},
        ${resumeUrl},
        ${linkedinUrl || null},
        ${`Application submitted via mentor registration portal by ${session.displayName}.`}
      )
      RETURNING id, status, created_at;
    `);

    const appRow = appResult.rows?.[0] || appResult?.[0];

    return NextResponse.json(
      {
        success: true,
        message: "Your mentor application has been submitted for verification.",
        applicationId: appRow.id,
        mentorProfileId,
        status: "submitted",
        createdAt: appRow.created_at,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API /api/mentor/applications POST] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit mentor application" },
      { status: 500 }
    );
  }
}
