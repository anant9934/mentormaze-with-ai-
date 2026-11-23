/**
 * ASTRION Standardized Error Handling Contract
 * Provides strongly typed errors across ASTRION domain layers.
 */

export type AstrionErrorCode =
  | "AUTH_UNAUTHORIZED"
  | "OWNERSHIP_VIOLATION"
  | "CONVERSATION_NOT_FOUND"
  | "SPECIALIST_NOT_FOUND"
  | "MODEL_UNAVAILABLE"
  | "DATABASE_ERROR"
  | "RATE_LIMITED"
  | "VALIDATION_FAILED";

export class AstrionError extends Error {
  public readonly code: AstrionErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(code: AstrionErrorCode, message: string, statusCode: number = 400, details?: Record<string, any>) {
    super(message);
    this.name = "AstrionError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  public static unauthorized(message: string = "Authentication required."): AstrionError {
    return new AstrionError("AUTH_UNAUTHORIZED", message, 401);
  }

  public static forbidden(message: string = "403_FORBIDDEN: Ownership verification failed."): AstrionError {
    return new AstrionError("OWNERSHIP_VIOLATION", message, 403);
  }

  public static notFound(message: string = "Resource not found."): AstrionError {
    return new AstrionError("CONVERSATION_NOT_FOUND", message, 404);
  }

  public static databaseError(message: string, details?: Record<string, any>): AstrionError {
    return new AstrionError("DATABASE_ERROR", `DATABASE_ERROR: ${message}`, 500, details);
  }

  public static modelUnavailable(message: string = "No inference model provider available."): AstrionError {
    return new AstrionError("MODEL_UNAVAILABLE", message, 503);
  }

  public toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
