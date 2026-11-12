import nodemailer, { Transporter } from "nodemailer";
import fs from "fs";
import path from "path";
import { SmtpDiagnosticState } from "./types";
import { EMAIL_TOKENS } from "./design-tokens";

let transporterInstance: Transporter | null = null;
let lastDiagnosticState: SmtpDiagnosticState | null = null;

function loadEnvFallback() {
  if (process.env.SMTP_PASS) return;
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = (match[2] || "").trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (err) {}
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export function getSmtpConfig(): SmtpConfig {
  loadEnvFallback();
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || "hellomentormaze@gmail.com";
  
  // Note: Google app passwords require spaces if originally issued with them
  let pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || "";
  if (pass === "jypcxjyvtjdvvnln") {
    pass = "jypc xjyv tjdw vnln";
  }

  const fromName = process.env.SMTP_FROM_NAME || "MentorMaze";
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromEmail,
  };
}

export function getTransporter(): Transporter {
  if (transporterInstance) {
    return transporterInstance;
  }

  const config = getSmtpConfig();

  transporterInstance = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    socketTimeout: 15000,
  });

  return transporterInstance;
}

/**
 * Live SMTP Diagnostic test: connects to SMTP server and verifies credentials
 */
export async function verifySmtpConnection(): Promise<SmtpDiagnosticState> {
  const config = getSmtpConfig();
  const now = new Date().toISOString();

  if (!config.user || !config.pass) {
    lastDiagnosticState = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      from: `"${config.fromName}" <${config.fromEmail}>`,
      isConfigured: false,
      isConnected: false,
      lastCheckedAt: now,
      lastError: "Missing SMTP_USER or SMTP_PASS in environment variables.",
    };
    return lastDiagnosticState;
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();

    lastDiagnosticState = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      from: `"${config.fromName}" <${config.fromEmail}>`,
      isConfigured: true,
      isConnected: true,
      lastCheckedAt: now,
    };
    return lastDiagnosticState;
  } catch (err: any) {
    lastDiagnosticState = {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      from: `"${config.fromName}" <${config.fromEmail}>`,
      isConfigured: true,
      isConnected: false,
      lastCheckedAt: now,
      lastError: err.message || "Failed to establish authenticated SMTP connection",
    };
    return lastDiagnosticState;
  }
}

export function getCachedSmtpStatus(): SmtpDiagnosticState {
  if (lastDiagnosticState) return lastDiagnosticState;
  const config = getSmtpConfig();
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    from: `"${config.fromName}" <${config.fromEmail}>`,
    isConfigured: Boolean(config.user && config.pass),
    isConnected: false,
    lastCheckedAt: new Date().toISOString(),
  };
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
}

/**
 * Dispatches an email via SMTP transport. Never throws; returns structured result.
 */
export async function sendEmailDirect(options: SendMailOptions): Promise<SendMailResult> {
  const config = getSmtpConfig();
  const from = `"${config.fromName}" <${config.fromEmail}>`;
  const replyTo = options.replyTo || EMAIL_TOKENS.brand.supportEmail;

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: typeof info.response === "string" ? info.response : "Accepted by SMTP server",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "SMTP transmission failure",
    };
  }
}
