import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_ABOUT_TEXT, DEFAULT_CATEGORIES, DEFAULT_HERO, DEFAULT_HERO_IMAGE, DEMO_PRODUCTS } from '../src/lib/constants.js';
import { ORDER_STATUSES, PAYMENT_METHODS, canTransition, isObjectId, normalizeEmail, parsePagination, validatePassword, cleanText } from './lib/validate.js';
import { OrderError, priceOrder } from './lib/pricing.js';
import { csrfProtection, newCsrfToken, parseOrigins, rateLimiter, securityHeaders } from './lib/security.js';
import { addressSpec, categorySpec, checkoutSpec, homepageSpec, pageSpec, productSpec, profileSpec, sanitize, sanitizeCartLines } from './lib/schemas.js';
import { sendPasswordReset } from './mailer.js';

const app = express();
const port = Number(process.env.PORT || 10000);
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const trustedOrigins = parseOrigins(process.env.CLIENT_ORIGIN || (isProduction ? '' : 'http://localhost:5173'));
if (!process.env.MONGODB_URI || !jwtSecret) throw new Error('MONGODB_URI and JWT_SECRET are required');
if (isProduction && (jwtSecret.length < 32 || trustedOrigins.size === 0)) throw new Error('Production requires JWT_SECRET (>=32 chars) and CLIENT_ORIGIN (exact origin[s], comma separated)');

const JWT_OPTS = { issuer: 'laxshobha', audience: 'laxshobha-web' };
const SESSION_TTL = { customer: 7 * 24 * 3600, admin: 8 * 3600 }; // seconds; admin sessions are deliberately short
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12); // equalises timing for unknown accounts

if (process.env.TRUST_PROXY) app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
app.disable('x-powered-by');
if (isProduction && !process.env.TRUST_PROXY) console.warn('TRUST_PROXY is not set: behind a reverse proxy all clients will share one rate-limit bucket. Set it to the number of proxy hops.');
app.use((req, res, next) => { req.id = crypto.randomUUID(); res.setHeader('X-Request-Id', req.id); const t = Date.now(); res.on('finish', () => console.log(JSON.stringify({ ts: new Date().toISOString(), id: req.id, method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - t }))); next(); });
app.use(securityHeaders({ isProduction }));
app.use(cors({ origin: (origin, cb) => cb(null, !origin || trustedOrigins.has(origin)), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const baseSchema = { timestamps: true, versionKey: false, toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id.toString(); for (const k of ['_id', 'passwordHash', 'googleSub', 'tokenVersion', 'resetTokenHash', 'resetExpires']) delete ret[k]; return ret; } } };
const User = mongoose.model('User', new mongoose.Schema({
  name: String, username: { type: String, unique: true, sparse: true }, email: { type: String, lowercase: true, trim: true, index: true }, passwordHash: String,
  phone: { type: String, default: '' }, photoURL: { type: String, default: '' }, wishlist: { type: [String], default: [] },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  googleSub: { type: String, unique: true, sparse: true }, emailVerified: { type: Boolean, default: false }, tokenVersion: { type: Number, default: 0 },
  resetTokenHash: { type: String, select: false }, resetExpires: { type: Date, select: false },
}, baseSchema));
const Product = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, salePrice: { type: Number, default: null }, stock: { type: Number, min: 0 }, description: String, review: { type: String, default: '' }, fabric: String, categoryId: String, categorySlug: String, sizes: [String], colors: [String], occasion: [String], isHotPick: Boolean, isFeatured: Boolean, published: { type: Boolean, index: true }, images: [String] }, baseSchema));
const Category = mongoose.model('Category', new mongoose.Schema({ name: String, slug: { type: String, index: true }, parentId: { type: String, default: null }, image: String }, baseSchema));
const Homepage = mongoose.model('Homepage', new mongoose.Schema({ key: { type: String, unique: true }, heroTitle: String, heroDescription: String, heroImage: String, aboutText: String, aboutImage: String, featuredProductIds: [String], scanTitle: String, scanDescription: String, scanProductIds: [String] }, baseSchema));
const Page = mongoose.model('Page', new mongoose.Schema({ slug: { type: String, unique: true, trim: true, lowercase: true }, name: String, title: String, metaTitle: String, metaDescription: String, content: String, published: { type: Boolean, default: true } }, baseSchema));
const Cart = mongoose.model('Cart', new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, unique: true }, items: Array }, baseSchema));
const Address = mongoose.model('Address', new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, index: true }, label: String, street: String, city: String, phone: String }, baseSchema));
const orderSchema = new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, index: true }, customerName: String, customerEmail: String, items: Array, subtotal: Number, total: Number, address: Object, paymentMethod: String, paymentStatus: { type: String, default: 'unpaid' }, status: { type: String, default: 'Pending', enum: ORDER_STATUSES }, statusHistory: Array }, baseSchema);
orderSchema.index({ createdAt: -1 });
const Order = mongoose.model('Order', orderSchema);
const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', new mongoose.Schema({ email: { type: String, required: true, unique: true, lowercase: true, trim: true } }, baseSchema));

async function seedContent() {
  if (!(await Product.exists())) await Product.insertMany(DEMO_PRODUCTS.map(({ id, ...product }) => ({ ...product, seedId: id })));
  if (!(await Category.exists())) await Category.insertMany(DEFAULT_CATEGORIES);
  if (!(await Homepage.exists({ key: 'main' }))) await Homepage.create({ key: 'main', heroTitle: DEFAULT_HERO.title, heroDescription: DEFAULT_HERO.text, heroImage: DEFAULT_HERO_IMAGE, aboutText: DEFAULT_ABOUT_TEXT, aboutImage: '', featuredProductIds: [] });
}

// ---- session helpers -------------------------------------------------------------------------
// Role is NEVER derived from usernames/emails at runtime. It lives only in the database and is changed by
// server/scripts/provision-admin.js (operator action). The token carries no role; it is read from the DB per request.
const cookieBase = { secure: isProduction, sameSite: 'lax', path: '/' };
const ttlFor = (user) => SESSION_TTL[user.role === 'admin' ? 'admin' : 'customer'];
function startSession(res, user) {
  const ttl = ttlFor(user);
  const token = jwt.sign({ sub: user.id, ver: user.tokenVersion || 0 }, jwtSecret, { algorithm: 'HS256', expiresIn: ttl, ...JWT_OPTS });
  res.cookie('session', token, { ...cookieBase, httpOnly: true, maxAge: ttl * 1000 });
  res.cookie('csrf', newCsrfToken(), { ...cookieBase, httpOnly: false, maxAge: ttl * 1000 });
}
function endSession(res) { res.clearCookie('session', cookieBase); res.clearCookie('csrf', cookieBase); }
async function userFromRequest(req) {
  const token = req.cookies?.session; if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'], ...JWT_OPTS });
    if (!isObjectId(String(payload.sub))) return null;
    const user = await User.findById(payload.sub);
    return user && (user.tokenVersion || 0) === (payload.ver || 0) ? user : null;
  } catch { return null; }
}
const publicUser = (user) => user.toJSON();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const body = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {});
const bad = (res, error) => res.status(400).json({ error });
async function auth(req, res, next) { const user = await userFromRequest(req); if (!user) return res.status(401).json({ error: 'Authentication required' }); req.user = user; next(); }
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access required' }));

// ---- middleware: CSRF + rate limits ----------------------------------------------------------
app.use('/api', (req, res, next) => { if (!req.cookies?.csrf) res.cookie('csrf', newCsrfToken(), { ...cookieBase, httpOnly: false }); next(); });
app.use('/api', csrfProtection({ trusted: trustedOrigins }));
const idKey = (req) => `${req.ip}:${normalizeEmail(body(req).email ?? '') || String(body(req).username ?? '').toLowerCase().slice(0, 100)}`;
const limitLogin = rateLimiter({ windowMs: 15 * 60_000, max: 10, keyFn: idKey });
const limitRegister = rateLimiter({ windowMs: 60 * 60_000, max: 10 });
const limitGoogle = rateLimiter({ windowMs: 15 * 60_000, max: 30 });
const limitReset = rateLimiter({ windowMs: 60 * 60_000, max: 5, keyFn: idKey });
const limitNewsletter = rateLimiter({ windowMs: 60 * 60_000, max: 10 });
const limitOrders = rateLimiter({ windowMs: 60 * 60_000, max: 30, keyFn: (req) => req.user?.id || req.ip });
app.use('/api', rateLimiter({ windowMs: 60_000, max: 600 }));

// ---- health ----------------------------------------------------------------------------------
app.get('/api/health', (_, res) => { const up = mongoose.connection.readyState === 1; res.status(up ? 200 : 503).json({ ok: up }); });

// ---- auth ------------------------------------------------------------------------------------
app.post('/api/auth/register', limitRegister, asyncRoute(async (req, res) => {
  const b = body(req); const email = normalizeEmail(b.email);
  const name = cleanText(b.name, 100), phone = cleanText(b.phone, 30), street = cleanText(b.street, 200), city = cleanText(b.city, 100);
  const pwErr = validatePassword(b.password);
  if (!name || !email || pwErr || phone.length < 5 || !street || !city) return bad(res, pwErr || 'Name, a valid email, password, phone, street, and city are required');
  if (await User.exists({ $or: [{ email }, { username: email }] })) return res.status(409).json({ error: 'We could not create an account with those details' });
  let user;
  try { user = await User.create({ name, username: email, email, phone, passwordHash: await bcrypt.hash(b.password, 12), role: 'customer', emailVerified: false }); }
  catch (err) { if (err?.code === 11000) return res.status(409).json({ error: 'We could not create an account with those details' }); throw err; }
  await Address.create({ userId: user.id, label: 'Home', street, city, phone });
  startSession(res, user);
  res.status(201).json({ user: publicUser(user) });
}));

app.post('/api/auth/login', limitLogin, asyncRoute(async (req, res) => {
  const b = body(req); const raw = b.email ?? b.username; // `username` accepted only for legacy clients
  const email = normalizeEmail(raw);
  const legacy = !email && typeof raw === 'string' && raw.length <= 100 ? raw.trim().toLowerCase() : '';
  const user = email ? await User.findOne({ email }) : legacy ? await User.findOne({ username: legacy }) : null;
  const ok = await bcrypt.compare(typeof b.password === 'string' ? b.password : '', user?.passwordHash || DUMMY_HASH);
  if (!user || !user.passwordHash || !ok) return res.status(401).json({ error: 'Invalid email or password' });
  startSession(res, user);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/google', limitGoogle, asyncRoute(async (req, res) => {
  if (!googleClient) return res.status(503).json({ error: 'Google sign-in is not available' });
  const credential = body(req).credential;
  if (typeof credential !== 'string' || !credential || credential.length > 4096) return bad(res, 'Google sign-in credential is required');
  let payload;
  try { payload = (await googleClient.verifyIdToken({ idToken: credential, audience: googleClientId })).getPayload(); }
  catch { return res.status(401).json({ error: 'Google sign-in could not be verified' }); }
  const email = normalizeEmail(payload?.email);
  if (!payload?.sub || !email || payload.email_verified !== true) return res.status(401).json({ error: 'Google sign-in could not be verified' });
  let user = await User.findOne({ googleSub: payload.sub });
  if (!user) {
    const existing = await User.findOne({ email });
    // Only link to an account whose email ownership is proven (Google-created or password-reset verified). An unverified
    // password account could have been pre-registered by someone else with this address, so it is never auto-linked.
    if (existing && existing.passwordHash && !existing.emailVerified) return res.status(409).json({ error: 'This email already has a password account. Sign in with your password.' });
    if (existing) { existing.googleSub = payload.sub; existing.emailVerified = true; if (!existing.photoURL && payload.picture) existing.photoURL = payload.picture; user = await existing.save(); }
    else user = await User.create({ name: cleanText(payload.name || email.split('@')[0], 100), username: email, email, passwordHash: '', photoURL: typeof payload.picture === 'string' && payload.picture.startsWith('https://') ? payload.picture : '', role: 'customer', emailVerified: true, googleSub: payload.sub });
  }
  startSession(res, user);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/logout', (_, res) => { endSession(res); res.status(204).end(); });
app.post('/api/auth/logout-all', auth, asyncRoute(async (req, res) => { await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } }); endSession(res); res.status(204).end(); }));
app.get('/api/auth/me', asyncRoute(async (req, res) => { const user = await userFromRequest(req); res.json({ user: user ? publicUser(user) : null }); }));

// Password reset. Tokens are random, single-use, stored only as SHA-256, expire in 30 minutes. Always answers 202 (no enumeration).
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
app.post('/api/auth/password-reset/request', limitReset, asyncRoute(async (req, res) => {
  const email = normalizeEmail(body(req).email);
  const user = email ? await User.findOne({ email }) : null;
  if (user) {
    const token = crypto.randomBytes(32).toString('base64url');
    await User.updateOne({ _id: user.id }, { resetTokenHash: sha256(token), resetExpires: new Date(Date.now() + 30 * 60_000) });
    const origin = [...trustedOrigins][0] || 'http://localhost:5173';
    sendPasswordReset({ to: user.email, resetUrl: `${origin}/reset-password#token=${token}` }).catch((e) => console.error('reset mail failed:', e.message));
  }
  res.status(202).json({ ok: true });
}));
app.post('/api/auth/password-reset/confirm', limitReset, asyncRoute(async (req, res) => {
  const b = body(req); const pwErr = validatePassword(b.password);
  if (typeof b.token !== 'string' || b.token.length < 20 || b.token.length > 200 || pwErr) return bad(res, pwErr || 'Reset link is invalid or has expired');
  const user = await User.findOne({ resetTokenHash: sha256(b.token), resetExpires: { $gt: new Date() } }).select('+resetTokenHash +resetExpires');
  if (!user) return bad(res, 'Reset link is invalid or has expired');
  user.passwordHash = await bcrypt.hash(b.password, 12); user.emailVerified = true; user.tokenVersion = (user.tokenVersion || 0) + 1; user.resetTokenHash = undefined; user.resetExpires = undefined;
  await user.save();
  endSession(res); res.json({ ok: true });
}));

// ---- public catalogue (published only) -------------------------------------------------------
app.get('/api/products', asyncRoute(async (req, res) => { const { limit, skip } = parsePagination(req.query, { defaultLimit: 200, maxLimit: 200 }); res.json(await Product.find({ published: true }).sort({ createdAt: -1 }).skip(skip).limit(limit)); }));
app.get('/api/products/:id', asyncRoute(async (req, res) => { const product = isObjectId(req.params.id) ? await Product.findOne({ _id: req.params.id, published: true }) : null; if (!product) return res.status(404).json({ error: 'Product not found' }); res.json(product); }));
app.get('/api/categories', asyncRoute(async (_, res) => res.json(await Category.find().sort({ name: 1 }).limit(500))));
app.get('/api/homepage', asyncRoute(async (_, res) => res.json((await Homepage.findOne({ key: 'main' })) || {})));
app.get('/api/pages/:slug', asyncRoute(async (req, res) => { const page = await Page.findOne({ slug: String(req.params.slug).toLowerCase().slice(0, 80), published: true }); if (!page) return res.status(404).json({ error: 'Page not found' }); res.json(page); }));
app.post('/api/newsletter', limitNewsletter, asyncRoute(async (req, res) => {
  const email = normalizeEmail(body(req).email); if (!email) return bad(res, 'Enter a valid email address');
  await NewsletterSubscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  res.status(201).json({ subscribed: true });
}));

// ---- customer (everything scoped to req.user.id; ids are never taken from the body) ----------
app.use('/api/me', auth);
app.get('/api/me', (req, res) => res.json({ user: publicUser(req.user) }));
app.patch('/api/me', asyncRoute(async (req, res) => {
  const { value, error } = sanitize(body(req), profileSpec); if (error) return bad(res, 'Name and phone are required');
  const update = { name: value.name, phone: value.phone }; if (typeof value.photoURL === 'string') update.photoURL = value.photoURL;
  res.json({ user: publicUser(await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true })) });
}));
app.get('/api/me/cart', asyncRoute(async (req, res) => res.json((await Cart.findOne({ userId: req.user.id }))?.items || [])));
app.put('/api/me/cart', asyncRoute(async (req, res) => { const items = sanitizeCartLines(body(req).items ?? []); if (!items) return bad(res, 'Invalid cart'); res.json((await Cart.findOneAndUpdate({ userId: req.user.id }, { userId: req.user.id, items }, { upsert: true, new: true })).items); }));
app.get('/api/me/wishlist', asyncRoute(async (req, res) => {
  const ids = (req.user.wishlist || []).map(String);
  const products = await Product.find({ _id: { $in: ids.filter(isObjectId) }, published: true });
  res.json({ products, ids });
}));
app.put('/api/me/wishlist/:productId', asyncRoute(async (req, res) => {
  const id = req.params.productId; if (!isObjectId(id)) return bad(res, 'Invalid product');
  const saved = body(req).saved === true; const ids = (req.user.wishlist || []).map(String);
  if (saved && !ids.includes(id) && ids.length >= 200) return bad(res, 'Wishlist is full');
  await User.updateOne({ _id: req.user.id }, saved ? { $addToSet: { wishlist: id } } : { $pull: { wishlist: id } });
  res.json({ saved });
}));
app.get('/api/me/addresses', asyncRoute(async (req, res) => res.json(await Address.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50))));
app.post('/api/me/addresses', asyncRoute(async (req, res) => {
  const { value, error } = sanitize(body(req), addressSpec); if (error) return bad(res, 'Street, city, and phone are required');
  if ((await Address.countDocuments({ userId: req.user.id })) >= 20) return bad(res, 'Address limit reached');
  res.status(201).json(await Address.create({ ...value, label: value.label || 'Home', userId: req.user.id }));
}));
app.delete('/api/me/addresses/:id', asyncRoute(async (req, res) => { if (!isObjectId(req.params.id)) return bad(res, 'Invalid address'); await Address.deleteOne({ _id: req.params.id, userId: req.user.id }); res.status(204).end(); }));
app.get('/api/me/orders', asyncRoute(async (req, res) => { const { limit, skip } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 }); res.json(await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit)); }));

// Order creation: the client supplies only {items:[{productId,quantity,size,color}], address, paymentMethod, customerName}.
// Prices/totals/names/status/payment state are computed here. Stock is reserved with atomic conditional decrements
// (works on standalone MongoDB; compensated on failure) so concurrent buyers cannot oversell.
app.post('/api/me/orders', limitOrders, asyncRoute(async (req, res) => {
  const b = body(req);
  const { value, error } = sanitize(b, checkoutSpec); if (error) return bad(res, 'Name and payment method are required');
  if (!PAYMENT_METHODS.includes(value.paymentMethod)) return bad(res, 'Unsupported payment method');
  const addr = sanitize(b.address, addressSpec); if (addr.error) return bad(res, 'A delivery address with street, city, and phone is required');
  const lines = Array.isArray(b.items) ? b.items : null;
  const ids = [...new Set((lines || []).map((l) => String(l?.productId)).filter(isObjectId))];
  const products = await Product.find({ _id: { $in: ids } });
  const priced = priceOrder(lines, new Map(products.map((p) => [p.id, p])));
  const reserved = [];
  try {
    for (const [productId, qty] of priced.wanted) {
      const r = await Product.updateOne({ _id: productId, published: true, stock: { $gte: qty } }, { $inc: { stock: -qty } });
      if (r.modifiedCount !== 1) throw new OrderError('Not enough stock for an item in your cart', 409, 'OUT_OF_STOCK');
      reserved.push([productId, qty]);
    }
    const order = await Order.create({ userId: req.user.id, customerName: value.customerName, customerEmail: req.user.email || '', items: priced.items, subtotal: priced.subtotal, total: priced.total, address: { street: addr.value.street, city: addr.value.city, phone: addr.value.phone }, paymentMethod: value.paymentMethod, paymentStatus: 'unpaid', status: 'Pending', statusHistory: [{ status: 'Pending', at: new Date() }] });
    res.status(201).json(order);
  } catch (err) {
    await Promise.allSettled(reserved.map(([id, qty]) => Product.updateOne({ _id: id }, { $inc: { stock: qty } })));
    throw err;
  }
}));

// ---- admin (authorisation enforced here, never by React guards) ------------------------------
app.use('/api/admin', auth, admin);
const adminPage = (req) => parsePagination(req.query, { defaultLimit: 100, maxLimit: 200 });
async function productPayload(req, partial) {
  const { value, error } = sanitize(body(req), productSpec, { partial }); if (error) return { error };
  if (!partial) { value.published ??= true; value.stock ??= 0; }
  if (value.categoryId && !value.categorySlug) {
    const cat = value.categoryId.startsWith('slug:') ? await Category.findOne({ slug: value.categoryId.slice(5) }) : isObjectId(value.categoryId) ? await Category.findById(value.categoryId) : null;
    if (cat) value.categorySlug = cat.slug;
  }
  return { value };
}
app.get('/api/admin/dashboard', asyncRoute(async (_, res) => res.json({ products: await Product.find().sort({ createdAt: -1 }).limit(1000), orders: await Order.find().sort({ createdAt: -1 }).limit(500) })));
app.get('/api/admin/products', asyncRoute(async (req, res) => { const { limit, skip } = parsePagination(req.query, { defaultLimit: 1000, maxLimit: 1000 }); res.json(await Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit)); }));
app.post('/api/admin/products', asyncRoute(async (req, res) => { const p = await productPayload(req, false); if (p.error) return bad(res, p.error); res.status(201).json(await Product.create(p.value)); }));
app.patch('/api/admin/products/:id', asyncRoute(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const p = await productPayload(req, true); if (p.error) return bad(res, p.error);
  const product = await Product.findByIdAndUpdate(req.params.id, p.value, { new: true, runValidators: true }); if (!product) return res.status(404).json({ error: 'Product not found' }); res.json(product);
}));
app.delete('/api/admin/products/:id', asyncRoute(async (req, res) => { if (isObjectId(req.params.id)) await Product.findByIdAndDelete(req.params.id); res.status(204).end(); }));
app.get('/api/admin/categories', asyncRoute(async (_, res) => res.json(await Category.find().sort({ name: 1 }).limit(500))));
app.post('/api/admin/categories', asyncRoute(async (req, res) => { const { value, error } = sanitize(body(req), categorySpec); if (error) return bad(res, error); res.status(201).json(await Category.create(value)); }));
app.delete('/api/admin/categories/:id', asyncRoute(async (req, res) => { if (isObjectId(req.params.id)) await Category.findByIdAndDelete(req.params.id); res.status(204).end(); }));
app.get('/api/admin/orders', asyncRoute(async (req, res) => { const { limit, skip } = adminPage(req); res.json(await Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit)); }));
app.get('/api/admin/pages', asyncRoute(async (_, res) => res.json(await Page.find().sort({ name: 1 }).limit(200))));
app.post('/api/admin/pages', asyncRoute(async (req, res) => { const { value, error } = sanitize(body(req), pageSpec); if (error) return bad(res, error); res.status(201).json(await Page.create(value)); }));
app.patch('/api/admin/pages/:id', asyncRoute(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(404).json({ error: 'Page not found' });
  const { value, error } = sanitize(body(req), pageSpec, { partial: true }); if (error) return bad(res, error);
  const page = await Page.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true }); if (!page) return res.status(404).json({ error: 'Page not found' }); res.json(page);
}));
app.delete('/api/admin/pages/:id', asyncRoute(async (req, res) => { if (isObjectId(req.params.id)) await Page.findByIdAndDelete(req.params.id); res.status(204).end(); }));
app.patch('/api/admin/orders/:id', asyncRoute(async (req, res) => {
  const to = body(req).status; if (!isObjectId(req.params.id)) return res.status(404).json({ error: 'Order not found' });
  if (!ORDER_STATUSES.includes(to)) return bad(res, 'Invalid status');
  const order = await Order.findById(req.params.id); if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!canTransition(order.status, to)) return res.status(409).json({ error: `Cannot change an order from ${order.status} to ${to}` });
  // Conditional on the current status so two concurrent updates cannot both apply (and a cancel restocks exactly once).
  const updated = await Order.findOneAndUpdate({ _id: order.id, status: order.status }, { status: to, $push: { statusHistory: { status: to, at: new Date(), by: req.user.id } } }, { new: true });
  if (!updated) return res.status(409).json({ error: 'Order was modified by someone else. Reload and retry.' });
  if (to === 'Cancelled') await Promise.allSettled((order.items || []).map((i) => isObjectId(String(i.productId)) && Product.updateOne({ _id: i.productId }, { $inc: { stock: Number(i.quantity) || 0 } })));
  res.json(updated);
}));
app.put('/api/admin/homepage', asyncRoute(async (req, res) => { const { value, error } = sanitize(body(req), homepageSpec, { partial: true }); if (error) return bad(res, error); res.json(await Homepage.findOneAndUpdate({ key: 'main' }, { ...value, key: 'main' }, { upsert: true, new: true, runValidators: true })); }));

// ---- static app, 404s, errors ----------------------------------------------------------------
app.use('/api', (_, res) => res.status(404).json({ error: 'Not found' }));
const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (isProduction) {
  const dist = path.join(__dirname, '../dist');
  app.use(express.static(dist, { index: false, setHeaders: (res, p) => { if (p.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); } }));
  app.get('/{*splat}', (_, res) => res.sendFile(path.join(dist, 'index.html'))); // Express 5 syntax; bare '*' throws
}
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof OrderError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) return bad(res, 'Malformed request body');
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (err?.name === 'CastError' || err?.name === 'ValidationError') return bad(res, 'Invalid input');
  if (err?.code === 11000) return res.status(409).json({ error: 'That value already exists' });
  console.error(JSON.stringify({ id: req.id, error: err?.message, stack: isProduction ? undefined : err?.stack }));
  res.status(500).json({ error: 'Internal server error', requestId: req.id });
});

// ---- startup / shutdown ----------------------------------------------------------------------
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.warn('MongoDB reconnected'));
let server;
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000, maxPoolSize: 20 }).then(async () => {
  await seedContent();
  server = app.listen(port, () => console.log(`Server listening on ${port}`));
}).catch((err) => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
async function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  const force = setTimeout(() => process.exit(1), 10_000); force.unref();
  await new Promise((r) => (server ? server.close(r) : r()));
  await mongoose.disconnect().catch(() => {});
  process.exit(0);
}
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => shutdown(s));
