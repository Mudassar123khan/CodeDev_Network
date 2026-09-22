import nodemailer from "nodemailer";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

// Prioritize IPv4 DNS lookup to prevent ENETUNREACH on deployment environments without IPv6 routing
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      family: 4, // Force IPv4 socket connection to eliminate ENETUNREACH on IPv6
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return transporter;
};

export const sendContactNotificationEmail = async ({ name, email, type, subject, message }) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "12mudassarkhan@gmail.com";
    const mailTransporter = getTransporter();

    if (!mailTransporter) {
      console.log(
        `[MailService] EMAIL_USER / EMAIL_PASS not set in environment. Saved message to database. Add EMAIL_USER and EMAIL_PASS to backend/.env to forward emails.`
      );
      return false;
    }

    const mailOptions = {
      from: `"CodeDev Network" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: `[CodeDev ${type ? type.toUpperCase() : "QUERY"}] ${subject}`,
      text: `You received a new submission on CodeDev Network:\n\nName: ${name}\nEmail: ${email}\nType: ${type}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nCodeDev Network Notification`,
      html: `
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
      `,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[MailService] Notification email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[MailService] Error sending email notification:", error.message);
    if (error.code === "ENETUNREACH") {
      console.warn("[MailService] Network unreachable. Please ensure IPv4 is enabled and SMTP_PORT (587 or 465) is permitted by your cloud provider.");
    }
    return false;
  }
};
