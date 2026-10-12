import { Link } from 'react-router-dom';
import { BRAND_NAME, BRAND_TAGLINE, SOCIAL_LINKS } from '../lib/constants';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-topline">
          <span>Wear what moves you.</span>
          <button type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><svg width="16" height="22" viewBox="0 0 16 22" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="M8 21V2M2 8l6-6 6 6" /></svg></button>
        </div>
        <div className="footer-grid">
          <div>
            <Link className="footer-brand" to="/">{BRAND_NAME}<span aria-hidden="true">.</span></Link>
            <p className="footer-tagline">{BRAND_TAGLINE}</p>
            <p>Traditional wear, handled with care: sarees, kurtas and festive pieces for everyday elegance.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All products</Link></li>
              <li><Link to="/shop?filter=new">New arrivals</Link></li>
              <li><Link to="/shop?filter=hot">Hot picks</Link></li>
              <li><Link to="/shop?filter=sale">Sale</Link></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/profile?tab=orders">My orders</Link></li>
              <li><Link to="/profile?tab=wishlist">Wishlist</Link></li>
              <li><Link to="/about">About us</Link></li>
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <ul>
              <li><a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span></a></li>
              <li><span className="social-handle">@laxshobha</span></li>
            </ul>
            <h4 className="footer-pay-title">Pay with</h4>
            <ul className="footer-pay">
              <li>Cash on delivery</li>
              <li>Bank transfer</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</span>
          <span>{BRAND_TAGLINE}</span>
        </div>
      </div>
    </footer>
  );
}
