import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { log } from './vite';

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

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
  if (!process.env.MAILGUN_API_KEY || !domain || !fromEmail) {
    log('Mailgun environment variables not set', 'email');
    return false;
  }

  try {
    const data = {
      from: fromEmail,
      to: [to],
      subject,
      text,
      html: html || text,
    };

    const response = await mg.messages.create(domain, data);
    log(`Email sent successfully: ${response.id}`, 'email');
    return true;
  } catch (error) {
    log(`Failed to send email: ${error}`, 'email');
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
  const subject = 'Password Reset Request';
  
  // Create full reset URL with token
  const fullResetUrl = `${resetUrl}?token=${resetToken}`;
  
  const text = `
    You requested to reset your password.
    
    Please click the link below to reset your password:
    ${fullResetUrl}
    
    If you did not request a password reset, please ignore this email.
    
    This link will expire in 1 hour.
  `;
  
  const html = `
    <p>You requested to reset your password.</p>
    <p>Please click the link below to reset your password:</p>
    <p><a href="${fullResetUrl}">Reset Password</a></p>
    <p>Or copy and paste this URL into your browser:</p>
    <p>${fullResetUrl}</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>This link will expire in 1 hour.</p>
  `;
  
  return sendEmail(to, subject, text, html);
}