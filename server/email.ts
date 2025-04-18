import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Initialize Mailgun client
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

// Validate and get mailer configuration from environment variables
if (!process.env.MAILGUN_API_KEY) {
  console.warn('MAILGUN_API_KEY is not set. Email sending will not work.');
}

if (!process.env.MAILGUN_DOMAIN) {
  console.warn('MAILGUN_DOMAIN is not set. Email sending will not work.');
}

if (!process.env.MAILGUN_FROM_EMAIL) {
  console.warn('MAILGUN_FROM_EMAIL is not set. Email sending will not work.');
}

const domain = process.env.MAILGUN_DOMAIN || '';
const fromEmail = process.env.MAILGUN_FROM_EMAIL || '';

/**
 * Send an email using Mailgun
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text email body
 * @param html - HTML email body (optional)
 * @returns Promise resolving to boolean indicating success
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  try {
    // Bail early if configuration is missing
    if (!process.env.MAILGUN_API_KEY || !domain || !fromEmail) {
      console.error('Email configuration is incomplete.');
      return false;
    }

    // Send email with Mailgun
    const result = await mg.messages.create(domain, {
      from: fromEmail,
      to: [to],
      subject,
      text,
      html: html || text,
    });

    console.log('Email sent:', result.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a password reset email
 * @param to - Recipient email address
 * @param resetToken - Password reset token
 * @param resetUrl - Base URL for the reset password page
 * @returns Promise resolving to boolean indicating success
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  resetUrl: string
): Promise<boolean> {
  const resetLink = `${resetUrl}?token=${resetToken}`;
  
  const subject = 'Password Reset Request';
  const text = `
    Hello,
    
    You requested to reset your password. Please click on the link below to reset your password:
    
    ${resetLink}
    
    If you did not request a password reset, please ignore this email and your password will remain unchanged.
    
    This link will expire in 1 hour.
  `;
  
  const html = `
    <p>Hello,</p>
    <p>You requested to reset your password. Please click on the link below to reset your password:</p>
    <p><a href="${resetLink}" target="_blank">Reset Password</a></p>
    <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
    <p>This link will expire in 1 hour.</p>
  `;
  
  return sendEmail(to, subject, text, html);
}