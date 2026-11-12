import { getDb, initializeDatabaseSchema } from "../lib/db/index";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function provisionAdmin() {
  await initializeDatabaseSchema();
  const db = getDb();

  const email = process.env.INITIAL_ADMIN_EMAIL || process.argv[2] || "admin@mentormaze.com";
  const password = process.env.INITIAL_ADMIN_PASSWORD || process.argv[3] || crypto.randomBytes(16).toString("base64url");
  const displayName = process.env.INITIAL_ADMIN_NAME || "System Administrator";

  console.log(`[Admin Provisioning] Creating administrator: ${email}`);

  const passwordHash = await bcrypt.hash(password, 12); // Strong salt rounds: 12

  // Check if admin already exists
  const existingUser: any = await db.execute(sql`
    SELECT id, email, role FROM users WHERE email = ${email} LIMIT 1;
  `);

  const user = existingUser.rows?.[0] || existingUser?.[0];

  if (user) {
    await db.execute(sql`
      UPDATE users 
      SET password_hash = ${passwordHash}, role = 'admin', account_status = 'active', updated_at = now()
      WHERE id = ${user.id};
    `);
    console.log(`[Admin Provisioning] Updated existing user ${email} to admin role with new secure password.`);
  } else {
    await db.execute(sql`
      INSERT INTO users (email, password_hash, display_name, role, account_status)
      VALUES (${email}, ${passwordHash}, ${displayName}, 'admin', 'active');
    `);
    console.log(`[Admin Provisioning] Successfully provisioned new administrator ${email}.`);
  }

  console.log(`\n======================================================`);
  console.log(`ADMIN CREDENTIALS (STORE SECURELY IN PASSWORD MANAGER)`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     admin`);
  console.log(`======================================================\n`);
}

provisionAdmin().catch((err) => {
  console.error("Failed to provision administrator:", err);
  process.exit(1);
});

