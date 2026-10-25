import nodemailer from "nodemailer";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

// Prioritize IPv4 DNS lookup to prevent ENETUNREACH on deployment environments without IPv6 routing
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

let smtpTransporter = null;

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      family: 4, // Force IPv4 socket connection
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  return smtpTransporter;
};

/**
 * Builds email subject, text, and styled HTML body
 */
const buildEmailPayload = ({ name, email, type, subject, message }) => {
  const categoryLabel = type ? type.toUpperCase() : "QUERY";
  const formattedSubject = `[CodeDev ${categoryLabel}] ${subject}`;

  const text = `You received a new submission on CodeDev Network:\n\nName: ${name}\nEmail: ${email}\nType: ${type}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nCodeDev Network Notification`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #1f2937;">
      <h2 style="color: #f59e0b; margin-top: 0; font-size: 20px;">New Message on CodeDev Network</h2>
      <div style="margin-bottom: 16px;">
        <p style="margin: 4px 0;"><strong>Category:</strong> <span style="text-transform: capitalize; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-weight: 500;">${type ? type.replace(/_/g, " ") : "Query"}</span></p>
        <p style="margin: 4px 0;"><strong>Sender:</strong> ${name} &lt;<a href="mailto:${email}" style="color: #2563eb;">${email}</a>&gt;</p>
        <p style="margin: 4px 0;"><strong>Subject:</strong> ${subject}</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <div style="background: #f9fafb; padding: 16px; border-radius: 6px; white-space: pre-wrap; line-height: 1.6; font-size: 14px; border: 1px solid #f3f4f6;">
${message}
      </div>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <p style="font-size: 12px; color: #6b7280; margin-bottom: 0;">Hit "Reply" in your email client to respond directly to ${email}.</p>
    </div>
  `;

  return { formattedSubject, text, html };
};

/**
 * Sends email via Resend HTTP REST API (Port 443 - Works 100% on Render Free & Paid)
 */
const sendViaResend = async ({ name, email, adminEmail, formattedSubject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const from = process.env.EMAIL_FROM || "CodeDev Network <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [adminEmail],
        reply_to: email,
        subject: formattedSubject,
        html,
        text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[MailService:Resend] API Error:", data);
      return false;
    }

    console.log(`[MailService:Resend] Email notification sent successfully via HTTPS: ${data.id}`);
    return true;
  } catch (error) {
    console.error("[MailService:Resend] Request failed:", error.message);
    return false;
  }
};

/**
 * Sends email via Brevo HTTP REST API (Port 443 - Works 100% on Render Free & Paid)
 */
const sendViaBrevo = async ({ name, email, adminEmail, formattedSubject, text, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  try {
    const senderEmail = process.env.EMAIL_USER || "noreply@codedev.network";
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "CodeDev Network", email: senderEmail },
        to: [{ email: adminEmail }],
        replyTo: { email, name },
        subject: formattedSubject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[MailService:Brevo] API Error:", data);
      return false;
    }

    console.log(`[MailService:Brevo] Email notification sent successfully via HTTPS: ${data.messageId}`);
    return true;
  } catch (error) {
    console.error("[MailService:Brevo] Request failed:", error.message);
    return false;
  }
};

/**
 * Sends email via Nodemailer SMTP (Works locally or on paid hosting plans where SMTP ports are not blocked)
 */
const sendViaSmtp = async ({ email, adminEmail, formattedSubject, text, html }) => {
  const transporter = getSmtpTransporter();
  if (!transporter) return false;

  try {
    const mailOptions = {
      from: `"CodeDev Network" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: formattedSubject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MailService:SMTP] Notification email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[MailService:SMTP] Error sending email notification:", error.message);

    const isTimeout =
      error.message?.includes("Connection timeout") ||
      error.code === "ETIMEDOUT" ||
      error.code === "ESOCKETTIMEDOUT";

    if (isTimeout || error.code === "ENETUNREACH") {
      console.warn(
        "\n=================================================================================\n" +
        "⚠️ [MailService] SMTP Connection Timeout detected on deployment (e.g. Render free tier).\n" +
        "Render and many cloud providers BLOCK outbound SMTP ports (25, 465, 587) on free plans.\n" +
        "FIX: Set RESEND_API_KEY in your Render Environment Variables.\n" +
        "1. Create a free key at https://resend.com (takes 30 seconds).\n" +
        "2. Add RESEND_API_KEY=re_xxxx in Render Dashboard -> Environment.\n" +
        "Emails will then send instantly over HTTPS (Port 443) without getting blocked.\n" +
        "=================================================================================\n"
      );
    }
    return false;
  }
};

/**
 * Primary dispatch function:
 * 1. Checks HTTP providers (Resend, Brevo) first since they bypass Render's SMTP port firewall.
 * 2. Falls back to Nodemailer SMTP (for local dev or unblocked servers).
 */
export const sendContactNotificationEmail = async ({ name, email, type, subject, message }) => {
  const adminEmail = process.env.ADMIN_EMAIL || "12mudassarkhan@gmail.com";
  const { formattedSubject, text, html } = buildEmailPayload({ name, email, type, subject, message });

  // 1. Try Resend HTTP API (Port 443)
  if (process.env.RESEND_API_KEY) {
    const sent = await sendViaResend({ name, email, adminEmail, formattedSubject, text, html });
    if (sent) return true;
  }

  // 2. Try Brevo HTTP API (Port 443)
  if (process.env.BREVO_API_KEY) {
    const sent = await sendViaBrevo({ name, email, adminEmail, formattedSubject, text, html });
    if (sent) return true;
  }

  // 3. Fallback to Nodemailer SMTP (Port 587/465)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const sent = await sendViaSmtp({ email, adminEmail, formattedSubject, text, html });
    if (sent) return true;
  } else {
    console.log(
      "[MailService] No email provider configured. Please set RESEND_API_KEY (for Render) or EMAIL_USER/EMAIL_PASS (for SMTP) in environment variables."
    );
  }

  return false;
};
