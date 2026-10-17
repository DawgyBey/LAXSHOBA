import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getAdminDashboard } from '../../lib/data';
import { formatPrice, shortOrderId } from '../../lib/format';
import { Link } from 'react-router-dom';

const LOW_STOCK_AT = 3;

export default function Dashboard() {
  useDocumentTitle('Dashboard — Admin');

  const { data, loading } = useAsync(async () => {
    return getAdminDashboard();
  });

  const products = data?.products ?? [];
  const orders = data?.orders ?? [];
  const show = (value) => (data ? value : '—');

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStock = products.filter((p) => (p.stock || 0) <= LOW_STOCK_AT).length;
  const recent = orders.slice(0, 6);
  const processing = orders.filter((order) => ['Pending', 'Processing'].includes(order.status)).length;

  return (
    <div className="admin-dashboard">
      <section className="dashboard-welcome">
        <div><span className="section-kicker">Today at a glance</span><h1>Make the next move with confidence.</h1><p>Your store’s live performance, fulfillment queue, and stock pulse in one calm workspace.</p></div>
        <Link to="/admin/orders" className="dashboard-cta">Review transactions <span>→</span></Link>
      </section>

      <div className="stat-cards">
        <div className="stat-card stat-card-primary"><div className="label">Gross sales</div><div className="value">{show(formatPrice(totalSales))}</div><div className="stat-note">All recorded orders</div></div>
        <div className="stat-card"><div className="label">Orders</div><div className="value">{show(orders.length)}</div><div className="stat-note">{processing} awaiting action</div></div>
        <div className="stat-card"><div className="label">Product catalog</div><div className="value">{show(products.length)}</div><div className="stat-note">Published and draft items</div></div>
        <div className={`stat-card ${lowStock ? 'stat-card-alert' : ''}`}><div className="label">Low inventory</div><div className="value">{show(lowStock)}</div><div className="stat-note">At or below {LOW_STOCK_AT} units</div></div>
      </div>

      <div className="admin-panel-box recent-orders-panel">
        <div className="panel-heading"><div><span className="section-kicker">Fulfilment</span><h3>Recent transactions</h3></div><Link to="/admin/orders">See all <span>→</span></Link></div>
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {!loading && recent.length === 0 && <tr><td colSpan="4">No orders yet.</td></tr>}
            {recent.map((o) => (
              <tr key={o.id}>
                <td>{shortOrderId(o.id)}</td>
                <td>{o.customerName}</td>
                <td>{formatPrice(o.total)}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
