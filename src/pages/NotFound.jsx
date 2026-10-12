import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found — LAXSHOBHA');
  return (
    <section className="section">
      <div className="container">
        <h1 style={{ marginBottom: 16 }}>Page not found</h1>
        <p className="empty-state">We couldn't find that page. <Link to="/shop">Browse the shop</Link></p>
      </div>
    </section>
  );
}
