import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);
const getMailFrom = () => process.env.MAIL_FROM || 'Laxshobha <no-reply@laxufancystore.com.np>';
const safeText = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

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
      from: getMailFrom(),
      to: [to],
      subject: 'Reset your Laxshobha password',
      html: `<p>Click <a href="${escapeHtml(resetUrl)}">here</a> to reset your password.</p>`,
    });

    console.log(`[mailer] Email sent to ${to}`, response);
    return true;
  } catch (error) {
    console.error('[mailer] FAILED to send email:', error);
    return false;
  }
}

export async function sendCustomerOrderConfirmation(order) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV MAILER] Customer order confirmation: #${order.id || order._id || 'new'} ${order.customerName}, Rs. ${order.total}`);
    return true;
  }

  const email = (order.customerEmail || '').trim();
  if (!email) {
    console.warn('[mailer] No customer email on order; confirmation email not sent.');
    return false;
  }
  if (!resend) {
    console.warn('[mailer] RESEND_API_KEY is missing. Customer confirmation email NOT sent.');
    return false;
  }

  const itemRows = (order.items || []).map((item) => {
    const name = escapeHtml(item.name || 'Item');
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const line = price * qty;
    return `<tr><td>${name}${item.size ? ` (${escapeHtml(item.size)})` : ''}${item.color ? ` / ${escapeHtml(item.color)}` : ''}</td><td>${qty}</td><td>Rs. ${line}</td></tr>`;
  }).join('');
  const address = order.address || {};
  const html = `
    <p>Thank you for your order, ${escapeHtml(order.customerName || 'Customer')}.</p>
    <p>Your order ID is <strong>#${escapeHtml(String(order.id || order._id || ''))}</strong>.</p>
    <table><thead><tr><th>Item</th><th>Qty</th><th>Total</th></tr></thead><tbody>${itemRows || '<tr><td colspan="3">No items</td></tr>'}</tbody></table>
    <p><strong>Subtotal:</strong> Rs. ${Number(order.subtotal || 0)}</p>
    <p><strong>Delivery:</strong> Rs. ${Number(order.deliveryFee || 0)}</p>
    <p><strong>Total:</strong> Rs. ${Number(order.total || 0)}</p>
    <p><strong>Payment method:</strong> ${escapeHtml(order.paymentMethod || '—')}</p>
    <p><strong>Delivery address:</strong> ${escapeHtml(safeText(address.street || ''))}${address.street ? ', ' : ''}${escapeHtml(safeText(address.city || ''))}${address.phone ? `, ${escapeHtml(safeText(address.phone))}` : ''}</p>
  `;

  const response = await resend.emails.send({
    from: getMailFrom(),
    to: [email],
    subject: `Your Laxshobha order #${String(order.id || order._id || '')}`,
    html,
  });

  console.log(`[mailer] Order confirmation sent to ${email}`, response);
  return true;
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

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
  if (!adminEmails.length) {
    console.warn('[mailer] No ADMIN_EMAILS configured. Admin order alert NOT sent.');
    return false;
  }
  if (!resend) {
    console.warn('[mailer] RESEND_API_KEY is missing. Admin order alert NOT sent.');
    return false;
  }

  const results = await Promise.allSettled(
    adminEmails.map((email) =>
      resend.emails.send({
        from: getMailFrom(),
        to: [email],
        subject: `New Order Alert: ${safeText(order.customerName)}`,
        html: `<p>New order received!</p>
                 <p>Order ID: ${escapeHtml(String(order.id || order._id || ''))}</p>
                 <p>Subtotal: Rs. ${Number(order.subtotal || 0)}</p>
                 <p>Delivery: Rs. ${Number(order.deliveryFee || 0)}</p>
                 <p>Total: Rs. ${Number(order.total)}</p>
                 <p>Customer: ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
                 <p>Items: ${order.items.length}</p>`,
      }),
    ),
  );

  results.forEach((r, i) => {
    const email = adminEmails[i];
    if (r.status === 'fulfilled') {
      console.log(`[mailer] Order alert sent to ${email}`);
    } else {
      console.error(`[mailer] FAILED to send order alert to ${email}:`, r.reason);
    }
  });

  return results.some((r) => r.status === 'fulfilled');
}
