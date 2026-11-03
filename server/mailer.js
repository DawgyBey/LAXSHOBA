import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send a password reset email.
 * In dev mode: prints to console (no network call).
 * In production: sends via Resend.
 */
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

/**
 * Send a new order alert to the admin via email.
 * In dev mode: prints to console.
 * In production: sends via Resend.
 */
export async function sendAdminOrderAlert(order) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV MAILER] New order alert: ${order.customerName}, Rs. ${order.total}, ${order.items.length} item(s)`);
    return true;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  if (!adminEmails.length) {
    console.warn('[mailer] No ADMIN_EMAILS configured. Admin order alert NOT sent.');
    return false;
  }
  if (!resend) {
    console.warn('[mailer] RESEND_API_KEY is missing. Admin order alert NOT sent.');
    return false;
  }
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

  // Send to each admin email
  const results = await Promise.allSettled(
    adminEmails.map(email =>
      resend.emails.send({
        from: 'Laxshobha <onboarding@resend.dev>',
        to: [email],
        subject: `New Order Alert: ${String(order.customerName).replace(/[\r\n]/g, ' ')}`,
        html: `<p>New order received!</p>
                 <p>Total: Rs. ${Number(order.total)}</p>
                 <p>Customer: ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
                 <p>Items: ${order.items.length}</p>`,
      })
    )
  );

  results.forEach((r, i) => {
    const email = adminEmails[i];
    if (r.status === 'fulfilled') {
      console.log(`[mailer] Order alert sent to ${email}`);
    } else {
      console.error(`[mailer] FAILED to send order alert to ${email}:`, r.reason);
    }
  });

  return results.some(r => r.status === 'fulfilled');
}
