import { EMAIL_TOKENS } from "./design-tokens";

/**
 * Escapes HTML entities in untrusted variable inputs to prevent injection attacks
 */
export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips dangerous HTML tags and event handlers from custom template content
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "blocked-script:");
}

/**
 * Injects standard global brand variables
 */
export function getGlobalVariables(): Record<string, string> {
  return {
    app_name: EMAIL_TOKENS.brand.name,
    parent_org: EMAIL_TOKENS.brand.parentName,
    app_url: EMAIL_TOKENS.brand.officialDomain,
    support_url: `${EMAIL_TOKENS.brand.officialDomain}/support`,
    support_email: EMAIL_TOKENS.brand.supportEmail,
    current_year: new Date().getFullYear().toString(),
  };
}

/**
 * Compiles a template string by interpolating variables safely with HTML escaping
 */
export function interpolateVariables(
  templateStr: string,
  variables: Record<string, any>,
  options: { escape?: boolean; allowHtmlVariables?: string[] } = {}
): string {
  const { escape = true, allowHtmlVariables = [] } = options;
  const combined = { ...getGlobalVariables(), ...variables };

  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    const val = combined[key];
    if (val === undefined || val === null) {
      return ""; // Never leave raw undefined or template syntax
    }
    if (escape && !allowHtmlVariables.includes(key)) {
      return escapeHtml(val);
    }
    return String(val);
  });
}

