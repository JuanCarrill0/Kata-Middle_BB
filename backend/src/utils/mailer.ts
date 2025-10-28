import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'localhost';
const smtpPort = parseInt(process.env.SMTP_PORT || '1025');
const smtpUser = process.env.SMTP_USER || undefined;
const smtpPass = process.env.SMTP_PASS || undefined;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendMail(to: string, subject: string, text: string, html?: string) {
  const from = process.env.MAIL_FROM || 'no-reply@capacitaciones.local';
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    // nodemailer returns info; log messageId for tracing
    // eslint-disable-next-line no-console
    console.log('[mailer] sent', info.messageId, 'to', to);
    return info;
  } catch (err) {
    // Don't rethrow to avoid failing the main request flow when SMTP is unreachable.
    // Log a concise warning so the developer knows deliveries failed in dev.
    // eslint-disable-next-line no-console
    console.warn('[mailer] failed to send mail to', to, (err && (err as any).message) || err);
    return null as any;
  }
}

export default transporter;
