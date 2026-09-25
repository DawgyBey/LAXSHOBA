import { Link } from 'react-router-dom';
import { BRAND_NAME, BRAND_TAGLINE, SOCIAL_LINKS } from '../lib/constants';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>{BRAND_NAME}</h4>
            <p className="footer-tagline">{BRAND_TAGLINE}</p>
            <p>Traditional wear, handled with care — sarees, kurtas and festive pieces for everyday elegance.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All Products</Link></li>
              <li><Link to="/shop?filter=new">New Arrivals</Link></li>
              <li><Link to="/shop?filter=hot">Hot Picks</Link></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/profile">My Orders</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>
          <div>
            <h4>Follow</h4>
            <ul>
              <li><a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span></a></li>
              <li><span className="social-handle">@laxshobha</span></li>
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
