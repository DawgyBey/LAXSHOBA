import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found — LAXSHOBHA');
  return (
    <section className="section">
      <div className="container not-found">
        <p className="not-found-numeral" aria-hidden="true">404</p>
        <div className="not-found-copy">
          <h1>Page not found</h1>
          <p>That page has moved or never existed. The shop is still here.</p>
          <div className="not-found-actions">
            <Link to="/shop" className="btn btn-primary">Browse the shop</Link>
            <Link to="/" className="btn btn-outline">Back to home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
