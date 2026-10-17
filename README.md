# Boutique API and build

React storefront with an Express API, MongoDB data storage, and signed HTTP-only sessions.

## Local development

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
2. Install dependencies with `npm install`.
3. Start both the API and Vite with `npm run dev`.

### Google sign-in

In Google Cloud Console, create an OAuth client ID for a **Web application**. Add `http://localhost:5173` under Authorized JavaScript origins, then put the same client ID in `.env` as both `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`. For production, add the deployed storefront origin as another authorized JavaScript origin and update both variables in the deployment environment.

The Vite development server proxies `/api` to `http://localhost:10000`.

## Render deployment

Create one Render Web Service with:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAILS`, and `CLIENT_ORIGIN`

`CLIENT_ORIGIN` must be the deployed storefront origin. MongoDB Atlas must allow the Render service IP or use `0.0.0.0/0` with strong credentials and network controls.

## Security notes

- Passwords are hashed with bcrypt and never returned by the API.
- Sessions use signed, `httpOnly`, `secure` cookies in production.
- User IDs come from the verified session, not request bodies.
- Admin authorization is enforced on the server for every admin endpoint.
- Product and homepage images use durable hosted URLs. Render's local filesystem is ephemeral; connect object storage such as Cloudinary or S3 before adding binary uploads.

Set an email in `ADMIN_EMAILS` before registering the shop owner's account. Existing Firebase data is not migrated automatically; export and transform it into MongoDB before production cutover.
# LAXSHOBHA storefront

## Storefront look and feel

All styling lives in `src/styles/`: `tokens.css` (colours, the single typeface, type scale, spacing), `base.css` (reset and shared primitives), `storefront.css` and `admin.css`. No sheet other than `tokens.css` declares a colour hex or a font family.

- Announcement bar messages, the four trust points and the occasion tiles are plain lists at the bottom of `src/lib/constants.js`.
- Sale badges, "Only N left" and the sale section are calculated from each product's real `price`, `salePrice` and `stock`.
- Typography is one family (Inter, weights 400/500/600). To change it, edit `--font` in `tokens.css` and the Google Fonts `<link>` in `index.html`.
- Wishlist hearts and quick-add on product cards use the same API calls as the product page.
