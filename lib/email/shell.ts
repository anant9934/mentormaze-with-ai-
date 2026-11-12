import { EMAIL_TOKENS } from "./design-tokens";

export interface EmailShellOptions {
  previewText?: string;
  announcementLabel?: string;
  heading: string;
  introText?: string;
  primaryCta?: {
    label: string;
    url: string;
  };
  summaryCard?: {
    title?: string;
    items: { label: string; value: string; isHighlight?: boolean }[];
  };
  contentHtml: string;
  secondaryInfoHtml?: string;
  supportNote?: string;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

/**
 * Generates email-client resilient table-based HTML conforming to the MentorMaze design system.
 */
export function renderEmailShell(options: EmailShellOptions): string {
  const {
    previewText = "MentorMaze by AI Tathastu — Real People. Real Guidance.",
    announcementLabel,
    heading,
    introText,
    primaryCta,
    summaryCard,
    contentHtml,
    secondaryInfoHtml,
    supportNote = `Have questions or need assistance? Reply directly to this email or reach our support team at <a href="mailto:${EMAIL_TOKENS.brand.supportEmail}" style="color:${EMAIL_TOKENS.colors.forest800};text-decoration:underline;">${EMAIL_TOKENS.brand.supportEmail}</a>.`,
    unsubscribeUrl = `${EMAIL_TOKENS.brand.officialDomain}/settings/email-preferences`,
    preferencesUrl = `${EMAIL_TOKENS.brand.officialDomain}/settings/email-preferences`,
  } = options;

  const summaryCardHtml = summaryCard
    ? `
    <!-- SUMMARY CARD -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${EMAIL_TOKENS.colors.cream100};border-radius:12px;border:1px solid ${EMAIL_TOKENS.colors.sand200};margin:24px 0;padding:20px;">
      ${
        summaryCard.title
          ? `<tr><td colspan="2" style="font-family:${EMAIL_TOKENS.typography.sansBody};font-size:14px;font-weight:700;color:${EMAIL_TOKENS.colors.forest900};text-transform:uppercase;letter-spacing:0.5px;padding-bottom:12px;border-bottom:1px solid ${EMAIL_TOKENS.colors.sand200};">${summaryCard.title}</td></tr>`
          : ""
      }
      ${summaryCard.items
        .map(
          (item) => `
        <tr>
          <td style="padding:10px 0;font-family:${EMAIL_TOKENS.typography.sansBody};font-size:14px;color:${EMAIL_TOKENS.colors.ink700};width:40%;">${item.label}</td>
          <td style="padding:10px 0;font-family:${EMAIL_TOKENS.typography.sansBody};font-size:14px;font-weight:${item.isHighlight ? "700" : "600"};color:${item.isHighlight ? EMAIL_TOKENS.colors.forest900 : EMAIL_TOKENS.colors.ink950};text-align:right;">${item.value}</td>
        </tr>
      `
        )
        .join("")}
    </table>
  `
    : "";

  const ctaHtml = primaryCta
    ? `
    <!-- PRIMARY CTA -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 24px 0;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:${EMAIL_TOKENS.colors.forest900};">
          <a href="${primaryCta.url}" target="_blank" style="font-size:15px;font-family:${EMAIL_TOKENS.typography.sansBody};color:${EMAIL_TOKENS.colors.cream50};font-weight:600;text-decoration:none;border-radius:8px;padding:14px 28px;border:1px solid ${EMAIL_TOKENS.colors.forest900};display:inline-block;letter-spacing:0.2px;">
            ${primaryCta.label} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${heading}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; background-color: ${EMAIL_TOKENS.colors.cream50}; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .header-logo { font-size: 20px !important; }
      .main-heading { font-size: 24px !important; line-height: 30px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_TOKENS.colors.cream50};font-family:${EMAIL_TOKENS.typography.sansBody};color:${EMAIL_TOKENS.colors.ink950};">
  <!-- PREVIEW TEXT (HIDDEN) -->
  <div style="display:none;font-size:1px;color:${EMAIL_TOKENS.colors.cream50};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
    ${"&nbsp;&zwnj;".repeat(60)}
  </div>

  <!-- OUTER WRAPPER TABLE -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${EMAIL_TOKENS.colors.cream50};">
    <tr>
      <td align="center" style="padding: 24px 12px 40px 12px;">
        <!-- MAIN CONTAINER (600px MAX) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:${EMAIL_TOKENS.colors.white};border-radius:16px;border:1px solid ${EMAIL_TOKENS.colors.sand200};overflow:hidden;box-shadow:0 4px 12px rgba(18,59,46,0.03);" class="email-container">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; background-color: ${EMAIL_TOKENS.colors.forest900}; border-bottom: 2px solid ${EMAIL_TOKENS.colors.forest700};">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <a href="${EMAIL_TOKENS.brand.officialDomain}" target="_blank" style="text-decoration:none;">
                      <span style="font-family:${EMAIL_TOKENS.typography.serifHeading};font-size:24px;font-weight:700;color:${EMAIL_TOKENS.colors.cream50};letter-spacing:-0.5px;">MentorMaze</span>
                      <span style="display:block;font-family:${EMAIL_TOKENS.typography.sansBody};font-size:11px;color:${EMAIL_TOKENS.colors.sage200};text-transform:uppercase;letter-spacing:1px;margin-top:2px;">by AI Tathastu</span>
                    </a>
                  </td>
                  ${
                    announcementLabel
                      ? `
                  <td align="right">
                    <span style="background-color:${EMAIL_TOKENS.colors.forest800};color:${EMAIL_TOKENS.colors.sage100};font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;letter-spacing:0.3px;border:1px solid ${EMAIL_TOKENS.colors.forest700};">
                      ${announcementLabel}
                    </span>
                  </td>`
                      : ""
                  }
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <!-- EDITORIAL HEADING -->
              <h1 class="main-heading" style="margin:0 0 16px 0;font-family:${EMAIL_TOKENS.typography.serifHeading};font-size:28px;line-height:34px;font-weight:700;color:${EMAIL_TOKENS.colors.forest900};letter-spacing:-0.5px;">
                ${heading}
              </h1>

              ${
                introText
                  ? `
              <p style="margin:0 0 20px 0;font-size:16px;line-height:24px;color:${EMAIL_TOKENS.colors.ink700};">
                ${introText}
              </p>`
                  : ""
              }

              <!-- SPECIFIC BODY CONTENT -->
              <div style="font-size:15px;line-height:24px;color:${EMAIL_TOKENS.colors.ink950};">
                ${contentHtml}
              </div>

              ${summaryCardHtml}

              ${ctaHtml}

              ${
                secondaryInfoHtml
                  ? `
              <div style="margin-top:20px;font-size:14px;line-height:22px;color:${EMAIL_TOKENS.colors.ink700};padding-top:16px;border-top:1px solid ${EMAIL_TOKENS.colors.sage100};">
                ${secondaryInfoHtml}
              </div>`
                  : ""
              }
            </td>
          </tr>

          <!-- SUPPORT & ASSISTANCE NOTE -->
          <tr>
            <td style="padding: 20px 36px; background-color: ${EMAIL_TOKENS.colors.sage100}; border-top: 1px solid ${EMAIL_TOKENS.colors.sage200}; font-size: 13px; line-height: 20px; color: ${EMAIL_TOKENS.colors.ink700};">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align:top;width:24px;padding-right:12px;">
                    <span style="color:${EMAIL_TOKENS.colors.forest900};font-size:16px;">&#9432;</span>
                  </td>
                  <td style="font-family:${EMAIL_TOKENS.typography.sansBody};">
                    ${supportNote}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 32px 36px; background-color: ${EMAIL_TOKENS.colors.cream50}; border-top: 1px solid ${EMAIL_TOKENS.colors.sand200}; text-align: center;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:${EMAIL_TOKENS.colors.forest900};">
                MentorMaze &mdash; Human Mentorship &amp; Mock Interview Practice
              </p>
              <p style="margin:0 0 16px 0;font-size:12px;line-height:18px;color:${EMAIL_TOKENS.colors.ink700};">
                A proud member of the <a href="https://aitathastu.com" target="_blank" style="color:${EMAIL_TOKENS.colors.forest800};text-decoration:none;font-weight:600;">AI Tathastu</a> ecosystem.<br />
                &copy; ${new Date().getFullYear()} MentorMaze. All rights reserved.
              </p>
              
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 16px auto;">
                <tr>
                  <td style="padding:0 8px;"><a href="${EMAIL_TOKENS.brand.officialDomain}" style="font-size:12px;color:${EMAIL_TOKENS.colors.forest800};text-decoration:underline;">Website</a></td>
                  <td style="color:${EMAIL_TOKENS.colors.sand200};">&bull;</td>
                  <td style="padding:0 8px;"><a href="${EMAIL_TOKENS.brand.officialDomain}/privacy" style="font-size:12px;color:${EMAIL_TOKENS.colors.forest800};text-decoration:underline;">Privacy Policy</a></td>
                  <td style="color:${EMAIL_TOKENS.colors.sand200};">&bull;</td>
                  <td style="padding:0 8px;"><a href="${EMAIL_TOKENS.brand.officialDomain}/terms" style="font-size:12px;color:${EMAIL_TOKENS.colors.forest800};text-decoration:underline;">Terms of Service</a></td>
                  <td style="color:${EMAIL_TOKENS.colors.sand200};">&bull;</td>
                  <td style="padding:0 8px;"><a href="${preferencesUrl}" style="font-size:12px;color:${EMAIL_TOKENS.colors.forest800};text-decoration:underline;">Email Preferences</a></td>
                </tr>
              </table>

              <p style="margin:0 0 12px 0;font-size:11px;line-height:16px;color:#8F9A95;">
                ${process.env.BUSINESS_MAILING_ADDRESS || "MentorMaze by AI Tathastu &bull; Bengaluru, Karnataka, India"}<br />
                Official Communications &amp; Support: <a href="mailto:${EMAIL_TOKENS.brand.supportEmail}" style="color:${EMAIL_TOKENS.colors.forest800};text-decoration:none;">${EMAIL_TOKENS.brand.supportEmail}</a>
              </p>

              <p style="margin:0;font-size:11px;line-height:16px;color:#8F9A95;">
                You received this transactional service notification regarding your MentorMaze account or booking activity.<br />
                To manage communications, adjust your <a href="${preferencesUrl}" style="color:${EMAIL_TOKENS.colors.forest800};text-decoration:underline;">Email Preferences</a> or <a href="${unsubscribeUrl}" style="color:${EMAIL_TOKENS.colors.forest800};text-decoration:underline;">Unsubscribe</a> from marketing updates.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates an accessible, clean plain-text alternative of the email
 */
export function renderPlainText(options: EmailShellOptions): string {
  const lines: string[] = [];

  lines.push(`=======================================================`);
  lines.push(`MENTORMAZE BY AI TATHASTU`);
  lines.push(`${EMAIL_TOKENS.brand.tagline}`);
  lines.push(`=======================================================\n`);

  if (options.announcementLabel) {
    lines.push(`[${options.announcementLabel.toUpperCase()}]\n`);
  }

  lines.push(options.heading.toUpperCase());
  lines.push(`-------------------------------------------------------`);

  if (options.introText) {
    lines.push(options.introText);
    lines.push("");
  }

  // Convert HTML content into simple readable text
  const cleanBody = options.contentHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&rarr;/g, "->")
    .replace(/&bull;/g, "*")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .trim();

  lines.push(cleanBody);
  lines.push("");

  if (options.summaryCard && options.summaryCard.items.length > 0) {
    lines.push(`-------------------------------------------------------`);
    if (options.summaryCard.title) {
      lines.push(`${options.summaryCard.title.toUpperCase()}`);
    }
    options.summaryCard.items.forEach((item) => {
      lines.push(`* ${item.label}: ${item.value}`);
    });
    lines.push(`-------------------------------------------------------\n`);
  }

  if (options.primaryCta) {
    lines.push(`>>> ${options.primaryCta.label.toUpperCase()}`);
    lines.push(`Link: ${options.primaryCta.url}\n`);
  }

  if (options.secondaryInfoHtml) {
    const cleanSecondary = options.secondaryInfoHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim();
    lines.push(cleanSecondary);
    lines.push("");
  }

  lines.push(`-------------------------------------------------------`);
  lines.push(`Support: ${EMAIL_TOKENS.brand.supportEmail}`);
  lines.push(`Website: ${EMAIL_TOKENS.brand.officialDomain}`);
  lines.push(`Email Preferences: ${EMAIL_TOKENS.brand.officialDomain}/settings/email-preferences`);
  lines.push(`(c) ${new Date().getFullYear()} MentorMaze by AI Tathastu. All rights reserved.`);

  return lines.join("\n");
}

