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
const sendViaResend = async ({ name, email, toEmail, adminEmail, replyTo, formattedSubject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const recipient = toEmail || adminEmail;
  const replyAddress = replyTo || email;

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
        to: [recipient],
        reply_to: replyAddress,
        subject: formattedSubject,
        html,
        text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[MailService:Resend] API Error:", data);
      if (data.message?.includes("can only send testing emails to your own email address")) {
        console.warn(
          "[MailService:Resend] ⚠️ Notice: Resend's free test domain (onboarding@resend.dev) can only deliver emails to your own account email. To deliver password reset emails to arbitrary user inboxes, verify your custom domain in Resend Dashboard -> Domains (https://resend.com/domains)."
        );
      }
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
const sendViaBrevo = async ({ name, email, toEmail, adminEmail, replyTo, formattedSubject, text, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  const recipient = toEmail || adminEmail;
  const replyAddress = replyTo || email;

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
        to: [{ email: recipient }],
        replyTo: { email: replyAddress, name },
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
const sendViaSmtp = async ({ email, toEmail, adminEmail, replyTo, formattedSubject, text, html }) => {
  const transporter = getSmtpTransporter();
  if (!transporter) return false;

  const recipient = toEmail || adminEmail;

  try {
    const mailOptions = {
      from: `"CodeDev Network" <${process.env.EMAIL_USER}>`,
      to: recipient,
      replyTo: replyTo || email,
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
 * Sends password reset email via dedicated Vercel Mail Service (Port 443 HTTPS)
 * Method: POST
 * URL: https://mail-service-nine-alpha.vercel.app/api/mail/send-reset-password
 */
const sendViaMicroserviceResetPassword = async ({
  to,
  recipientName,
  resetLink,
  expiresIn = "15 minutes",
  appName = "CodeDev-Network",
}) => {
  const baseUrl = process.env.MAIL_SERVICE_URL || "https://mail-service-nine-alpha.vercel.app";
  const url = `${baseUrl.replace(/\/$/, "")}/api/mail/send-reset-password`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        recipientName: recipientName || "Developer",
        resetLink,
        expiresIn,
        appName,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      console.error("[MailService:Microservice] Reset password API error:", data);
      return false;
    }

    console.log(`[MailService:Microservice] Password reset email sent successfully to ${to} (MessageId: ${data.data?.messageId || "ok"})`);
    return true;
  } catch (error) {
    console.error("[MailService:Microservice] Reset password request failed:", error.message);
    return false;
  }
};

/**
 * Sends email via dedicated Vercel Mail Service (Port 443 HTTPS)
 * Method: POST
 * URL: https://mail-service-nine-alpha.vercel.app/api/mail/send-email
 */
const sendViaMicroserviceEmail = async ({ to, subject, text, html, replyTo }) => {
  const baseUrl = process.env.MAIL_SERVICE_URL || "https://mail-service-nine-alpha.vercel.app";
  const url = `${baseUrl.replace(/\/$/, "")}/api/mail/send-email`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        text,
        html,
        ...(replyTo ? { replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      console.error("[MailService:Microservice] Send email API error:", data);
      return false;
    }

    console.log(`[MailService:Microservice] Email sent successfully to ${to} (MessageId: ${data.data?.messageId || "ok"})`);
    return true;
  } catch (error) {
    console.error("[MailService:Microservice] Send email request failed:", error.message);
    return false;
  }
};

/**
 * Primary dispatch function:
 * 1. Checks dedicated Vercel Microservice first (works 100% on Render Port 443 without firewall restrictions).
 * 2. Falls back to Resend & Brevo HTTP REST APIs.
 * 3. Falls back to Nodemailer SMTP (for local dev or unblocked servers).
 */
export const sendContactNotificationEmail = async ({ name, email, type, subject, message }) => {
  const adminEmail = process.env.ADMIN_EMAIL || "12mudassarkhan@gmail.com";
  const { formattedSubject, text, html } = buildEmailPayload({ name, email, type, subject, message });

  // 1. Primary: Dedicated Vercel Mail Service (Port 443)
  const sentViaMicroservice = await sendViaMicroserviceEmail({
    to: adminEmail,
    subject: formattedSubject,
    text,
    html,
    replyTo: email,
  });
  if (sentViaMicroservice) return true;

  console.warn("[MailService] Microservice failed for contact notification, trying fallbacks...");

  // 2. Try Resend HTTP API (Port 443)
  if (process.env.RESEND_API_KEY) {
    const sent = await sendViaResend({ name, email, adminEmail, formattedSubject, text, html });
    if (sent) return true;
  }

  // 3. Try Brevo HTTP API (Port 443)
  if (process.env.BREVO_API_KEY) {
    const sent = await sendViaBrevo({ name, email, adminEmail, formattedSubject, text, html });
    if (sent) return true;
  }

  // 4. Fallback to Nodemailer SMTP (Port 587/465)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const sent = await sendViaSmtp({ email, adminEmail, formattedSubject, text, html });
    if (sent) return true;
  } else {
    console.log(
      "[MailService] No backup email provider configured. Please set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS in environment variables."
    );
  }

  return false;
};

/**
 * Sends password reset email to a user with secure token link
 * Primary: Uses dedicated Vercel Mail Service (https://mail-service-nine-alpha.vercel.app/api/mail/send-reset-password)
 * Fallback: Uses Resend / Brevo / SMTP with custom template
 */
export const sendPasswordResetEmail = async ({
  to,
  resetUrl,
  resetLink,
  username,
  recipientName,
  expiresIn = "15 minutes",
  appName = "CodeDev-Network",
}) => {
  const finalLink = resetLink || resetUrl;
  const finalName = recipientName || username || "Developer";

  // 1. Primary: Dedicated Vercel Mail Microservice
  const sentViaMicroservice = await sendViaMicroserviceResetPassword({
    to,
    recipientName: finalName,
    resetLink: finalLink,
    expiresIn,
    appName,
  });
  if (sentViaMicroservice) return true;

  console.warn("[MailService] Microservice failed for reset password, trying backup providers...");

  const formattedSubject = `Reset Your ${appName} Password`;
  const text = `Hello ${finalName},\n\nYou requested to reset your password on ${appName}.\nPlease use the link below to reset your password (valid for ${expiresIn}):\n\n${finalLink}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\n---\n${appName} Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 10px; color: #1f2937; background: #ffffff;">
      <div style="margin-bottom: 24px; text-align: center;">
        <h1 style="color: #ffa116; margin: 0; font-size: 24px; font-weight: 700;">${appName}</h1>
        <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
      </div>

      <div style="margin-bottom: 20px;">
        <p style="font-size: 15px; line-height: 1.5; color: #374151;">Hello <strong>${finalName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.5; color: #374151;">
          We received a request to reset your password for your ${appName} account. Click the button below to create a new password:
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${finalLink}" style="background-color: #ffa116; color: #1b1b1b; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600; text-decoration: none; display: inline-block;">
          Reset Password
        </a>
      </div>

      <div style="background: #f9fafb; border-radius: 6px; padding: 14px 16px; margin: 24px 0; border: 1px solid #f3f4f6;">
        <p style="font-size: 13px; color: #6b7280; margin: 0 0 6px 0;">Or copy and paste this link into your browser:</p>
        <a href="${finalLink}" style="font-size: 12.5px; color: #2563eb; word-break: break-all;">${finalLink}</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

      <p style="font-size: 12px; color: #9ca3af; line-height: 1.5; margin: 0;">
        ⏱ This password reset link is valid for <strong>${expiresIn}</strong>.<br />
        If you did not request this password reset, you can safely ignore this email. Your account remains secure.
      </p>
    </div>
  `;

  // 2. Fallback to Nodemailer SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const sent = await sendViaSmtp({ toEmail: to, email: to, formattedSubject, text, html });
    if (sent) return true;
  }

  console.error("[MailService] Failed to send password reset email: No working provider available.");
  return false;
};

/**
 * Sends a warm, simple welcome email to a new user after registration
 * Dispatches via dedicated Vercel Microservice, with fallbacks to Resend, Brevo, and Nodemailer SMTP.
 */
export const sendWelcomeEmail = async ({
  to,
  username,
  appName = "CodeDev Network",
}) => {
  if (!to) {
    console.warn("[MailService] No recipient email provided for welcome email.");
    return false;
  }

  try {
    const finalName = username || "Developer";
    const clientUrl = (process.env.CLIENT_URL || "https://codedev-network-jmi.onrender.com").replace(/\/$/, "");
    const supportEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "12mudassarkhan@gmail.com";
    const formattedSubject = `Welcome to ${appName}, ${finalName}! 👋`;

    const text = `Hi ${finalName},\n\nWelcome to ${appName}! We're thrilled to have you join our developer community.\n\nCodeDev Network helps you track your competitive programming stats across platforms (LeetCode, Codeforces, CodeChef, and GeeksforGeeks), participate in contests, practice coding challenges, and prepare for interviews.\n\nVisit your dashboard to get started: ${clientUrl}\n\nIf you ever have any questions or feedback, feel free to reply directly to this email.\n\nHappy coding!\n\nWarm regards,\nThe ${appName} Team`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px 16px; background-color: #f9fafb; color: #1f2937;">
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          
          <div style="background-color: #111827; padding: 28px 24px; text-align: center;">
            <h1 style="color: #ffa116; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.3px;">
              ${appName}
            </h1>
            <p style="color: #9ca3af; font-size: 13px; margin: 6px 0 0 0;">
              Welcome to the Developer Community
            </p>
          </div>

          <div style="padding: 28px 24px; line-height: 1.6;">
            <p style="font-size: 16px; margin: 0 0 16px 0; color: #111827;">
              Hi <strong>${finalName}</strong>, 👋
            </p>

            <p style="font-size: 14.5px; margin: 0 0 16px 0; color: #374151;">
              Welcome to <strong>${appName}</strong>! We're truly glad to have you join our community.
            </p>

            <p style="font-size: 14.5px; margin: 0 0 20px 0; color: #374151;">
              CodeDev Network is built to help you track your coding progress across platforms like LeetCode, Codeforces, CodeChef, and GeeksforGeeks, take part in contests, and prepare for technical interviews.
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${clientUrl}" style="background-color: #ffa116; color: #111827; padding: 12px 28px; border-radius: 6px; font-size: 14.5px; font-weight: 600; text-decoration: none; display: inline-block;">
                Go to CodeDev Network
              </a>
            </div>

            <p style="font-size: 13.5px; margin: 0 0 12px 0; color: #6b7280;">
              If you ever have any questions, feedback, or need assistance, simply reply directly to this email. We'd love to hear from you.
            </p>

            <p style="font-size: 14px; margin: 24px 0 0 0; color: #374151;">
              Happy coding!<br />
              <strong>The ${appName} Team</strong>
            </p>
          </div>

          <div style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 14px 24px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0; line-height: 1.5;">
              You received this email because you created an account on <a href="${clientUrl}" style="color: #6b7280; text-decoration: underline;">${appName}</a>.
            </p>
          </div>

        </div>
      </div>
    `;

    // 1. Primary: Dedicated Vercel Mail Service (Port 443 HTTPS - delivers to any inbox)
    const sentViaMicroservice = await sendViaMicroserviceEmail({
      to,
      subject: formattedSubject,
      text,
      html,
      replyTo: supportEmail,
    });
    if (sentViaMicroservice) return true;

    console.warn("[MailService] Microservice failed for welcome email, falling back to Nodemailer SMTP...");

    // 2. Fallback: Nodemailer SMTP
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const sent = await sendViaSmtp({
        toEmail: to,
        email: supportEmail,
        replyTo: supportEmail,
        formattedSubject,
        text,
        html,
      });
      if (sent) return true;
    }

    console.error(`[MailService] Failed to send welcome email to ${to}: No working provider available.`);
    return false;
  } catch (error) {
    console.error("[MailService] Unexpected error sending welcome email:", error.message);
    return false;
  }
};


