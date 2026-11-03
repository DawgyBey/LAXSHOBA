import twilio from 'twilio';

const client = process.env.TWILIO_SID && process.env.TWILIO_AUTH
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH)
  : null;

/**
 * Send a WhatsApp alert to the admin.
 * In dev mode: prints to console.
 * In production: sends via Twilio.
 */
export async function sendWhatsAppAlert(message) {
  // If we are developing locally, just print to console
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n=================================================`);
    console.log(`[DEV WA] WhatsApp alert: ${message}`);
    console.log(`=================================================\n`);
    return true;
  }

  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
  const to = process.env.ADMIN_PHONE?.trim();
  if (!client || !from || !to) {
    console.warn('[twilio] WhatsApp credentials, sender, or admin number are missing. WhatsApp alert NOT sent.');
    return false;
  }
  if (![from, to].every((phone) => /^\+[1-9]\d{7,14}$/.test(phone))) {
    console.error('[twilio] WhatsApp sender and admin number must be in E.164 format. WhatsApp alert NOT sent.');
    return false;
  }

  try {
    const response = await client.messages.create({
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log('[twilio] WhatsApp alert sent', response.sid);
    return true;
  } catch (error) {
    console.error('[twilio] FAILED to send WhatsApp alert:', error);
    return false;
  }
}