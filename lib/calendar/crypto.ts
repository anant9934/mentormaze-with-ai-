/**
 * MentorMaze Calendar Credential Encryption Utility
 * AES-256-GCM authenticated encryption for OAuth refresh tokens
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits

function getMasterKey(): Buffer {
  const secret =
    process.env.CALENDAR_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "mentormaze-super-secret-calendar-encryption-master-key-32b";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string into a base64 string formatted as iv:tag:ciphertext
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  
  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext}`;
}

/**
 * Decrypts a base64 iv:tag:ciphertext string back to plaintext
 */
export function decryptToken(encryptedString: string): string {
  if (!encryptedString || !encryptedString.includes(":")) return "";
  try {
    const [ivB64, tagB64, ciphertext] = encryptedString.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, "base64", "utf8");
    plaintext += decipher.final("utf8");
    return plaintext;
  } catch (err) {
    console.error("Token decryption failed: invalid key or corrupted payload");
    return "";
  }
}
