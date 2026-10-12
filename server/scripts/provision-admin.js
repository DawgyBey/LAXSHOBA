// Operator-only admin provisioning. Dry-run by default.
//   node server/scripts/provision-admin.js --email owner@example.com            (shows what would change)
//   node server/scripts/provision-admin.js --email owner@example.com --apply    (promotes an EXISTING user)
//   node server/scripts/provision-admin.js --email owner@example.com --demote --apply
// Promotion bumps tokenVersion so any prior sessions are invalidated. If ADMIN_EMAILS is set, the email must be in it
// (exact, normalised, full-address match). No passwords or secrets are ever printed.
import 'dotenv/config';
import mongoose from 'mongoose';
import { normalizeEmail } from '../lib/validate.js';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const email = normalizeEmail(args[args.indexOf('--email') + 1]);
if (!email) { console.error('Usage: --email <address> [--demote] [--apply]'); process.exit(2); }
const allow = (process.env.ADMIN_EMAILS || '').split(',').map(normalizeEmail).filter(Boolean);
if (!flag('demote') && allow.length && !allow.includes(email)) { console.error('Refusing: email is not in ADMIN_EMAILS.'); process.exit(3); }
if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is required'); process.exit(2); }

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
const users = mongoose.connection.collection('users');
const user = await users.findOne({ email });
if (!user) { console.error('No user with that email. Have them sign up first (customer role), then re-run.'); await mongoose.disconnect(); process.exit(4); }
const role = flag('demote') ? 'customer' : 'admin';
console.log(`${user.role} -> ${role} for ${email} (${flag('apply') ? 'APPLYING' : 'dry run; add --apply to commit'})`);
if (flag('apply') && user.role !== role) {
  await users.updateOne({ _id: user._id }, { $set: { role }, $inc: { tokenVersion: 1 } });
  console.log('Done. Existing sessions for this user were invalidated.');
}
await mongoose.disconnect();
