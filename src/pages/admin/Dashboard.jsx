import { useMemo, useState } from 'react';
import useAsync from '../../hooks/useAsync';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { getAdminDashboard } from '../../lib/data';
import { formatPrice, shortOrderId } from '../../lib/format';
import { Link } from 'react-router-dom';

const LOW_STOCK_AT = 3;
const PERIODS = ['today', 'week', 'month'];

function dateInRange(value, period) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return false;
  if (period === 'today') {
    return date.toDateString() === now.toDateString();
  }
  if (period === 'week') {
    const diffDays = Math.floor((now - date) / 86400000);
    return diffDays >= 0 && diffDays <= 6;
  }
  if (period === 'month') {
    const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    return diffMonths === 0;
  }
  return true;
}

export default function Dashboard() {
  useDocumentTitle('Home — Admin');
  const [period, setPeriod] = useState('today');
  const { data, loading } = useAsync(async () => getAdminDashboard());

  const products = data?.products ?? [];
  const orders = data?.orders ?? [];
  const filteredOrders = useMemo(() => orders.filter((order) => dateInRange(order.createdAt, period) && order.status !== 'Cancelled'), [orders, period]);
  const newOrders = orders.filter((order) => order.status === 'Pending').length;
  const toShip = orders.filter((order) => ['Confirmed', 'Processing'].includes(order.status)).length;
  const lowStock = products.filter((p) => (p.stock || 0) <= LOW_STOCK_AT).length;
  const hiddenProducts = products.filter((product) => product.published === false).length;
  const totalSales = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const bestSelling = useMemo(() => {
    const counters = new Map();
    for (const order of filteredOrders) {
      for (const item of order.items || []) {
        const key = item.productId || item.name || 'unknown';
        counters.set(key, (counters.get(key) || 0) + (Number(item.quantity) || 0));
      }
    }
    return [...counters.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, qty]) => ({ key, qty, name: key }));
  }, [filteredOrders]);

  return (
    <div className="admin-dashboard">
      <section className="dashboard-welcome">
        <div>
          <span className="section-kicker">Daily view</span>
          <h1>Home</h1>
          <p>Quick actions and the next steps for the shop today.</p>
        </div>
        <div className="dashboard-period">
          {PERIODS.map((range) => (
            <button key={range} type="button" className={period === range ? 'active' : ''} onClick={() => setPeriod(range)}>
              {range === 'today' ? 'Today' : range === 'week' ? 'This week' : 'This month'}
            </button>
          ))}
        </div>
      </section>

      <div className="stat-cards">
        <Link to="/admin/orders" className="stat-card stat-card-primary">
          <div className="label">New orders waiting</div>
          <div className="value">{loading ? '—' : newOrders}</div>
          <div className="stat-note">Orders that still need your attention</div>
        </Link>
        <Link to="/admin/orders" className="stat-card">
          <div className="label">Orders to ship</div>
          <div className="value">{loading ? '—' : toShip}</div>
          <div className="stat-note">Confirmed and packed orders</div>
        </Link>
        <Link to="/admin/products" className="stat-card">
          <div className="label">Products running low</div>
          <div className="value">{loading ? '—' : lowStock}</div>
          <div className="stat-note">At or below {LOW_STOCK_AT} in stock</div>
        </Link>
        <Link to="/admin/products" className="stat-card">
          <div className="label">Hidden products</div>
          <div className="value">{loading ? '—' : hiddenProducts}</div>
          <div className="stat-note">Not showing on the website</div>
        </Link>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card-primary">
          <div className="label">Sales {period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month'}</div>
          <div className="value">{loading ? '—' : formatPrice(totalSales)}</div>
          <div className="stat-note">Cancelled orders are excluded</div>
        </div>
      </div>

      <div className="admin-panel-box recent-orders-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Fulfilment</span><h3>Recent orders</h3></div>
          <Link to="/admin/orders">Open orders <span>→</span></Link>
        </div>
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

      <div className="admin-panel-box recent-orders-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Best sellers</span><h3>Popular items</h3></div>
        </div>
        <table className="admin-table">
          <thead><tr><th>Product</th><th>Qty sold</th></tr></thead>
          <tbody>
            {!loading && bestSelling.length === 0 && <tr><td colSpan="2">No sales in this period.</td></tr>}
            {bestSelling.map((item) => (
              <tr key={item.key}>
                <td>{item.name}</td>
                <td>{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
