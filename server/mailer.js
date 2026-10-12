// Transactional email boundary. NO provider is configured: wire a real one (SES, Postmark, Resend, ...) here.
// Returns true only if a message was actually handed to a provider.
export async function sendPasswordReset({ to, resetUrl }) {
  if (process.env.NODE_ENV !== 'production') { console.log(`[dev mailer] password reset for ${to}: ${resetUrl}`); return true; }
  console.warn('[mailer] no email provider configured; password reset email NOT sent');
  return false;
}
