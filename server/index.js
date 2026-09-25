import 'dotenv/config';
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

const app = express();
const port = Number(process.env.PORT || 10000);
const isProduction = process.env.NODE_ENV === 'production';
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const jwtSecret = process.env.JWT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
if (!process.env.MONGODB_URI || !jwtSecret) throw new Error('MONGODB_URI and JWT_SECRET are required');

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const schemaOptions = { timestamps: true, versionKey: false, toJSON: { virtuals: true, transform: (_, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.passwordHash; return ret; } } };
const User = mongoose.model('User', new mongoose.Schema({ name: String, email: { type: String, unique: true, lowercase: true, trim: true }, passwordHash: String, phone: { type: String, default: '' }, photoURL: { type: String, default: '' }, wishlist: { type: [String], default: [] }, role: { type: String, enum: ['customer', 'admin'], default: 'customer' } }, schemaOptions));
const Product = mongoose.model('Product', new mongoose.Schema({ name: String, price: Number, salePrice: { type: Number, default: null }, stock: Number, description: String, review: { type: String, default: '' }, fabric: String, categoryId: String, categorySlug: String, sizes: [String], colors: [String], occasion: [String], isHotPick: Boolean, isFeatured: Boolean, published: Boolean, images: [String] }, schemaOptions));
const Category = mongoose.model('Category', new mongoose.Schema({ name: String, slug: String, parentId: { type: String, default: null }, image: String }, schemaOptions));
const Homepage = mongoose.model('Homepage', new mongoose.Schema({ key: { type: String, unique: true }, heroTitle: String, heroDescription: String, heroImage: String, aboutText: String, aboutImage: String, featuredProductIds: [String] }, schemaOptions));
const Page = mongoose.model('Page', new mongoose.Schema({ slug: { type: String, unique: true, trim: true, lowercase: true }, name: String, title: String, metaTitle: String, metaDescription: String, content: String, published: { type: Boolean, default: true } }, schemaOptions));
const Cart = mongoose.model('Cart', new mongoose.Schema({ userId: { type: mongoose.Types.ObjectId, unique: true }, items: Array }, schemaOptions));
const Address = mongoose.model('Address', new mongoose.Schema({ userId: mongoose.Types.ObjectId, label: String, street: String, city: String, phone: String }, schemaOptions));
const Order = mongoose.model('Order', new mongoose.Schema({ userId: mongoose.Types.ObjectId, customerName: String, customerEmail: String, items: Array, subtotal: Number, total: Number, address: Object, paymentMethod: String, status: { type: String, default: 'Pending' }, statusHistory: Array }, schemaOptions));

async function seedContent() {
 if (!(await Product.exists())) {
  await Product.insertMany(DEMO_PRODUCTS.map(({ id, ...product }) => ({ ...product, seedId: id })));
 }
 if (!(await Category.exists())) await Category.insertMany(DEFAULT_CATEGORIES);
 if (!(await Homepage.exists({ key: 'main' }))) {
  await Homepage.create({
   key: 'main',
   heroTitle: DEFAULT_HERO.title,
   heroDescription: DEFAULT_HERO.text,
   heroImage: DEFAULT_HERO_IMAGE,
   aboutText: DEFAULT_ABOUT_TEXT,
   aboutImage: '',
   featuredProductIds: [],
  });
 }
}

function tokenFor(user) { return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' }); }
function isAdminEmail(email) { return process.env.ADMIN_EMAILS?.split(',').map((x) => x.trim().toLowerCase()).includes(email.toLowerCase()); }
function setSession(res, user) { res.cookie('session', tokenFor(user), { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 }); }
function publicUser(user) { return user.toJSON(); }
async function auth(req, res, next) { try { const token = req.cookies.session; if (!token) return res.status(401).json({ error: 'Authentication required' }); const payload = jwt.verify(token, jwtSecret); const user = await User.findById(payload.sub); if (!user) return res.status(401).json({ error: 'Authentication required' }); req.user = user; next(); } catch { res.status(401).json({ error: 'Authentication required' }); } }
function admin(req, res, next) { return req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access required' }); }
function asyncRoute(handler) { return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next); }
function cleanUpdate(body) { const allowed = ['name', 'price', 'salePrice', 'stock', 'description', 'review', 'fabric', 'categoryId', 'categorySlug', 'sizes', 'colors', 'occasion', 'isHotPick', 'isFeatured', 'published', 'images']; return Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key))); }

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.post('/api/auth/register', asyncRoute(async (req, res) => {
	const { name, email, password, phone, street, city } = req.body;
	if (!name?.trim() || !email || !password || password.length < 8 || !phone?.trim() || !street?.trim() || !city?.trim()) return res.status(400).json({ error: 'Name, email, password, phone, street, and city are required' });
	const exists = await User.exists({ email: email.toLowerCase() });
	if (exists) return res.status(409).json({ error: 'An account with that email already exists' });
	const user = await User.create({ name: name.trim(), email, phone: phone.trim(), passwordHash: await bcrypt.hash(password, 12), role: process.env.ADMIN_EMAILS?.split(',').map((x) => x.trim().toLowerCase()).includes(email.toLowerCase()) ? 'admin' : 'customer' });
	await Address.create({ userId: user.id, label: 'Home', street: street.trim(), city: city.trim(), phone: phone.trim() });
	setSession(res, user);
	res.status(201).json({ user: publicUser(user) });
}));
app.post('/api/auth/login', asyncRoute(async (req, res) => { const user = await User.findOne({ email: req.body.email?.toLowerCase() }); if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' }); if (isAdminEmail(user.email) && user.role !== 'admin') { user.role = 'admin'; await user.save(); } setSession(res, user); res.json({ user: publicUser(user) }); }));
app.post('/api/auth/google', asyncRoute(async (req, res) => {
	if (!googleClient) return res.status(503).json({ error: 'Google sign-in is not configured on the server' });
	if (!req.body.credential) return res.status(400).json({ error: 'Google sign-in credential is required' });

	let ticket;
	try {
		ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: googleClientId });
	} catch (error) {
		console.error('Google token verification failed:', error.message);
		return res.status(401).json({ error: 'Google sign-in could not be verified. Check the OAuth client configuration.' });
	}
	const payload = ticket.getPayload();
	if (!payload?.email || !payload.email_verified) return res.status(401).json({ error: 'Google account email could not be verified' });

	const email = payload.email.toLowerCase();
	let user = await User.findOne({ email });
	if (!user) {
		user = await User.create({
			name: payload.name || payload.email.split('@')[0],
			email,
			passwordHash: '',
			photoURL: payload.picture || '',
			role: process.env.ADMIN_EMAILS?.split(',').map((x) => x.trim().toLowerCase()).includes(email) ? 'admin' : 'customer',
		});
	} else if (payload.picture && user.photoURL !== payload.picture) {
		user.photoURL = payload.picture;
		await user.save();
	}
	if (isAdminEmail(email) && user.role !== 'admin') {
		user.role = 'admin';
		await user.save();
	}

	setSession(res, user);
	res.json({ user: publicUser(user) });
}));
app.post('/api/auth/logout', (_, res) => { res.clearCookie('session'); res.status(204).end(); });
app.get('/api/auth/me', asyncRoute(async (req, res) => { if (!req.cookies.session) return res.json({ user: null }); try { const payload = jwt.verify(req.cookies.session, jwtSecret); const user = await User.findById(payload.sub); if (user && isAdminEmail(user.email) && user.role !== 'admin') { user.role = 'admin'; await user.save(); } res.json({ user: user ? publicUser(user) : null }); } catch { res.json({ user: null }); } }));

app.get('/api/products', asyncRoute(async (req, res) => { const filter = req.query.published === 'true' ? { published: true } : {}; res.json(await Product.find(filter).sort({ createdAt: -1 })); }));
app.get('/api/products/:id', asyncRoute(async (req, res) => { const product = await Product.findById(req.params.id); if (!product) return res.status(404).json({ error: 'Product not found' }); res.json(product); }));
app.get('/api/categories', asyncRoute(async (_, res) => res.json(await Category.find().sort({ name: 1 }))));
app.get('/api/homepage', asyncRoute(async (_, res) => res.json((await Homepage.findOne({ key: 'main' })) || {})));
app.get('/api/pages/:slug', asyncRoute(async (req, res) => { const page = await Page.findOne({ slug: req.params.slug, published: true }); if (!page) return res.status(404).json({ error: 'Page not found' }); res.json(page); }));

app.use('/api/me', auth);
app.get('/api/me', (req, res) => res.json({ user: publicUser(req.user) }));
app.patch('/api/me', asyncRoute(async (req, res) => { if (!req.body.name?.trim() || !req.body.phone?.trim()) return res.status(400).json({ error: 'Name and phone are required' }); const update = { name: req.body.name.trim(), phone: req.body.phone.trim() }; if (typeof req.body.photoURL === 'string') update.photoURL = req.body.photoURL; const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }); res.json({ user: publicUser(user) }); }));
app.get('/api/me/cart', asyncRoute(async (req, res) => res.json((await Cart.findOne({ userId: req.user.id }))?.items || [])));
app.put('/api/me/cart', asyncRoute(async (req, res) => { const cart = await Cart.findOneAndUpdate({ userId: req.user.id }, { userId: req.user.id, items: Array.isArray(req.body.items) ? req.body.items : [] }, { upsert: true, new: true }); res.json(cart.items); }));
app.get('/api/me/wishlist', asyncRoute(async (req, res) => {
 const user = await User.findById(req.user.id);
 const ids = (user.wishlist || []).map(String);
 const productIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
 const products = await Product.find({ _id: { $in: productIds } });
 res.json({ products, ids });
}));
app.put('/api/me/wishlist/:productId', asyncRoute(async (req, res) => { const user = await User.findById(req.user.id); const ids = (user.wishlist || []).map(String); const next = req.body.saved ? [...new Set([...ids, req.params.productId])] : ids.filter((id) => id !== req.params.productId); user.wishlist = next; await user.save(); res.json({ saved: next.includes(req.params.productId) }); }));
app.get('/api/me/addresses', asyncRoute(async (req, res) => res.json(await Address.find({ userId: req.user.id }).sort({ createdAt: -1 }))));
app.post('/api/me/addresses', asyncRoute(async (req, res) => { if (!req.body.street?.trim() || !req.body.city?.trim() || !req.body.phone?.trim()) return res.status(400).json({ error: 'Street, city, and phone are required' }); res.status(201).json(await Address.create({ ...req.body, label: req.body.label?.trim() || 'Home', street: req.body.street.trim(), city: req.body.city.trim(), phone: req.body.phone.trim(), userId: req.user.id })); }));
app.delete('/api/me/addresses/:id', asyncRoute(async (req, res) => { await Address.deleteOne({ _id: req.params.id, userId: req.user.id }); res.status(204).end(); }));
app.get('/api/me/orders', asyncRoute(async (req, res) => res.json(await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }))));
app.post('/api/me/orders', asyncRoute(async (req, res) => { const order = await Order.create({ ...req.body, userId: req.user.id, status: 'Pending', statusHistory: [{ status: 'Pending', at: new Date() }] }); res.status(201).json(order); }));

app.use('/api/admin', auth, admin);
app.get('/api/admin/dashboard', asyncRoute(async (_, res) => res.json({ products: await Product.find().sort({ createdAt: -1 }), orders: await Order.find().sort({ createdAt: -1 }) })));
app.get('/api/admin/products', asyncRoute(async (_, res) => res.json(await Product.find().sort({ createdAt: -1 }))));
app.post('/api/admin/products', asyncRoute(async (req, res) => res.status(201).json(await Product.create(cleanUpdate(req.body)))));
app.patch('/api/admin/products/:id', asyncRoute(async (req, res) => res.json(await Product.findByIdAndUpdate(req.params.id, cleanUpdate(req.body), { new: true }))));
app.delete('/api/admin/products/:id', asyncRoute(async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.status(204).end(); }));
app.get('/api/admin/categories', asyncRoute(async (_, res) => res.json(await Category.find().sort({ name: 1 }))));
app.post('/api/admin/categories', asyncRoute(async (req, res) => res.status(201).json(await Category.create(req.body))));
app.delete('/api/admin/categories/:id', asyncRoute(async (req, res) => { await Category.findByIdAndDelete(req.params.id); res.status(204).end(); }));
app.get('/api/admin/orders', asyncRoute(async (_, res) => res.json(await Order.find().sort({ createdAt: -1 }))));
app.get('/api/admin/pages', asyncRoute(async (_, res) => res.json(await Page.find().sort({ name: 1 }))));
app.post('/api/admin/pages', asyncRoute(async (req, res) => res.status(201).json(await Page.create({ ...req.body, slug: req.body.slug?.trim().toLowerCase() }))));
app.patch('/api/admin/pages/:id', asyncRoute(async (req, res) => { const update = { ...req.body }; if (update.slug) update.slug = update.slug.trim().toLowerCase(); res.json(await Page.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })); }));
app.delete('/api/admin/pages/:id', asyncRoute(async (req, res) => { await Page.findByIdAndDelete(req.params.id); res.status(204).end(); }));
app.patch('/api/admin/orders/:id', asyncRoute(async (req, res) => { const order = await Order.findById(req.params.id); order.status = req.body.status; order.statusHistory = [...(order.statusHistory || []), { status: req.body.status, at: new Date() }]; await order.save(); res.json(order); }));
app.put('/api/admin/homepage', asyncRoute(async (req, res) => res.json(await Homepage.findOneAndUpdate({ key: 'main' }, { ...req.body, key: 'main' }, { upsert: true, new: true }))));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (isProduction) { app.use(express.static(path.join(__dirname, '../dist'))); app.get('*', (_, res) => res.sendFile(path.join(__dirname, '../dist/index.html'))); }
app.use((err, _, res, __) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
 await seedContent();
 app.listen(port, () => console.log(`Server listening on ${port}`));
}).catch((err) => { console.error('MongoDB connection failed', err); process.exit(1); });
