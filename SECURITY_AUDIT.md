# LAXSHOBHA — Security audit, fix log & runbook

Status legend: **V** = verified by reading code / running a check in this session. **U** = unverified (needs a real environment).
No secret values appear in this document. Nothing here was deployed or run against a database.

## 1. Findings (prioritised)

| # | Sev | Finding | Status |
|---|-----|---------|--------|
| 1 | Critical | **Admin privilege escalation.** `register`, `login`, `google`, and `/auth/me` promoted any user whose username / email-prefix equalled `ADMIN_USERNAME` (`isAdminUsername`). Anyone could register `admin@anything.com` before the owner. | V — fixed |
| 2 | Critical | **Order price/total/stock/status/payment trusted from the client** (`Order.create({...req.body})`). A buyer could set `total: 1`, `status: 'Delivered'`, or any `userId`-shaped field. No stock check or decrement. | V — fixed |
| 3 | Critical | **Auth contract mismatch.** Frontend sends `{email,password}`; backend required `username` (register → 400, login → lookup with `undefined`). Email/password sign-in and sign-up could not work. | V — fixed |
| 4 | High | **No CSRF defence; cookie `SameSite=None` in production**; CORS single-origin only. | V — fixed |
| 5 | High | **Mass assignment** on admin `categories`, `pages` (PATCH `...req.body`), `homepage` (PUT `...req.body`), customer `addresses` (`...req.body`), cart items (arbitrary `Array`). | V — fixed |
| 6 | High | **Draft products public**: `GET /products` returned unpublished unless `?published=true`; `GET /products/:id` ignored `published`. | V — fixed |
| 7 | High | **Production static route `app.get('*')` is invalid in Express 5** (lock resolves 5.2.1) → server would throw at startup with `NODE_ENV=production`. | V (Express 5 path syntax; not executed) — fixed |
| 8 | High | **Google account linking by email with no ownership proof** allowed pre-registration takeover; Google users got `username = email-prefix` (unique-index collisions → 500). | V — fixed |
| 9 | High | **No rate limiting / generic errors**; login distinguished nothing but registration leaked "username exists"; no timing equalisation. | V — fixed |
| 10 | High | **`.env` was inside the archive you shared** (never in git history: V). Contains DB URI, JWT secret, Google client id, and an unused plaintext `ADMIN_PASSWORD`. | V — **rotate** |
| 11 | Medium | JWT carried `role`, no `iss`/`aud`/algorithm pin, 7-day life for admins, no revocation. | V — fixed |
| 12 | Medium | PATCH product without `published` silently re-published a draft (`payload.published = true`). | V — fixed |
| 13 | Medium | Admin order PATCH accepted any status string, no transition rules, crashed on missing id; no restock on cancel. | V — fixed |
| 14 | Medium | Unbounded list endpoints; invalid ObjectId → CastError → 500; no security headers, request ids, or graceful shutdown. | V — fixed |
| 15 | Medium | Google Fonts URL malformed (missing `&`, duplicate family, Montserrat) and `commerce.css` overrode body font with Montserrat. | V — fixed |
| 16 | Medium | Gold `#C5A059` text on ivory = **2.38:1** (fails AA); `.tag-badge` used it. Many `--color-*` aliases (coral/emerald/violet/cyan/void) all equal `#4A1525`, so no real success/warning/error colours existed. | V — partly fixed (see §4) |
| 17 | Medium | Fake admin sidebar/logout on `/admin-login` ("Packages", "Blog", "Trip Facts"…) did nothing. Non-admins stayed signed in after failing admin login. | V — fixed |
| 18 | Low | `outline:none` on several inputs with only a border-colour change as focus cue; reduced-motion handled in 3 of 5 stylesheets. | V — fixed (global rule) |
| 19 | Low | `/auth/me` and login redirect `location.state.from` unchecked (open-redirect surface via crafted state is low, but unvalidated). | V — fixed |

## 2. What changed (backend)
- **Roles** exist only in the DB. Nothing at runtime derives a role from a username/email. Admins are provisioned by an operator: `server/scripts/provision-admin.js` (dry-run by default, exact normalised email, optional `ADMIN_EMAILS` safety list, bumps `tokenVersion`).
- **Auth**: email-based login/register (legacy `username` still accepted at login); bcrypt cost 12 + 72-byte cap; dummy-hash timing equalisation; Google ID token verified server-side (audience, `email_verified`, `sub`), linked by `googleSub`, never auto-linked to an unverified password account; password-reset (request/confirm, 30-min single-use SHA-256-hashed token, always 202); `logout-all`; `tokenVersion` revokes sessions on reset/promotion.
- **Sessions**: HS256 pinned, `iss`/`aud`/`exp` verified, no role in token, 7 d customers / **8 h admins**, `HttpOnly`, `Secure` (prod), `SameSite=Lax`.
- **CSRF**: exact-match Origin allow-list (CLIENT_ORIGIN) **plus** double-submit token (`csrf` cookie ↔ `X-CSRF-Token`) on every POST/PUT/PATCH/DELETE under `/api`.
- **Rate limits** (in-memory): login 10/15 min per IP+identity, register 10/h, Google 30/15 min, reset 5/h, newsletter 10/h, orders 30/h/user, global 600/min/IP.
- **Orders**: client sends only `{items:[{productId,quantity,size,color}], address, paymentMethod, customerName}`. Server loads products, rejects unpublished/unknown/invalid size, prices from DB (sale price only if lower), checks stock across split lines, reserves stock with atomic conditional `$inc` (compensating rollback on failure), sets `paymentStatus:'unpaid'`, status `Pending`. Cancelling restocks exactly once; transitions are forward-only and conditional on the current status.
- **Validation**: `server/lib/schemas.js` allow-lists every write; images must be `/path`, `https://…`, or raster `data:` URIs.
- **Ops**: security headers + CSP, request ids + JSON request logs (no bodies/cookies/queries), `/api/health` reflects DB state, JSON 404 for `/api/*`, structured error handler, SIGTERM/SIGINT graceful shutdown, Mongo timeouts, indexes (`orders.userId`, `orders.createdAt`, `products.published`, `users.email`, sparse unique `googleSub`).

## 3. What changed (frontend)
`api.js` (CSRF header, one-shot CSRF refresh, friendly network errors, 401 → `auth:expired`), `AuthContext` (no client role logic, honest logout failure, expiry listener), `Login` (safe redirects, signs out non-admins, fake admin chrome removed, forgot-password link), new `ForgotPassword` / `ResetPassword` (token in URL fragment, scrubbed from address bar), `RouteGuards` (keeps query string), `Checkout` (shows server stock/validation messages), fonts fixed (Cormorant Garamond + DM Sans), semantic tokens + AA-checked status colours added, global focus ring + reduced-motion.

## 4. Not done / deliberately deferred
- **Admin MFA is NOT implemented.** Needs a TOTP library (e.g. `otplib`) or an IdP; I did not hand-roll an auth factor. Mitigations now: 8 h admin sessions, DB-only roles, rate limits. Strongly recommended before launch (e.g. Google Workspace SSO with enforced 2SV, or TOTP).
- **Password-reset email is not wired**: `server/mailer.js` has no provider (prod logs a warning, sends nothing). Pick SES/Postmark/Resend and implement `sendPasswordReset`.
- **Payments**: only COD / bank transfer exist; orders are always `unpaid`. No gateway or webhook verification exists to verify. Admin "mark paid" flow not added.
- **Token collapse refactor of `tokens.css` (removing duplicate maroon aliases) not done** — it needs visual regression testing I could not run. Semantic tokens were added alongside; migrate usages gradually. `.cart-count` still uses gold text; contrast depends on the header background (U).
- No transactions (standalone-Mongo-compatible atomic updates used instead); no idempotency key on order submit; rate limiter is per-process.
- Responsive-table, mobile-nav and image-consistency passes were **not** done (no browser run possible here).

## 5. Migration for existing data & admins
1. Existing admins already have `role:'admin'` in the DB → they keep access. They must log in with **email** (legacy username login still works) and will be signed out once at deploy (old tokens lack `iss`/`aud`).
2. New/other admins: have them sign up normally, then run `npm run provision-admin -- --email owner@example.com` (dry run), review, re-run with `--apply`.
3. Before the first start, check for duplicate emails (unique index will silently fail to build otherwise):
   `db.users.aggregate([{$group:{_id:"$email",n:{$sum:1}}},{$match:{n:{$gt:1}}}])`
4. Delete `ADMIN_USERNAME` / `ADMIN_PASSWORD` from the environment (no longer read).

## 6. Deployment checklist
- [ ] Rotate everything in the shared `.env` (JWT secret, DB credentials, admin password, Google client if desired); confirm `.env` is only on the server / secret manager.
- [ ] `NODE_ENV=production`, `JWT_SECRET` ≥ 32 random chars, `CLIENT_ORIGIN` = exact https origin, `TRUST_PROXY` = hop count.
- [ ] Serve storefront and `/api` from the **same origin** (the Express static setup does this); cookies are `SameSite=Lax`.
- [ ] HTTPS only; HSTS is sent by the app in production.
- [ ] Production DB user: `readWrite` on this DB only, IP allow-list, TLS, automated backups + a tested restore.
- [ ] `npm ci && npm audit --omit=dev && npm test && npm run build` in CI (none could be run here).
- [ ] Configure an email provider; add admin MFA / SSO; add uptime monitoring on `/api/health`, log shipping, and error reporting.
- [ ] Run duplicate-email check (§5.3), then provision admins.
- [ ] Multi-instance? Replace the in-memory rate limiter with a shared store.

---

## 7. Follow-up pass (account page, validation, console noise)

- **Broken avatars**: `<img>` had no `onError` and sent a Referer to Google's image host. New `src/components/Avatar.jsx` sends `referrerPolicy="no-referrer"` and falls back to initials on any load failure (used in header, account heading and picture editor).
- **Profile API** (`PATCH /api/me`): now a *partial* allowlist update (`name`, `phone`, `photoURL` only), each validated when present. Picture-only updates no longer fail for Google users who have no phone saved. Pictures must be an https URL or a raster data URI of at most 400,000 characters (SVG, `javascript:` and paths are rejected).
- **Phone validation** (7–15 digits, `+ - ( )` and spaces allowed) lives in `src/lib/validation.js` and is enforced by the browser forms, registration, profile and addresses on the server.
- **Checkout** no longer sends totals/status/email (the server ignored them anyway); phone is validated and pre-filled from the account.
- **`GET /api/pages/:slug`** answers `204` when no CMS page exists for the slug (the home page requests `home` for SEO overrides; no row ⇒ previously a red 404 in the console on every visit). The client falls back to its built-in title/description.
- Tests: `tests/profile.test.js` (phone rules, profile allowlist, avatar URI rules, address phone).

## 8. Admin lock-down and product zoom

- `/admin/*` (UI): `RequireAdmin` now sends anyone who is not an admin (signed out or customer) to `/404`. The admin code is lazy-loaded behind the guard, so visitors never download it. The owner signs in at `/admin-login` (not linked from the site). An admin whose session expires mid-work is sent back to `/admin-login`.
- `/api/admin/*`: requires role `admin` **and**, when `ADMIN_EMAILS` is set, an email on that list (`isAdminAccount` in `server/lib/validate.js`). Signed-in non-admins get a plain 404. The role the browser receives is the effective one. If `ADMIN_EMAILS` is empty in production the server logs a warning and falls back to the DB role alone — set it.
- Product zoom: the gallery frame now takes the photo's own shape (most product photos are landscape 1664×928 but were cropped into a 3:4 box, then zoomed on the crop). Mouse-only zoom with an eased transform; touch devices scroll normally; reduced-motion respected.

## 9. Brand lockup, icons, zoom smoothness
- New `public/brand/mark.png` (transparent monogram cut from `logo.png`) and a proper icon set (`favicon.ico`, 16/32/48, `apple-touch-icon.png`, 192/512). The old tab icon was the full 1254px, 1.1 MB logo with wide margins, which rendered small and rough; `logo.png` is kept but no longer referenced.
- Header: monogram + serif wordmark (Cormorant Garamond, set via `--font-display` in `tokens.css`, loaded in `index.html`) + "Traditional Wear" line; the line is hidden on phones. Footer wordmark uses the same serif.
- Zoom: transform eased over 420 ms and transform-origin over 260 ms so the photo glides with the mouse.
