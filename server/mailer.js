import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordReset({ to, resetUrl }) {
  // If we are developing locally, just print to console (Instant, cannot hang)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n=================================================`);
    console.log(`[DEV MAILER] Password reset for ${to}`);
    console.log(`Link: ${resetUrl}`);
    console.log(`=================================================\n`);
    return true;
  }

  // If in production and no API key, warn and return
  if (!resend) {
    console.warn('[mailer] RESEND_API_KEY is missing. Email NOT sent.');
    return false;
  }

  try {
    // This makes the network request to Resend
    const response = await resend.emails.send({
      from: 'Laxshobha <onboarding@resend.dev>',
      to: [to],
      subject: 'Reset your Laxshobha password',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });
    
    console.log(`[mailer] Email sent to ${to}`, response);
    return true;
  } catch (error) {
    console.error('[mailer] FAILED to send email:', error);
    return false; 
  }
}