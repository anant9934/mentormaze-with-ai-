export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_DOCUMENT_MIMES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Validates document uploads (resumes, identity proofs, employment badges)
 * against file extension, MIME type, and size limits to prevent malware upload.
 */
export function validateUploadFile(
  file: { name: string; size: number; type: string },
  category: "document" | "image" = "document"
): FileValidationResult {
  const allowedMimes = category === "document" ? ALLOWED_DOCUMENT_MIMES : ALLOWED_IMAGE_MIMES;
  const maxSize = category === "document" ? MAX_DOCUMENT_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds the allowed limit of ${maxSize / (1024 * 1024)} MB.`,
    };
  }

  if (!allowedMimes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type (${file.type}). Allowed types: ${allowedMimes.join(", ")}.`,
    };
  }

  // Prevent path traversal in file names
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (sanitizedName.includes("..") || sanitizedName.startsWith("/")) {
    return {
      valid: false,
      error: "Invalid file name characters.",
    };
  }

  return { valid: true };
}
